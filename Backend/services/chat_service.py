import random
import asyncio
import base64
import io
from typing import Any, Dict
from sqlalchemy.orm import Session
from models.chat import ChatSession, Message, CustomerInfo
from models.facebook_page import FacebookPage
from models.telegram_page import TelegramBot
from models.zalo import ZaloBot 
from config.database import SessionLocal, AsyncSessionLocal
from sqlalchemy import text, select
from models.llm import LLM  # Import LLM model để check name
from datetime import datetime, timedelta
from fastapi import WebSocket
import random
import json
import requests
import traceback
from config.save_base64_image import save_base64_image
from config.redis_cache import cache_get, cache_set, cache_delete
from helper.task import (
    save_message_to_db_async, 
    update_session_admin_async, 
    save_message_to_db_background, 
    update_session_admin_background,
    send_to_platform_background,
    generate_and_send_bot_response_background,
    generate_and_send_platform_bot_response_background
)
from llm.help_llm import initialize_model, get_model_config, clear_model_config_cache
import time


async def generate_response(db_session, query: str, chat_session_id: int) -> str:

    try:
        # Lấy cấu hình model
        config = await get_model_config(db_session)
        
        # Khởi tạo model phù hợp
        model = await initialize_model(db_session)
        
        # Generate response dựa trên model type
        if config["model_type"] == "gpt":
            from llm.gpt import generate_gpt_response
            return await generate_gpt_response(model, db_session, query, chat_session_id)
        else:
            from llm.gemini import generate_gemini_response
            return await generate_gemini_response(model, db_session, query, chat_session_id)
            
    except Exception as e:
        print(f"❌ Error generating response: {e}")
        return "Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn."


def clear_model_type_cache():
    """Clear cache loại model khi có thay đổi cấu hình LLM"""
    clear_model_config_cache()
    print("✅ Model type cache cleared")

async def create_session_service(db):
    session = ChatSession(
        name=f"W-{random.randint(10**7, 10**8 - 1)}",
        channel="web",
        url_channel = "https://chatbotbe.a2alab.vn/chat"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session.id

async def update_tag_chat_session(id: int, data: dict, db):
    result = await db.execute(select(ChatSession).filter(ChatSession.id == id))
    chatSession = result.scalar_one_or_none()
    if not chatSession:
        return None
    from models.tag import Tag
    result = await db.execute(select(Tag).filter(Tag.id.in_(data["tags"])))
    tags = result.scalars().all()
    chatSession.tags = tags
    await db.commit()
    await db.refresh(chatSession)
    
    # Clear cache sau khi update
    clear_session_cache(id)
    
    return chatSession
        
async def check_session_service(sessionId, db):
    result = await db.execute(select(ChatSession).filter(ChatSession.id == sessionId))
    session = result.scalar_one_or_none()
    if session:
        return session.id
    
    session = ChatSession(
        name=f"W-{random.randint(10**7, 10**8 - 1)}",
        channel="web",
        url_channel = "https://chatbotbe.a2alab.vn/chat"
    )
    
    db.add(session)
    await db.flush()   # để session.id được gán ngay
    session_id = session.id
    await db.commit()
    return session_id
    
async def send_message_service(data: dict, user, db):
    print("ngon")
    sender_name = user.get("fullname") if user else None
    image_url = []
    if data.get("image"):
        try:
            image_url = save_base64_image(data.get("image"))
        except Exception as e:
            print("Error saving images:", e)
            traceback.print_exc()
            
            
    # Tin nhắn đến
    message = Message(
        chat_session_id=data.get("chat_session_id"),
        sender_type=data.get("sender_type"),
        content=data.get("content"),
        sender_name=sender_name,
        image = json.dumps(image_url) if image_url else None
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    print("ngon")
    
    response_messages = []  
    
    # Cache session với Redis
    chat_session_id = data.get("chat_session_id")
    session_cache_key = f"session:{chat_session_id}"
    
    # Kiểm tra cache trước
    cached_session = cache_get(session_cache_key)
    if cached_session:
        # Tạo session object từ cache
        session = ChatSession(
            id=cached_session['id'],
            name=cached_session['name'],
            status=cached_session['status'],
            channel=cached_session['channel'],
            page_id=cached_session.get('page_id'),
            current_receiver=cached_session.get('current_receiver'),
            previous_receiver=cached_session.get('previous_receiver'),
            time=datetime.fromisoformat(cached_session['time']) if cached_session.get('time') else None
        )
    else:
        # Lấy từ database và cache lại
        result = await db.execute(select(ChatSession).filter(ChatSession.id == chat_session_id))
        session = result.scalar_one_or_none()
        if session:
            session_data = {
                'id': session.id,
                'name': session.name,
                'status': session.status,
                'channel': session.channel,
                'page_id': session.page_id,
                'current_receiver': session.current_receiver,
                'previous_receiver': session.previous_receiver,
                'time': session.time.isoformat() if session.time else None
            }
            cache_set(session_cache_key, session_data, ttl=300)  # Cache 5 phút
    
    
    
    response_messages.append({
        "id": message.id,
        "chat_session_id": message.chat_session_id,
        "sender_type": message.sender_type,
        "sender_name": message.sender_name,
        "content": message.content,
        "image": json.loads(message.image) if message.image else [],
        "session_name": session.name,
        "session_status" : session.status
    })
    
    
    if data.get("sender_type") == "admin":
        result = await db.execute(select(ChatSession).filter(ChatSession.id == chat_session_id))
        db_session = result.scalar_one_or_none()
        db_session.status = "false" 
        db_session.time = datetime.now() + timedelta(hours=1)
        db_session.previous_receiver = db_session.current_receiver 
        db_session.current_receiver = sender_name
        
        await db.commit()
        
        # Cập nhật cache
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
        
        # Cập nhật session object cho response
        session = db_session
        
        response_messages[0] = {
            "id": message.id,
            "chat_session_id": session.id,
            "sender_type": message.sender_type,
            "sender_name": message.sender_name,
            "content": message.content,
            "image": json.loads(message.image) if message.image else [],
            "session_name": session.name,
            "session_status": session.status,
            "current_receiver": session.current_receiver,
            "previous_receiver": session.previous_receiver,
            "time" : session.time.isoformat()
        }

        
        name_to_send = session.name[2:]
        
        if session.channel == "facebook":
            
            send_fb(session.page_id, name_to_send, message, image_url, db)
        elif session.channel == "telegram":
            send_telegram(name_to_send, message, db)
        elif session.channel == "zalo":
            send_zalo(name_to_send, message, None, db)
        
        
        
        return response_messages
    
    
    
    elif await check_repply_cached(chat_session_id, db) :
        
        print("ok")
        mes = await generate_response(db, message.content, session.id)
        
        
        
        message_bot = Message(
            chat_session_id=data.get("chat_session_id"),
            sender_type="bot",
            content=mes
        )
        db.add(message_bot)
        await db.commit()
        await db.refresh(message_bot)

        print(message_bot)
        
        response_messages.append({
            "id": message_bot.id,
            "chat_session_id": message_bot.chat_session_id,
            "sender_type": message_bot.sender_type,
            "sender_name": message_bot.sender_name,
            "content": message_bot.content,
            "session_name": session.name,
            "session_status" : session.status,
            "current_receiver": session.current_receiver,
            "previous_receiver": session.previous_receiver
        })
    
    
    print("ok in")
    
                    
    return response_messages

async def send_message_fast_service(data: dict, user, db):

    sender_name = user.get("fullname") if user else None
    chat_session_id = data.get("chat_session_id")
    
    # Xử lý ảnh nếu có
    image_url = []
    if data.get("image"):
        try:
            image_url = save_base64_image(data.get("image"))
        except Exception as e:
            print("❌ Error saving images:", e) 
            traceback.print_exc()
    
    session_data = None
    response_messages = []
    # Lấy session từ cache hoặc database  
    session_cache_key = f"session:{chat_session_id}"
    cached_session = cache_get(session_cache_key)
    
    if not cached_session :
        
        result = await db.execute(select(ChatSession).filter(ChatSession.id == chat_session_id))
        session = result.scalar_one_or_none()
        
        if not session:
            return []
        
        session_data = {
            'id': session.id,
            'name': session.name,
            'status': session.status,
            'channel': session.channel,
            'page_id': session.page_id,
            'current_receiver': session.current_receiver,
            'previous_receiver': session.previous_receiver,
            'time': session.time.isoformat() if session.time else None
        }
        
        cache_set(session_cache_key, session_data, ttl=300)
        

            
    
    else:
        session_data  = cached_session
        
    user_message = {
        "id": None,
        "chat_session_id": chat_session_id,
        "sender_type": data.get("sender_type"),
        "sender_name": sender_name,
        "content": data.get("content"),
        "image": image_url,
        "session_name": session_data["name"],
        "session_status": session_data["status"]
    }
    
    response_messages.append(user_message)
    
    # 🚀 Lưu tin nhắn vào database (background task với DB session riêng)
    asyncio.create_task(save_message_to_db_background(data, sender_name, image_url))
    
    # Xử lý admin message
    if data.get("sender_type") == "admin":
        # 🚀 Cập nhật session status (background task với DB session riêng)
        asyncio.create_task(update_session_admin_background(chat_session_id, sender_name))
        
        response_messages[0] = {
            "id": None,
            "chat_session_id": chat_session_id,
            "sender_type": data.get("sender_type"),
            "sender_name": sender_name,
            "content": data.get("content"),
            "image": image_url,
            "session_name": session_data["name"],
            "session_status": "false",
            "current_receiver": sender_name,
            "previous_receiver": session_data["previous_receiver"],
            "time": (datetime.now() + timedelta(hours=1)).isoformat()
        }

        # 🚀 Gửi tin nhắn đến platform trong background (không block)
        name_to_send = session_data["name"][2:]
        asyncio.create_task(send_to_platform_background(
            session_data["channel"], 
            session_data.get("page_id"),
            name_to_send, 
            response_messages[0], 
            data.get("image")
        ))
            
        return response_messages
    
    # 🚀 Xử lý bot reply trong background (không block WebSocket)
    should_reply = await check_repply_cached(chat_session_id, db)
    if should_reply:
        asyncio.create_task(generate_and_send_bot_response_background(
            data.get("content"),
            chat_session_id,
            session_data
        ))
        
    
    return response_messages


async def send_to_platform_async(session, data, sender_name, db: Session):
    """DEPRECATED: Gửi tin nhắn đến platform bất đồng bộ - Sử dụng send_to_platform_background thay thế"""
    try:
        name_to_send = session.name[2:]
        
        if session.channel == "facebook":
            # Gọi hàm send_fb bất đồng bộ
            pass
        elif session.channel == "telegram":
            # Gọi hàm send_telegram bất đồng bộ
            pass
        elif session.channel == "zalo":
            # Gọi hàm send_zalo bất đồng bộ
            pass
            
    except Exception as e:
        print(f"❌ Lỗi gửi tin nhắn platform: {e}")

async def generate_and_send_bot_response_async(data: dict, chat_session_id: int, session, db: Session):
    try:
        mes = await generate_response(db, data.get("content"), session.id)
        
        message_bot = Message(
            chat_session_id=chat_session_id,
            sender_type="bot",
            content=mes
        )
        db.add(message_bot)
        db.commit()
        db.refresh(message_bot)
        
        # Tạo bot message để gửi qua websocket
        bot_message = {
            "id": message_bot.id,
            "chat_session_id": message_bot.chat_session_id,
            "sender_type": message_bot.sender_type,
            "sender_name": message_bot.sender_name,
            "content": message_bot.content,
            "session_name": session.name,
            "session_status": session.status,
            "current_receiver": session.current_receiver,
            "previous_receiver": session.previous_receiver
        }
        
        # Import manager ở đây để tránh circular import
        from config.websocket_manager import ConnectionManager
        manager = ConnectionManager()
        
        # Gửi bot response qua websocket
        await manager.broadcast_to_admins(bot_message)
        await manager.send_to_customer(chat_session_id, bot_message)
        
        print(f"✅ Đã gửi bot response ID: {message_bot.id}")
        
    except Exception as e:
        print(f"❌ Lỗi tạo bot response: {e}")
        traceback.print_exc()
        db.rollback()

async def get_history_chat_service(chat_session_id: int, page: int = 1, limit: int = 10, db=None):
    offset = (page - 1) * limit
    
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Message.id)).filter(Message.chat_session_id == chat_session_id)
    )
    total_messages = result.scalar()

    result = await db.execute(
        select(Message)
        .filter(Message.chat_session_id == chat_session_id)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    messages = result.scalars().all()
    
    messages = list(reversed(messages))
    
    # Detach objects from session để tránh UPDATE không mong muốn
    for msg in messages:
        db.expunge(msg)
        try:
            msg.image = json.loads(msg.image) if msg.image else []
        except Exception:
            msg.image = []

    return messages
    
async def get_all_history_chat_service(db):
    try:
        query = text("""
                SELECT 
                    cs.id AS session_id,
                    cs.status,
                    cs.channel,
                    cs.url_channel,
                    cs.alert,
                    ci.customer_data::text AS customer_data, 
                    cs.name,
                    cs.time,
                    cs.current_receiver,
                    cs.previous_receiver,
                    m.sender_type,
                    m.content,
                    m.sender_name, 
                    m.created_at AS created_at,
                    COALESCE(JSON_AGG(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') AS tag_names,
                    COALESCE(JSON_AGG(t.id) FILTER (WHERE t.id IS NOT NULL), '[]') AS tag_ids
                FROM chat_sessions cs
                LEFT JOIN customer_info ci ON cs.id = ci.chat_session_id
                JOIN messages m ON cs.id = m.chat_session_id
                JOIN (
                    SELECT
                        chat_session_id,
                        MAX(created_at) AS latest_time
                    FROM messages
                    GROUP BY chat_session_id
                ) AS latest ON cs.id = latest.chat_session_id AND m.created_at = latest.latest_time
                LEFT JOIN chat_session_tag cst ON cs.id = cst.chat_session_id
                LEFT JOIN tag t ON t.id = cst.tag_id
                GROUP BY 
                    cs.id, cs.status, cs.channel, ci.customer_data::text,
                    cs.name, cs.time, cs.alert, cs.current_receiver, cs.previous_receiver,
                    m.sender_type, m.content, m.sender_name, m.created_at
                ORDER BY m.created_at DESC;
        """)
        
        result = await db.execute(query)
        rows = result.fetchall()
        conversations = []
        for row in rows:
            row_dict = dict(row._mapping)
            try:
                row_dict["image"] = json.loads(row_dict["image"]) if row_dict.get("image") else []
            except Exception:
                row_dict["image"] = []  
            conversations.append(row_dict)
            
        return conversations
    except Exception as e:
        print(e)
        traceback.print_exc()

async def get_all_customer_service(data: dict, db):
    channel = data.get("channel")
    tag_id = data.get("tag_id")

    query = """
        SELECT DISTINCT
            cs.id AS session_id,
            cs.channel,
            cs.name,
            cs.page_id
        FROM chat_sessions cs
    """

    conditions = []
    params = {}

    if tag_id:
        query += " INNER JOIN chat_session_tag cst ON cs.id = cst.chat_session_id"
        conditions.append("cst.tag_id = :tag_id")
        params["tag_id"] = tag_id

    if channel:
        conditions.append("cs.channel = :channel")
        params["channel"] = channel

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY cs.id DESC;"

    stmt = text(query)
    result = await db.execute(stmt, params)
    rows = result.mappings().all()

    # result lúc này là list[RowMapping] → có thể convert sang list[dict]
    return [dict(row) for row in rows]

async def check_repply_cached(id: int, db):
    """Check repply với Redis cache"""
    try:
        # Kiểm tra cache trước
        repply_cache_key = f"check_repply:{id}"
        cached_result = cache_get(repply_cache_key)
        
        if cached_result is not None:
            return cached_result['can_reply']
        
        # Lấy session từ cache hoặc database
        session_cache_key = f"session:{id}"
        cached_session = cache_get(session_cache_key)
        
        if cached_session:
            session_status = cached_session['status']
            session_time = datetime.fromisoformat(cached_session['time']) if cached_session.get('time') else None
        else:
            result = await db.execute(select(ChatSession).filter(ChatSession.id == id))
            session = result.scalar_one_or_none()
            if not session:
                return False
            session_status = session.status
            session_time = session.time
        
        can_reply = False
        
        # Logic check repply
        if session_time and datetime.now() > session_time and session_status == "false":
            # Cập nhật database
            result = await db.execute(select(ChatSession).filter(ChatSession.id == id))
            session = result.scalar_one_or_none()
            if session:
                session.status = "true"
                session.time = None
                await db.commit()
                await db.refresh(session)
                
                # Cập nhật cache session
                session_data = {
                    'id': session.id,
                    'name': session.name,
                    'status': session.status,
                    'channel': session.channel,
                    'page_id': session.page_id,
                    'current_receiver': session.current_receiver,
                    'previous_receiver': session.previous_receiver,
                    'time': session.time.isoformat() if session.time else None
                }
                cache_set(session_cache_key, session_data, ttl=300)
                can_reply = True
        elif session_status == "true":
            can_reply = True
        
        # Cache kết quả check_repply trong 300 giây
        cache_set(repply_cache_key, {'can_reply': can_reply}, ttl=300)
        
        return can_reply
        
    except Exception as e:
        print(e)
        traceback.print_exc()
        return False

async def check_repply(id : int, db):
    try:
        result = await db.execute(select(ChatSession).filter(ChatSession.id == id))
        session = result.scalar_one_or_none()
        
        if not session:
            return False
        
        if session.time and datetime.now() > session.time and session.status == "false":
            session.status = "true"
            session.time = None
            await db.commit()
            await db.refresh(session)

            return True

        if session.status == "true":
            return True
        
        print(type(session.status))
        return False 
    except Exception as e:
        print(e)
        traceback.print_exc()
        return False




async def sendMessage(data: dict, content: str, db):
    image_url = []
    if data.get("image"):  # Đổi từ "images" thành "image" để nhất quán với FE
        try:
            print("có image")
            image_url = save_base64_image(data.get("image"))
        except Exception as e:
            print("Error saving images:", e)
            traceback.print_exc()
    
    response_messages = []
    
    chat_session_ids = data.get("customers", [])
    for session_id in chat_session_ids:
        result = await db.execute(select(ChatSession).filter(ChatSession.id == session_id))
        session = result.scalar_one_or_none()
        if not session:
            continue

        # Tạo message object trước
        message = Message(
            chat_session_id=session_id,
            sender_type="bot",
            content=content,
            image=json.dumps(image_url) if image_url else None
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)

        # Gửi tin nhắn đến platform sau khi tạo message
        if session.channel == "facebook":
            name_to_send = session.name[2:]
            send_fb(session.page_id, name_to_send, message, image_url, db)
        elif session.channel == "telegram":
            name_to_send = session.name[2:]
            send_telegram(name_to_send, message, db)
        elif session.channel == "zalo":
            name_to_send = session.name[2:]
            send_zalo(name_to_send, message, image_url, db)
        
        response_messages.append({
            "id": message.id,
            "chat_session_id": message.chat_session_id,
            "sender_type": message.sender_type,
            "sender_name": message.sender_name,
            "content": message.content,
            "image": json.loads(message.image) if message.image else [],
            "session_name": session.name,
            "session_status" : session.status
        })
       
    return response_messages
       





def convert_file_to_facebook_attachment_id(file_data, access_token):
    """
    Chuyển đổi file ảnh thành attachment_id của Facebook
    
    Args:
        file_data: File object, base64 string, hoặc URL ảnh từ FE
        access_token: Facebook Page Access Token
        
    Returns:
        str: attachment_id nếu thành công, None nếu thất bại
    """
    try:
        print(f"🔍 Đang xử lý file_data type: {type(file_data)}, value preview: {str(file_data)[:100] if isinstance(file_data, str) else 'Not string'}")
        
        # Xử lý nếu là string
        if isinstance(file_data, str):
            # Kiểm tra nếu là URL (http/https)
            if file_data.startswith('http://') or file_data.startswith('https://'):
                print(f"📷 Phát hiện URL ảnh: {file_data}")
                # Nếu là URL, tải ảnh về và upload lên Facebook
                try:
                    img_response = requests.get(file_data, timeout=10)
                    if img_response.status_code == 200:
                        image_bytes = img_response.content
                        # Lấy loại ảnh từ URL hoặc content-type
                        content_type = img_response.headers.get('content-type', 'image/jpeg')
                        image_type = content_type.split('/')[-1].split(';')[0]
                        
                        image_file = io.BytesIO(image_bytes)
                        image_file.name = f"image.{image_type}"
                    else:
                        print(f"❌ Không thể tải ảnh từ URL: {img_response.status_code}")
                        return None
                except Exception as url_error:
                    print(f"❌ Lỗi khi tải ảnh từ URL: {url_error}")
                    return None
            else:
                # Xử lý base64 string
                print(f"🔐 Phát hiện base64 string")
                try:
                    # Loại bỏ prefix "data:image/...;base64," nếu có
                    if ',' in file_data and file_data.startswith('data:'):
                        header, encoded = file_data.split(',', 1)
                        # Lấy loại ảnh từ header (png, jpg, jpeg, etc.)
                        image_type = header.split('/')[1].split(';')[0]
                    else:
                        encoded = file_data
                        image_type = 'png'
                    
                    # Decode base64 thành bytes
                    image_bytes = base64.b64decode(encoded)
                    
                    # Tạo file-like object từ bytes
                    image_file = io.BytesIO(image_bytes)
                    image_file.name = f"image.{image_type}"
                except Exception as b64_error:
                    print(f"❌ Lỗi decode base64: {b64_error}")
                    return None
        else:
            # Nếu đã là file object
            print(f"📁 Phát hiện file object")
            image_file = file_data
            image_type = 'jpeg'
        
        # Upload lên Facebook để lấy attachment_id
        url = f"https://graph.facebook.com/v23.0/me/message_attachments"
        
        params = {
            'access_token': access_token
        }
        
        payload = {
            'message': json.dumps({
                'attachment': {
                    'type': 'image',
                    'payload': {
                        'is_reusable': True
                    }
                }
            })
        }
        
        # Reset file pointer về đầu
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
        
        files = {
            'filedata': (getattr(image_file, 'name', 'image.jpg'), image_file, f'image/{image_type}')
        }
        
        print(f"📤 Đang upload ảnh lên Facebook...")
        response = requests.post(url, params=params, data=payload, files=files)
        
        if response.status_code == 200:
            result = response.json()
            attachment_id = result.get('attachment_id')
            if attachment_id:
                print(f"✅ Successfully uploaded image to Facebook, attachment_id: {attachment_id}")
                return attachment_id
            else:
                print(f"❌ No attachment_id in response: {result}")
                return None
        else:
            print(f"❌ Failed to upload image to Facebook: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception khi convert file to Facebook attachment_id: {e}")
        traceback.print_exc()
        return None


def send_fb(page_id : str, sender_id, data, images=None, db=None):
    """
    Gửi tin nhắn qua Facebook Messenger
    
    Args:
        page_id: ID của Facebook Page
        sender_id: ID của người nhận
        data: Dữ liệu tin nhắn (có thể là dict hoặc Message object)
        images: List các đường dẫn file ảnh (URL hoặc base64) - tham số tùy chọn
        db: Database session
    """
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    try:
        page = db.query(FacebookPage).filter(FacebookPage.page_id == page_id).first()
        if not page:
            return
           
        PAGE_ACCESS_TOKEN = page.access_token
        url_text = f"https://graph.facebook.com/v23.0/{page_id}/messages?access_token={PAGE_ACCESS_TOKEN}"
        url_image = f"https://graph.facebook.com/v23.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
        
        # Ưu tiên sử dụng tham số images nếu được truyền vào
        images_data = None
        if images is not None:
            images_data = images
            print(f"📸 Sử dụng images từ tham số: {type(images_data)}")
        elif hasattr(data, 'image'):
            images_data = data.image
            print(f"📸 Sử dụng images từ data.image")
        elif isinstance(data, dict) and 'image' in data:
            images_data = data['image']
            print(f"📸 Sử dụng images từ data['image']")
           
        if images_data:
            try:
                if isinstance(images_data, str):
                    images = json.loads(images_data)
                elif isinstance(images_data, list):
                    images = images_data
                else:
                    images = images_data
               
                if images and len(images) > 0:
                    print(f"📤 Đang xử lý {len(images)} ảnh để gửi qua Facebook")
                    
                    # Chuyển đổi mỗi file/base64 thành attachment_id
                    for image_data in images:
                        attachment_id = convert_file_to_facebook_attachment_id(image_data, PAGE_ACCESS_TOKEN)
                        
                        if attachment_id:
                            # Gửi tin nhắn với attachment_id
                            image_payload = {
                                "recipient": {
                                    "id": sender_id
                                },
                                "message": {
                                    "attachment": {
                                        "type": "image",
                                        "payload": {
                                            "attachment_id": attachment_id
                                        }
                                    }
                                }
                            }
                            
                            print(f"📋 Image payload for Facebook: {json.dumps(image_payload, indent=2)}")
                            
                            try:
                                response = requests.post(url_image, json=image_payload)
                                print(f"📊 Images response: {response.status_code}")
                                print(f"📄 Response body: {response.text}")
                               
                                if response.status_code == 200:
                                    response_data = response.json()
                                    print(f"✅ Successfully sent image with attachment_id: {attachment_id}")
                                    print(f"📬 Message ID: {response_data.get('message_id', 'N/A')}")
                                else:
                                    print(f"❌ Failed to send image: {response.text}")
                            except requests.exceptions.RequestException as req_error:
                                print(f"🌐 Network error sending image: {req_error}")
                            except Exception as send_error:
                                print(f"❌ Unexpected error sending image: {send_error}")
                        else:
                            print(f"❌ Failed to get attachment_id for image")
                else:
                    print("⚠️ No images found in data")
            except Exception as img_error:
                print(f"❌ Error processing images for Facebook: {img_error}")
                traceback.print_exc()
        else:
            print("ℹ️ No images to send")
       
        # Kiểm tra content - hỗ trợ cả Message object và dictionary
        content_data = None
        if hasattr(data, 'content'):
            content_data = data.content
        elif isinstance(data, dict) and 'content' in data:
            content_data = data['content']
           
        # Gửi tin nhắn text
        if content_data:
            print(f"💬 Sending text message: {content_data}")
            text_payload = {
                "recipient": {
                    "id": sender_id
                },
                "message": {
                    "text": content_data
                }
            }
           
            print(f"📋 Text payload for Facebook: {json.dumps(text_payload, indent=2)}")
           
            try:
                response = requests.post(url_text, json=text_payload, timeout=15)
                print(f"📊 Text message response: {response.status_code}")
                print(f"📄 Response body: {response.text}")
               
                if response.status_code == 200:
                    print("✅ Successfully sent text message")
                else:
                    print(f"❌ Failed to send text: {response.text}")
            except Exception as text_error:
                print(f"❌ Error sending text message: {text_error}")
        else:
            print("ℹ️ No text content to send")
           
    except Exception as e:
        print(f"❌ Error in send_fb: {e}")
        traceback.print_exc()
    finally:
        if should_close:
            db.close()











def send_telegram(chat_id, message, db=None):
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    try:
        token  = db.query(TelegramBot).filter(TelegramBot.id  == 1).first()
        
        TELEGRAM_TOKEN = token.bot_token
        
        # Kiểm tra nếu có ảnh - hỗ trợ cả Message object và dictionary
        images_data = None
        if hasattr(message, 'image'):
            images_data = message.image
        elif isinstance(message, dict) and 'image' in message:
            images_data = message['image']
            
        if images_data:
            try:
                # Xử lý dữ liệu ảnh - có thể là string JSON hoặc list
                if isinstance(images_data, str):
                    # Nếu là string JSON từ database
                    images = json.loads(images_data)
                elif isinstance(images_data, list):
                    # Nếu là list từ response_messages
                    images = images_data
                else:
                    images = images_data
                    
                if images and len(images) > 0:
                    # Gửi từng ảnh
                    for image_url in images:
                        photo_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
                        photo_payload = {
                            "chat_id": chat_id,
                            "photo": image_url
                        }
                        requests.post(photo_url, json=photo_payload)
            except Exception as img_error:
                print(f"Error sending image: {img_error}")
        
        # Kiểm tra content - hỗ trợ cả Message object và dictionary
        content_data = None
        if hasattr(message, 'content'):
            content_data = message.content
        elif isinstance(message, dict) and 'content' in message:
            content_data = message['content']
            
        # Gửi tin nhắn text
        if content_data:
            text_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": content_data
            }
            requests.post(text_url, json=payload)
            
    except Exception as e:
        print(e)
        traceback.print_exc()
    finally: 
        if should_close:
            db.close()


def convert_base64_to_attachment_id(base64_string, token):
    """
    Chuyển đổi base64 image string thành attachment_id của Zalo
    
    Args:
        base64_string: Base64 encoded image string từ FE (format: "data:image/png;base64,...")
        token: Zalo access token
        
    Returns:
        str: attachment_id nếu thành công, None nếu thất bại
    """
    try:
        import base64
        import io
        
        # Loại bỏ prefix "data:image/...;base64," nếu có
        if ',' in base64_string:
            header, encoded = base64_string.split(',', 1)
            # Extract image type từ header (vd: "data:image/png;base64" -> "png")
            image_type = header.split('/')[1].split(';')[0] if '/' in header else 'png'
        else:
            encoded = base64_string
            image_type = 'png'
        
        # Decode base64 thành bytes
        image_bytes = base64.b64decode(encoded)
        
        # Tạo file-like object từ bytes
        image_file = io.BytesIO(image_bytes)
        image_file.name = f"image.{image_type}"
        
        # Upload lên Zalo
        url = "https://openapi.zalo.me/v2.0/oa/upload/image"
        headers = {
            "access_token": token
        }
        
        files = {
            'file': (image_file.name, image_file, f'image/{image_type}')
        }
        
        response = requests.post(url, headers=headers, files=files)
        
        if response.status_code == 200:
            data = response.json()
            attachment_id = data.get("data", {}).get("attachment_id")
            if attachment_id:
                print(f"✅ Đã chuyển đổi base64 thành attachment_id: {attachment_id}")
                return attachment_id
            else:
                print(f"❌ Không tìm thấy attachment_id trong response: {data}")
                return None
        else:
            print(f"❌ Lỗi upload ảnh lên Zalo: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception khi convert base64 to attachment_id: {e}")
        traceback.print_exc()
        return None


def send_zalo(chat_id, message, images_base64, db):
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
        
    try:
        # Lấy thông tin Zalo bot
        zalo = db.query(ZaloBot).filter(ZaloBot.id == 1).first()
        if not zalo:
            print("❌ Không tìm thấy Zalo bot configuration")
            return
            
        ACCESS_TOKEN = zalo.access_token
        
        # Lấy nội dung tin nhắn (text luôn có)
        content_text = ""
        if hasattr(message, 'content'):
            content_text = message.content
        elif isinstance(message, dict) and 'content' in message:
            content_text = message['content']
        
        if not content_text:
            print("⚠️ Tin nhắn không có nội dung text")
            return
        
        url = "https://openapi.zalo.me/v3.0/oa/message/cs"
        headers = {
            "Content-Type": "application/json",
            "access_token": ACCESS_TOKEN
        }
        
        # Nếu có ảnh, gửi ảnh kèm text
        if images_base64 and len(images_base64) > 0:
            # Lấy ảnh đầu tiên (Zalo chỉ hỗ trợ 1 ảnh/tin nhắn)
            first_image = images_base64[0] if isinstance(images_base64, list) else images_base64
            
            print(f"🔄 Đang chuyển đổi base64 thành attachment_id...")
            attachment_id = convert_base64_to_attachment_id(first_image, ACCESS_TOKEN)
            
            if attachment_id:
                # Gửi tin nhắn có ảnh + text
                payload = {
                    "recipient": {
                        "user_id": chat_id
                    },
                    "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "media",
                                "elements": [
                                    {
                                        "media_type": "image",
                                        "attachment_id": attachment_id
                                    }
                                ]
                            }
                        },
                        "text": content_text
                    }
                }
                
                response = requests.post(url, headers=headers, data=json.dumps(payload))
                
                if response.status_code == 200:
                    print(f"✅ Đã gửi tin nhắn có ảnh đến Zalo: {chat_id}")
                else:
                    send_text_only(url, headers, chat_id, content_text)
            else:
                
                send_text_only(url, headers, chat_id, content_text)
        else:
            # Không có ảnh, gửi chỉ text
            send_text_only(url, headers, chat_id, content_text)
    
    except Exception as e:
        print(f"❌ Exception trong send_zalo: {e}")
        traceback.print_exc()
    finally:
        if should_close:
            db.close()


def send_text_only(url, headers, chat_id, content_text):
    """Helper function để gửi tin nhắn text thuần"""
    payload = {
        "recipient": {
            "user_id": chat_id
        },
        "message": {
            "text": content_text
        }
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 200:
        print(f"✅ Đã gửi tin nhắn text đến Zalo: {chat_id}")
    else:
        print(f"❌ Lỗi gửi tin nhắn text: {response.status_code} - {response.text}")
      
async def send_message_page_service(data: dict, db):
    prefix = None
    if data["platform"] == "facebook":
        prefix = "F"
    elif data["platform"] == "telegram":
        prefix = "T"
    elif data["platform"] == "zalo": 
        prefix = "Z"
    else:
        prefix = "U"
    
    session_name = f"{prefix}-{data['sender_id']}"
    
    # Tạo cache key cho session dựa trên name
    session_name_cache_key = f"session_by_name:{session_name}"
    
    # Kiểm tra cache trước
    cached_session_id = cache_get(session_name_cache_key)
    
    session_data = None
    
    if cached_session_id:
        # Lấy session data từ cache theo ID
        session_cache_key = f"session:{cached_session_id}"
        session_data = cache_get(session_cache_key)
    
    # Nếu không có trong cache, query từ database
    if not session_data:
        result = await db.execute(select(ChatSession).filter(ChatSession.name == session_name))
        session = result.scalar_one_or_none()
        
        url_channel = None
        
        if not session:
            # Tạo session mới
            session = ChatSession(
                name=session_name,
                channel=data["platform"],
                page_id = data.get("page_id", ""),
                url_channel = url_channel
            )
            
            db.add(session)
            await db.commit()
            await db.refresh(session)
        
        # Cache session data
        session_data = {
            'id': session.id,
            'name': session.name,
            'status': session.status,
            'channel': session.channel,
            'page_id': session.page_id,
            'current_receiver': session.current_receiver,
            'previous_receiver': session.previous_receiver,
            'time': session.time.isoformat() if session.time else None
        }
        
        # Cache session theo ID và name
        session_cache_key = f"session:{session.id}"
        cache_set(session_cache_key, session_data, ttl=300)
        cache_set(session_name_cache_key, session.id, ttl=300)
    
    response_messages = []
    
    # Tạo response message trước (với id=None)
    customer_message = {
        "id": None,
        "chat_session_id": session_data['id'],
        "sender_type": "customer",
        "sender_name": None,
        "content": data["message"],
        "session_name": session_data['name'],
        "session_status": session_data['status'],
        "platform": data["platform"]
    }
    
    response_messages.append(customer_message)
    
    # 🚀 Lưu tin nhắn vào database (background task với DB session riêng)
    message_data = {
        "chat_session_id": session_data['id'],
        "sender_type": "customer",
        "content": data["message"]
    }
    asyncio.create_task(save_message_to_db_background(message_data, None, []))
    
    # 🚀 Xử lý bot reply trong background (không block webhook response)
    should_reply = await check_repply_cached(session_data['id'], db)
    if should_reply:
        asyncio.create_task(generate_and_send_platform_bot_response_background(
            data["message"],
            session_data['id'],
            session_data,
            data["platform"],
            data.get("page_id"),
            data["sender_id"]
        ))
    
    return response_messages

def clear_session_cache(session_id: int):
    """Clear cache cho session và check_repply"""
    session_cache_key = f"session:{session_id}"
    repply_cache_key = f"check_repply:{session_id}"
    cache_delete(session_cache_key)
    cache_delete(repply_cache_key)

def update_session_cache(session, ttl=300):
    session_cache_key = f"session:{session.id}"
    session_data = {
        'id': session.id,
        'name': session.name,
        'status': session.status,
        'channel': session.channel,
        'page_id': session.page_id,
        'current_receiver': session.current_receiver,
        'previous_receiver': session.previous_receiver,
        'time': session.time.isoformat() if session.time else None
    }
    cache_set(session_cache_key, session_data, ttl=ttl)

async def update_chat_session(id: int, data: dict, user, db: Session):
    try:
        result = await db.execute(select(ChatSession).filter(ChatSession.id == id))
        chatSession = result.scalar_one_or_none()
        if not chatSession:
            return None

        new_status = data.get("status")
        new_time = data.get("time")
        
        print(new_status)
        if not (chatSession.status == "true" and new_status == "true"):
            receiver_name = chatSession.current_receiver
            chatSession.current_receiver = "Bot" if new_status == "true" else user.get("fullname")
            chatSession.previous_receiver = receiver_name
            chatSession.status = new_status
            chatSession.time = new_time 
        
        if "tags" in data and isinstance(data["tags"], list):
            from models.tag import Tag
            result = await db.execute(select(Tag).filter(Tag.id.in_(data["tags"])))
            tags = result.scalars().all()
            chatSession.tags = tags
        await db.commit()
        await db.refresh(chatSession)
        
        # Clear cache sau khi update
        clear_session_cache(id)
        
        return {
            "chat_session_id": chatSession.id,
            "session_status": chatSession.status,
            "current_receiver": chatSession.current_receiver,
            "previous_receiver": chatSession.previous_receiver,
            "time" : chatSession.time.isoformat() if chatSession.time else None
        }
        
    except Exception as e:
        print(e)
        await db.rollback()
        return None
        
async def update_tag_chat_session_service(id: int, data: dict, db):
    try:
        result = await db.execute(select(ChatSession).filter(ChatSession.id == id))
        chatSession = result.scalar_one_or_none()
        if not chatSession:
            return None
        if "tags" in data and isinstance(data["tags"], list):
            from models.tag import Tag
            result = await db.execute(select(Tag).filter(Tag.id.in_(data["tags"])))
            tags = result.scalars().all()
            chatSession.tags = tags
        
        await db.commit()
        await db.refresh(chatSession)
        return chatSession
        
    except Exception as e:
        print(e)

async def delete_chat_session(ids: list[int], db):
    result = await db.execute(select(ChatSession).filter(ChatSession.id.in_(ids)))
    sessions = result.scalars().all()
    if not sessions:
        return 0
    
    # Clear cache cho từng session trước khi xóa
    for s in sessions:
        clear_session_cache(s.id)
        await db.delete(s)
    await db.commit()
    return len(sessions)

async def delete_message(chatId: int, ids: list[int], db):
    print("chatId", chatId)
    print("data", ids)
    result = await db.execute(
        select(Message).filter(
            Message.id.in_(ids),
            Message.chat_session_id == chatId
        )
    )
    messages = result.scalars().all()
    
    if not messages:
        return 0
        
    for m in messages:
        await db.delete(m)
    await db.commit()
    return len(messages)

async def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    try:
        # 1️⃣ Tổng số tin nhắn theo kênh (barData + pieData)
        bar_query = text("""
            SELECT 
                cs.channel AS channel,
                COUNT(m.id) AS messages
            FROM messages m
            JOIN chat_sessions cs ON cs.id = m.chat_session_id
            GROUP BY cs.channel
            ORDER BY messages DESC;
        """)
        result = await db.execute(bar_query)
        bar_rows = result.fetchall()
        bar_data = [{"channel": r.channel, "messages": r.messages} for r in bar_rows]
        pie_data = [{"name": r.channel, "value": r.messages} for r in bar_rows]

        # 2️⃣ So sánh tin nhắn giữa 2 tháng gần nhất (lineData)
        line_query = text("""
            SELECT 
                cs.channel,
                TO_CHAR(DATE_TRUNC('month', m.created_at), 'YYYY-MM') AS month,
                COUNT(m.id) AS messages
            FROM messages m
            JOIN chat_sessions cs ON cs.id = m.chat_session_id
            WHERE m.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
            GROUP BY cs.channel, DATE_TRUNC('month', m.created_at)
            ORDER BY month;
        """)
        result = await db.execute(line_query)
        line_rows = result.fetchall()

        line_data_dict = {}
        current_month = datetime.now().strftime("%Y-%m")

        for row in line_rows:
            month_label = (
                "Tháng hiện tại" if row.month == current_month else "Tháng trước"
            )
            if month_label not in line_data_dict:
                line_data_dict[month_label] = {"month": month_label}
            line_data_dict[month_label][row.channel] = row.messages

        line_data = list(line_data_dict.values())

        # 3️⃣ Bảng chi tiết: khách hàng, tin nhắn, % thay đổi (tableData)
        table_query = text("""
            WITH month_stats AS (
                SELECT 
                    cs.channel,
                    DATE_TRUNC('month', m.created_at) AS month,
                    COUNT(DISTINCT ci.id) AS customers,
                    COUNT(m.id) AS messages
                FROM messages m
                JOIN chat_sessions cs ON cs.id = m.chat_session_id
                LEFT JOIN customer_info ci ON cs.id = ci.chat_session_id
                GROUP BY cs.channel, DATE_TRUNC('month', m.created_at)
            )
            SELECT 
                curr.channel,
                curr.customers,
                curr.messages,
                ROUND(((curr.messages - prev.messages)::numeric / NULLIF(prev.messages, 0)) * 100, 2) AS change
            FROM month_stats curr
            LEFT JOIN month_stats prev 
                ON curr.channel = prev.channel 
                AND curr.month = DATE_TRUNC('month', NOW())
                AND prev.month = DATE_TRUNC('month', NOW() - INTERVAL '1 month');
        """)
        result = await db.execute(table_query)
        table_rows = result.fetchall()
        table_data = [
            {
                "channel": r.channel,
                "customers": r.customers,
                "messages": r.messages,
                "change": float(r.change or 0),
            }
            for r in table_rows
        ]

        # ✅ Trả về dữ liệu tổng hợp
        return {
            "barData": bar_data,
            "pieData": pie_data,
            "lineData": line_data,
            "tableData": table_data,
        }

    except Exception as e:
        print(f"Error generating dashboard summary: {e}")
        traceback.print_exc()
        return {
            "barData": [],
            "pieData": [],
            "lineData": [],
            "tableData": [],
        }

async def update_chat_session_tag(id: int, data: dict, db: Session):
    try:
        result = await db.execute(select(ChatSession).filter(ChatSession.id == id))
        chatSession = result.scalar_one_or_none()
        if not chatSession:
            return None
        from models.tag import Tag
        result = await db.execute(select(Tag).filter(Tag.id.in_(data["tags"])))
        tags = result.scalars().all()
        chatSession.tags = tags
        await db.commit()
        await db.refresh(chatSession)
        
        # Clear cache sau khi update
        clear_session_cache(id)
        
        return chatSession
        
    except Exception as e:
        print(e)
        await db.rollback()
        return None