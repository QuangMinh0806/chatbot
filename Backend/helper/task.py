import asyncio
import json
import traceback
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.chat import ChatSession, Message, CustomerInfo
from llm.llm import RAGModel
from config.redis_cache import cache_set
from config.database import AsyncSessionLocal


async def extract_customer_info_background(session_id: int, db, manager):
    """Background task để thu thập thông tin khách hàng"""
    # Tạo session mới cho background task
    async with AsyncSessionLocal() as new_db:
        try:
            
            
            rag = RAGModel(db_session=new_db)
            await rag.initialize()
            extracted_info = await rag.extract_customer_info_realtime(session_id, limit_messages=15)
        
            print("EXTRACTED JSON RESULT:", extracted_info)
            if extracted_info:
                customer_data = json.loads(extracted_info)
                has_useful_info = any(
                            v is not None and v != "" and v != "null" and v is not False
                            for v in customer_data.values()
                        )
                
                if has_useful_info:
                    # Kiểm tra xem đã có thông tin khách hàng này chưa
                    result = await new_db.execute(
                        select(CustomerInfo).filter(CustomerInfo.chat_session_id == session_id)
                    )
                    existing_customer = result.scalar_one_or_none()
                    
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
                        
                        # ✅ Chỉ set alert nếu có thông tin mới
                        if has_new_info:
                            should_set_alert = True
                    else:
                        # Tạo mới nếu chưa có
                        customer = CustomerInfo(
                            chat_session_id=session_id,
                            customer_data=customer_data
                        )
                        new_db.add(customer)
                        final_customer_data = customer_data
                        should_set_alert = True
                        print(f"🆕 Tạo mới thông tin khách hàng {session_id}: {customer_data}")
                    
                    # ✅ Set alert nếu cần
                    if should_set_alert:
                        result = await new_db.execute(select(ChatSession).filter(ChatSession.id == session_id))
                        chat_session = result.scalar_one_or_none()
                        if chat_session:
                            chat_session.alert = "true"
                            print(f"🔔 Bật thông báo alert cho session {session_id}")
                    
                    await new_db.commit()
                    
                    if should_set_alert and final_customer_data:
                        try:
                            from controllers.chat_controller import add_customer
                            await add_customer(final_customer_data, new_db)
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
    """Lưu tin nhắn vào database - sử dụng DB session từ tham số"""
    try:
        message = Message(
            chat_session_id=data.get("chat_session_id"),
            sender_type=data.get("sender_type"),
            content=data.get("content"),
            sender_name=sender_name,
            image=json.dumps(image_url) if image_url else None
        )
        db.add(message)
        await db.commit()
        print(f"✅ Đã lưu tin nhắn ID: {message.id}")
        
    except Exception as e:
        print(f"❌ Lỗi lưu tin nhắn: {e}")
        traceback.print_exc()
        await db.rollback()


async def save_message_to_db_background(data: dict, sender_name: str, image_url: list):
    """Background task: Tạo DB session riêng để lưu tin nhắn"""
    async with AsyncSessionLocal() as new_db:
        try:
            message = Message(
                chat_session_id=data.get("chat_session_id"),
                sender_type=data.get("sender_type"),
                content=data.get("content"),
                sender_name=sender_name,
                image=json.dumps(image_url) if image_url else None
            )
            new_db.add(message)
            await new_db.commit()
            print(f"✅ [Background] Đã lưu tin nhắn ID: {message.id}")
            
        except Exception as e:
            print(f"❌ [Background] Lỗi lưu tin nhắn: {e}")
            traceback.print_exc()
            await new_db.rollback()


async def update_session_admin_async(chat_session_id: int, sender_name: str, db: Session):
    """Cập nhật session khi admin reply - sử dụng DB session từ tham số"""
    try:
        result = await db.execute(select(ChatSession).filter(ChatSession.id == chat_session_id))
        db_session = result.scalar_one_or_none()
        if db_session:
            db_session.status = "false"
            db_session.time = datetime.now() + timedelta(hours=1)
            db_session.previous_receiver = db_session.current_receiver
            db_session.current_receiver = sender_name
            await db.commit()
            
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


async def update_session_admin_background(chat_session_id: int, sender_name: str):
    """Background task: Tạo DB session riêng để cập nhật session"""
    async with AsyncSessionLocal() as new_db:
        try:
            result = await new_db.execute(select(ChatSession).filter(ChatSession.id == chat_session_id))
            db_session = result.scalar_one_or_none()
            if db_session:
                db_session.status = "false"
                db_session.time = datetime.now() + timedelta(hours=1)
                db_session.previous_receiver = db_session.current_receiver
                db_session.current_receiver = sender_name
                await new_db.commit()
                
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
                print(f"✅ [Background] Đã cập nhật session {chat_session_id}")
                
        except Exception as e:
            print(f"❌ [Background] Lỗi cập nhật session: {e}")
            traceback.print_exc()
            await new_db.rollback()
