from services.chat_service import (
    create_session_service,
    send_message_service,
    get_history_chat_service,
    get_all_history_chat_service,
    send_message_page_service,
    update_chat_session,
    delete_chat_session,
    delete_message,
    check_session_service,
    update_tag_chat_session,
    get_all_customer_service,
    sendMessage,
    send_message_fast_service
)
from models.chat import ChatSession, CustomerInfo
from services.llm_service import (get_all_llms_service)
from fastapi import WebSocket
from datetime import datetime
from models.chat import CustomerInfo
from sqlalchemy.orm import Session
import requests
from config.websocket_manager import ConnectionManager
import datetime
import json
import asyncio
from llm.llm import RAGModel
manager = ConnectionManager()
from config.database import SessionLocal


def create_session_controller(db):
    chat = create_session_service(db)    
    return {
        "id": chat
    }

def check_session_controller(sessionId, db):
    chat = check_session_service(sessionId, db)    
    return {
        "id": chat
    }
from google.oauth2.service_account import Credentials
import gspread

creds = Credentials.from_service_account_file(
    "/app/config_sheet.json",  # file service account JSON tải từ Google Cloud
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
client = gspread.authorize(creds)

spreadsheet_id = "1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs"
sheet = client.open_by_key(spreadsheet_id).sheet1    



def add_customer(customer_data: dict):

    # Lấy tiêu đề cột hiện có
    headers = sheet.row_values(1)

    # Tạo mapping JSON key -> header
    key_to_header = {
        "submit" : "Ngày submit",
        "name": "Họ tên",
        "phone": "Số điện thoại",
        "email": "Email",
        "address": "Địa chỉ", 
        "class" : "Khoá học cần đăng ký",
        "registration" : "Cơ sở đăng ký học"
    }

    # Chuẩn bị row theo thứ tự header sheet
    row = []
    for h in headers:
        # tìm key tương ứng trong JSON
        key = next((k for k, v in key_to_header.items() if v == h), None)
        value = str(customer_data.get(key, "")) if key else ""
        row.append(value if value != "None" else "") 

    # Thêm vào cuối sheet
    
    current_row_count = len(sheet.get_all_values())
    sheet.insert_row(row, index=current_row_count + 1)
    
    print("Thêm khách hàng vào Google Sheets thành công.")


async def sendMessage_controller(data: dict, db):
    try:
        message = sendMessage(data, data.get("content"), db)
        for msg in message:
                print(msg)
                await manager.broadcast_to_admins(msg)
                print("send1")
                await manager.send_to_customer(msg["chat_session_id"], msg)
                print("send2")

        return {"status": "success", "data": message}
    except Exception as e:
        print(e)






async def extract_customer_info_background(session_id: int, db, manager):
    """Background task để thu thập thông tin khách hàng"""
    try:
        # Tạo DB session mới cho background task
        db_local = SessionLocal()
        
        try:
            rag = RAGModel(db_session=db_local)
            extracted_info = rag.extract_customer_info_realtime(session_id, limit_messages=15)
            
            print("EXTRACTED JSON RESULT:", extracted_info)
            if extracted_info:
                customer_data = json.loads(extracted_info)
                
                # Kiểm tra xem đã có thông tin khách hàng này chưa
                existing_customer = db_local.query(CustomerInfo).filter(
                    CustomerInfo.chat_session_id == session_id
                ).first()
                
                if existing_customer:
                    # Cập nhật thông tin hiện có với thông tin mới
                    existing_data = existing_customer.customer_data or {}
                    
                    # Merge data: ưu tiên thông tin mới nếu không null
                    updated_data = existing_data.copy()
                    for key, value in customer_data.items():
                        if value is not None and value != "" and value != "null":
                            updated_data[key] = value
                    
                    existing_customer.customer_data = updated_data
                    print(f"📝 Cập nhật thông tin khách hàng {session_id}: {updated_data}")
                else:
                    # Tạo mới nếu chưa có
                    # Chỉ tạo mới nếu có ít nhất một thông tin hữu ích
                    has_useful_info = any(
                        v is not None and v != "" and v != "null" and v is not False 
                        for v in customer_data.values()
                    )
                    
                    if has_useful_info:
                        customer = CustomerInfo(
                            chat_session_id=session_id,
                            customer_data=customer_data
                        )
                        db_local.add(customer)
                        print(f"🆕 Tạo mới thông tin khách hàng {session_id}: {customer_data}")
                
                db_local.commit()
                
                # Gửi thông tin cập nhật đến admin
                customer_update = {
                    "chat_session_id": session_id,
                    "customer_data": existing_customer.customer_data if existing_customer else customer_data,
                    "type": "customer_info_update"
                }
                await manager.broadcast_to_admins(customer_update)
                
        finally:
            db_local.close()
                
    except Exception as extract_error:
        print(f"Lỗi khi trích xuất thông tin background: {extract_error}")

async def customer_chat(websocket: WebSocket, session_id: int, db: Session):
    await manager.connect_customer(websocket, session_id)
    
    try:
        while True:
            
            data = await websocket.receive_json()

            # Gửi tin nhắn nhanh trước (không chờ lưu DB)
            res_messages = await send_message_fast_service(data, None, db)

            # Gửi tin nhắn đến người dùng ngay lập tức
            for msg in res_messages:
                await manager.broadcast_to_admins(msg)
                await manager.send_to_customer(session_id, msg)

            # Thu thập thông tin khách hàng sau MỖI tin nhắn
            asyncio.create_task(extract_customer_info_background(session_id, db, manager))

    except Exception as e:
        print(f"Lỗi trong customer_chat: {e}")
        manager.disconnect_customer(websocket, session_id)
    # FastAPI sẽ tự động đóng db session

async def admin_chat(websocket: WebSocket, user: dict, db: Session):
        # await manager.connect(websocket)
        
        await manager.connect_admin(websocket)
        
        # Không tạo db session mới nữa - sử dụng db từ parameter
        
        try:
            while True:
                
                
                data = await websocket.receive_json()
                
                
                # await manager.broadcast(f"Message customer: {data}")
                
                # Gửi tin nhắn admin nhanh (không chờ lưu DB)
                res_messages = await send_message_fast_service(data, user, db)
                
                # # Gửi đến tất cả customer đang kết nối (có thể lọc theo session_id nếu cần)
                for msg in res_messages:
                #     await manager.broadcast(msg)
                    await manager.send_to_customer(msg["chat_session_id"], msg)
                    await manager.broadcast_to_admins(msg)
                    
                    print("Gửi")
                        

        except Exception:
            manager.disconnect_admin(websocket)
        # FastAPI sẽ tự động đóng db session
            
       
async def handle_send_message(websocket: WebSocket, data : dict, user):
    message = send_message_service(websocket, data, user)
    
    # gửi realtime cho client
    return message
    
def get_history_chat_controller(chat_session_id: int, page: int = 1, limit: int = 10, db=None):
    messages = get_history_chat_service(chat_session_id, page, limit, db)
    return messages


def get_all_history_chat_controller(db):
    messages = get_all_history_chat_service(db)
    return messages
    
def get_all_customer_controller(data: dict, db):
    customers = get_all_customer_service(data, db)
    return customers


async def update_chat_session_controller(id: int, data: dict, user, db):
    chatSession = update_chat_session(id, data, user, db)
    if not chatSession:
        return {"message": "Not Found"}
    
    
    await manager.broadcast_to_admins(chatSession)
    
    return chatSession

async def update_tag_chat_session_controller(id: int, data: dict, db):
    chatSession = update_tag_chat_session(id, data, db)
    if not chatSession:
        return {"message": "Not Found"}

    return chatSession

def parse_telegram(body: dict):
    print("ok")
    msg = body.get("message", {})
    sender_id = msg.get("from", {}).get("id")
    text = msg.get("text", "")
    
    # Kiểm tra nếu không phải tin nhắn text
    if not text:
        # Kiểm tra các loại tin nhắn khác (photo, video, document, etc.)
        text = "Hiện tại hệ thống chỉ hỗ trợ tin nhắn dạng text. Vui lòng gửi lại tin nhắn bằng văn bản."
            

    return {
        "platform": "telegram",
        "sender_id": sender_id,
        "message": text  
    }
    

def parse_facebook(body: dict):
    entry = body.get("entry", [])[0]
    page_id = entry.get("id")

    messaging_event = entry.get("messaging", [])[0]
    sender_id = messaging_event["sender"]["id"]
    timestamp = messaging_event.get("timestamp")

    timestamp_str = datetime.datetime.fromtimestamp(timestamp/1000).strftime("%Y-%m-%d %H:%M:%S")

    message = messaging_event.get("message", {})
    message_text = message.get("text", "")
    
    # Kiểm tra nếu không phải tin nhắn text
    if not message_text:
        message_text = "Hiện tại hệ thống chỉ hỗ trợ tin nhắn dạng text. Vui lòng gửi lại tin nhắn bằng văn bản."


    return {
        "platform": "facebook",
        "page_id": page_id,
        "sender_id": sender_id,
        "message": message_text,
        "timestamp": timestamp_str
    }


def parse_zalo(body: dict):
    event_name = body.get("event_name")
    sender_id = None
    text = None

    if event_name == "user_send_text":
        sender_id = body["sender"]["id"]
        text = body["message"]["text"]
    else:
        # Xử lý các loại tin nhắn không phải text
        sender_id = body["sender"]["id"]
        text = "Hiện tại hệ thống chỉ hỗ trợ tin nhắn dạng text. Vui lòng gửi lại tin nhắn bằng văn bản."
        

    return {
        "platform": "zalo",
        "sender_id": sender_id,
        "message": text
    }

async def chat_platform(channel, body: dict, db):
    
    
    data = None
    
    if channel == "tele":
        data = parse_telegram(body)
        print("ok")
    
    elif channel == "fb":
        data = parse_facebook(body)
     
    elif channel == "zalo":
        data = parse_zalo(body)
        
        
     
    message = send_message_page_service(data, db)   
    
    for msg in message:
        await manager.broadcast_to_admins(msg)
    
    # Thu thập thông tin khách hàng sau MỖI tin nhắn từ platform
    if message:
        session_id = message[0].get("chat_session_id")
        
        try:
            rag = RAGModel()
            extracted_info = rag.extract_customer_info_realtime(session_id, limit_messages=15)
            
            if extracted_info:
                customer_data = json.loads(extracted_info)
                
                # ✅ Kiểm tra có thông tin hữu ích không
                has_useful_info = any(
                    v is not None and v != "" and v != "null" and v is not False 
                    for v in customer_data.values()
                )
                
                # ✅ CHỈ xử lý khi có thông tin hữu ích
                if has_useful_info:
                    # Kiểm tra xem đã có thông tin khách hàng này chưa
                    existing_customer = db.query(CustomerInfo).filter(
                        CustomerInfo.chat_session_id == session_id
                    ).first()
                    
                    if existing_customer:
                        # Cập nhật thông tin hiện có với thông tin mới
                        existing_data = existing_customer.customer_data or {}
                        
                        # Merge data: ưu tiên thông tin mới nếu không null
                        updated_data = existing_data.copy()
                        for key, value in customer_data.items():
                            if value is not None and value != "" and value != "null":
                                updated_data[key] = value
                        
                        existing_customer.customer_data = updated_data
                        print(f"📝 Cập nhật thông tin khách hàng {session_id}: {updated_data}")
                    else:
                        # Tạo mới nếu chưa có
                        # Chỉ tạo mới nếu có ít nhất một thông tin hữu ích
                        has_useful_info = any(
                            v is not None and v != "" and v != "null" and v is not False 
                            for v in customer_data.values()
                        )
                        
                        if has_useful_info:
                            customer = CustomerInfo(
                                chat_session_id=session_id,
                                customer_data=customer_data
                            )
                            db.add(customer)
                            print(f"🆕 Tạo mới thông tin khách hàng {session_id}: {customer_data}")
                    
                    db.commit()
                    
                    # ✅ Cập nhật alert = "true" cho chat session
                    chat_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
                    if chat_session:
                        chat_session.alert = "true"
                        db.commit()
                        print(f"🔔 Đã set alert = true cho session {session_id}")
                    
                    # ✅ CHỈ gửi thông báo khi có thông tin hữu ích
                    customer_update = {
                        "chat_session_id": session_id,
                        "customer_data": existing_customer.customer_data if existing_customer else customer_data,
                        "type": "customer_info_update"
                    }
                    await manager.broadcast_to_admins(customer_update)
                    print(f"📤 Đã gửi thông báo cập nhật thông tin khách hàng {session_id}")
                else:
                    print(f"ℹ️ Không có thông tin hữu ích cho session {session_id} - bỏ qua")
                
        except Exception as extract_error:
            print(f"Lỗi khi trích xuất thông tin: {extract_error}")

def delete_chat_session_controller(ids: list[int], db):
    deleted_count = delete_chat_session(ids, db)   # gọi xuống service
    return {
        "deleted": deleted_count,
        "ids": ids
    }

def delete_message_controller(chatId: int, ids: list[int], db):
    deleted_count = delete_message(chatId, ids, db)   # gọi xuống service
    return {
        "deleted": deleted_count,
        "ids": ids
    }