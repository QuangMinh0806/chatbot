import json
import traceback
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.llm import LLM
from models.chat import ChatSession, Message, CustomerInfo
from llm.llm import RAGModel as Gemini_RAGModel
from llm.gpt import RAGModel as GPT_RAGModel
from config.redis_cache import cache_set
from google.oauth2.service_account import Credentials
from models.knowledge_base import KnowledgeBase
import gspread
from config.database import SessionLocal
import os

client = None
sheet = None

def init_gsheets(db=None, force=False):
    """Khởi tạo client + sheet (lazy init)."""
    global client, sheet
    if client and sheet and not force:
        return

    try:
        # Nếu chưa có session thì tự tạo
        if db is None:
            db = SessionLocal()

        json_path = os.getenv('GSHEET_SERVICE_ACCOUNT', 'config/config_sheet.json')
        if not os.path.exists(json_path):
            client = None
            sheet = None
            return

        creds = Credentials.from_service_account_file(
            json_path,
            scopes=["https://www.googleapis.com/auth/spreadsheets"]
        )
        client = gspread.authorize(creds)

        # ✅ Truy vấn KnowledgeBase.id = 1 từ DB
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == 1).first()
        if not kb:
            sheet = None
            return

        spreadsheet_id = kb.customer_id
        if not spreadsheet_id:
            sheet = None
            return

        # Mở Google Sheets
        sheet = client.open_by_key(spreadsheet_id).sheet1
        print(f"✅ Google Sheets initialized: {sheet.title}")

    except Exception as e:
        print(f"⚠️ Google Sheets not initialized: {e}")
        client = None
        sheet = None
    finally:
        if db:
            db.close()

# Gọi init khi module load (tuỳ bạn có muốn)
init_gsheets()


def add_customer(customer_data: dict, db: Session):
    global sheet
    # Nếu sheet chưa có, cố khởi tạo lại
    if sheet is None:
        init_gsheets()
        if sheet is None:
            return

    try:
        from services.field_config_service import get_all_field_configs_service

        field_configs = get_all_field_configs_service(db)
        field_configs.sort(key=lambda x: x.excel_column_letter)

        if not field_configs:
            return

        headers = [config.excel_column_name for config in field_configs]

        # Xây row: nếu key không khớp, thử các phương án khác
        row = []
        has_all_required = True
        for config in field_configs:
            value = customer_data.get(config.excel_column_name)
            if value is None:
                # thử fallback nếu tên trường khác
                value = customer_data.get(config.excel_column_letter) or customer_data.get('name') or ""
            if value in (None, "None", "null"):
                value = ""
            value_str = str(value).strip()
            if config.is_required and value_str == "":
                has_all_required = False
            row.append(value_str)


        try:
            current_headers = sheet.row_values(1)
        except Exception as e:
            print("⚠️ Không đọc được header hiện tại:", e)
            current_headers = []

        if current_headers != headers:
            try:
                sheet.clear()
                sheet.insert_row(headers, 1)
                print("✅ Cập nhật header trên Sheet.")
            except Exception as e:
                print("⚠️ Lỗi khi ghi header:", e)
                # thử append làm ngách
                try:
                    sheet.append_row(headers)
                except Exception as e2:
                    print("⚠️ Vẫn lỗi khi thêm header:", e2)
        # Chỉ append nếu có ít nhất 1 ô không rỗng
        if any(cell.strip() for cell in row):
            if has_all_required:
                try:
                    sheet.append_row(row, value_input_option='USER_ENTERED')
                    print("✅ Đã thêm row vào Google Sheets.")
                except Exception as e:
                    print("⚠️ Lỗi khi append row:", e)
        else:
            print("⚠️ Bỏ qua: row hoàn toàn rỗng (không có dữ liệu).")

    except Exception as e:
        print(f"Lỗi khi thêm customer vào Sheet: {e}")

async def extract_customer_info_background(session_id: int, db, manager):
    """Background task để thu thập thông tin khách hàng"""
    try:
        model = db.query(LLM).first()
        if model.name == "gemini":
            rag = Gemini_RAGModel(db_session=db)
        else:
            rag = GPT_RAGModel(db_session=db)
        extracted_info = rag.extract_customer_info_realtime(session_id, limit_messages=15)
        
        print("EXTRACTED JSON RESULT:", extracted_info)
        if extracted_info:
            customer_data = json.loads(extracted_info)
            has_useful_info = any(
                        v is not None and v != "" and v != "null" and v is not False
                        for v in customer_data.values()
                    )
            
            if has_useful_info:
                # Kiểm tra xem đã có thông tin khách hàng này chưa
                existing_customer = db.query(CustomerInfo).filter(
                    CustomerInfo.chat_session_id == session_id
                ).first()
                
                should_set_alert = False  # ✅ Flag để xác định có nên set alert không
                final_customer_data = None
                
                if existing_customer:
                    # Cập nhật thông tin hiện có với thông tin mới
                    existing_data = existing_customer.customer_data or {}
                    
                    # Merge data: ưu tiên thông tin mới nếu không null
                    updated_data = existing_data.copy()
                    has_new_info = False
                    
                    for key, value in customer_data.items():
                        if value is not None and value != "" and value != "null":
                            if key not in existing_data or existing_data[key] != value:
                                updated_data[key] = value
                                has_new_info = True
                    
                    existing_customer.customer_data = updated_data
                    final_customer_data = updated_data
                    print(f"📝 Cập nhật thông tin khách hàng {session_id}: {updated_data}")
                    print(f"DEBUG: has_new_info = {has_new_info}")
                    # ✅ Chỉ set alert nếu có thông tin mới
                    if has_new_info:
                        should_set_alert = True
                else:
                    # Tạo mới nếu chưa có
                    customer = CustomerInfo(
                        chat_session_id=session_id,
                        customer_data=customer_data
                    )
                    db.add(customer)
                    final_customer_data = customer_data
                    should_set_alert = True
                    print(f"🆕 Tạo mới thông tin khách hàng {session_id}: {customer_data}")
                
            # ✅ Set alert nếu cần
                if should_set_alert:
                    chat_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
                    if chat_session:
                        chat_session.alert = "true"

                db.commit()
                if  should_set_alert and final_customer_data:
                    try:
                        add_customer(final_customer_data, db)
                        print(f"📊 Đã sync customer {session_id} lên Google Sheets")
                    except Exception as sheet_error:
                        print(f"⚠️ Lỗi khi sync lên Google Sheets: {sheet_error}")
                
                # ✅ Gửi WebSocket nếu có thông tin cần cập nhật
                if should_set_alert and final_customer_data:
                    customer_update = {
                        "chat_session_id": session_id,
                        "customer_data": final_customer_data,
                        "type": "customer_info_update"
                    }
                    await manager.broadcast_to_admins(customer_update)
                    print(f"📡 Đã gửi customer_info_update cho session {session_id}")
                
                
    except Exception as extract_error:
        print(f"Lỗi khi trích xuất thông tin background: {extract_error}")


async def save_message_to_db_async(data: dict, sender_name: str, image_url: list, db: Session):
    try:
        message = Message(
            chat_session_id=data.get("chat_session_id"),
            sender_type=data.get("sender_type"),
            content=data.get("content"),
            sender_name=sender_name,
            image=json.dumps(image_url) if image_url else None
        )
        db.add(message)
        db.commit()
        print(f"✅ Đã lưu tin nhắn ID: {message.id}")
        
    except Exception as e:
        print(f"❌ Lỗi lưu tin nhắn: {e}")
        traceback.print_exc()
        db.rollback()


async def update_session_admin_async(chat_session_id: int, sender_name: str, db: Session):
    """Cập nhật session khi admin reply bất đồng bộ"""
    try:
        db_session = db.query(ChatSession).filter(ChatSession.id == chat_session_id).first()
        if db_session:
            db_session.status = "false"
            db_session.time = datetime.now() + timedelta(hours=1)
            db_session.previous_receiver = db_session.current_receiver
            db_session.current_receiver = sender_name
            db.commit()
            
            # Cập nhật cache
            session_cache_key = f"session:{chat_session_id}"
            session_data = {
                'id': db_session.id,
                'name': db_session.name,
                'status': db_session.status,
                'channel': db_session.channel,
                'page_id': db_session.page_id,
                'current_receiver': db_session.current_receiver,
                'previous_receiver': db_session.previous_receiver,
                'time': db_session.time.isoformat() if db_session.time else None
            }
            cache_set(session_cache_key, session_data, ttl=300)
            
    except Exception as e:
        print(f"❌ Lỗi cập nhật session: {e}")