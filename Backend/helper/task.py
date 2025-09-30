import asyncio
import json
import traceback
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.chat import ChatSession, Message, CustomerInfo
from llm.llm import RAGModel
from config.redis_cache import cache_set


async def extract_customer_info_background(session_id: int, db, manager):
    """Background task để thu thập thông tin khách hàng"""
    try:
        
        
        rag = RAGModel(db_session=db)
        extracted_info = rag.extract_customer_info_realtime(session_id, limit_messages=15)
        
        print("EXTRACTED JSON RESULT:", extracted_info)
        if extracted_info:
            customer_data = json.loads(extracted_info)
            
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
            
            # Gửi thông tin cập nhật đến admin
            customer_update = {
                "chat_session_id": session_id,
                "customer_data": existing_customer.customer_data if existing_customer else customer_data,
                "type": "customer_info_update"
            }
            await manager.broadcast_to_admins(customer_update)
                
                
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
