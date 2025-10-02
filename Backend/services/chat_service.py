import random
import asyncio
from sqlalchemy.orm import Session
from models.chat import ChatSession, Message, CustomerInfo
from models.facebook_page import FacebookPage
from models.telegram_page import TelegramBot
from models.zalo import ZaloBot 
from config.database import SessionLocal
from sqlalchemy import text
from llm.llm import RAGModel
from datetime import datetime, timedelta
from fastapi import WebSocket
import random
import json
import requests
import traceback
from config.save_base64_image import save_base64_image
from config.redis_cache import cache_get, cache_set, cache_delete
from helper.task import save_message_to_db_async, update_session_admin_async

def create_session_service(db):
    session = ChatSession(
        name=f"W-{random.randint(10**7, 10**8 - 1)}",
        channel="web",
        url_channel = "https://chatbot.haduyson.com/chat"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session.id

def update_tag_chat_session(id: int, data: dict, db):
    chatSession = db.query(ChatSession).filter(ChatSession.id == id).first()
    if not chatSession:
        return None
    from models.tag import Tag
    tags = db.query(Tag).filter(Tag.id.in_(data["tags"])).all()
    chatSession.tags = tags
    db.commit()
    db.refresh(chatSession)
    
    # Clear cache sau khi update
    clear_session_cache(id)
    
    return chatSession
        
def check_session_service(sessionId, db):
    session = db.query(ChatSession).filter(ChatSession.id == sessionId).first()
    if session:
        return session.id
    
    session = ChatSession(
        name=f"W-{random.randint(10**7, 10**8 - 1)}",
        channel="web",
        url_channel = "https://chatbot.haduyson.com/chat"
    )
    
    db.add(session)
    db.flush()   # để session.id được gán ngay
    session_id = session.id
    db.commit()
    return session_id
def send_message_service(data: dict, user, db):
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
    db.commit()
    db.refresh(message)
    
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
        session = db.query(ChatSession).filter(ChatSession.id == chat_session_id).first()
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
        db_session = db.query(ChatSession).filter(ChatSession.id == chat_session_id).first()
        db_session.status = "false" 
        db_session.time = datetime.now() + timedelta(hours=1)
        db_session.previous_receiver = db_session.current_receiver 
        db_session.current_receiver = sender_name
        
        db.commit()
        
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
            
            send_fb(session.page_id, name_to_send, message, db)
        elif session.channel == "telegram":
            send_telegram(name_to_send, message, db)
        elif session.channel == "zalo":
            send_zalo(name_to_send, message, db)
        
        
        
        return response_messages
    
    
    
    elif check_repply_cached(chat_session_id, db) :
        
        print("ok")
        rag = RAGModel(db_session=db)
        mes = rag.generate_response(message.content, session.id)
        
        
        
        message_bot = Message(
            chat_session_id=data.get("chat_session_id"),
            sender_type="bot",
            content=mes
        )
        db.add(message_bot)
        db.commit()
        db.refresh(message_bot)

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
            print("Error saving images:", e) 
            traceback.print_exc()
    
    session_data = None
    response_messages = []
    # Lấy session từ cache hoặc database  
    session_cache_key = f"session:{chat_session_id}"
    cached_session = cache_get(session_cache_key)
    
    if not cached_session :
        
        session = db.query(ChatSession).filter(ChatSession.id == chat_session_id).first()
        
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
    
    # Lưu tin nhắn vào database
    task1 = asyncio.create_task(save_message_to_db_async(data, sender_name, image_url, db))
    
    # Xử lý admin message
    if data.get("sender_type") == "admin":
        # Cập nhật session status
        task2 = asyncio.create_task(update_session_admin_async(chat_session_id, sender_name, db))
        
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

        
        
        name_to_send = session_data["name"][2:]
            
        if session_data["channel"] == "facebook":
            send_fb(session_data["page_id"], name_to_send, response_messages[0], db)
        elif session_data["channel"] == "telegram":
            send_telegram(name_to_send, response_messages[0], db)
        elif session_data["channel"] == "zalo":
            send_zalo(name_to_send, response_messages[0], db)
            
        return response_messages
    
    # Xử lý bot reply
    elif check_repply_cached(chat_session_id, db):
        rag = RAGModel(db_session=db)
        mes = rag.generate_response(data.get("content"), session_data["id"])
        
        response_messages.append({
            "id": None,
            "chat_session_id": chat_session_id,
            "sender_type": "bot",
            "sender_name": sender_name,
            "content": mes,
            "session_name": session_data["name"],
            "session_status": session_data["status"],
            "current_receiver": session_data["current_receiver"],
            "previous_receiver": session_data["previous_receiver"]
        })
        
        # Lưu tin nhắn bot vào database
        bot_data = {
            "chat_session_id": chat_session_id,
            "sender_type": "bot",
            "content": mes
        }
        task3 = asyncio.create_task(save_message_to_db_async(bot_data, None, [], db))
        
    
    return response_messages

async def send_to_platform_async(session, data, sender_name, db: Session):
    """Gửi tin nhắn đến platform bất đồng bộ"""
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
        rag = RAGModel(db_session=db)
        mes = rag.generate_response(data.get("content"), session.id)
        
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

def get_history_chat_service(chat_session_id: int, page: int = 1, limit: int = 10, db=None):
    offset = (page - 1) * limit
    
    total_messages = (
        db.query(Message)
        .filter(Message.chat_session_id == chat_session_id)
        .count()
    )

    messages = (
        db.query(Message)
        .filter(Message.chat_session_id == chat_session_id)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    messages = list(reversed(messages))
    
    for msg in messages:
        try:
            msg.image = json.loads(msg.image) if msg.image else []
        except Exception:
            msg.image = []

    return messages
def get_all_history_chat_service(db):
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
        
        result = db.execute(query).fetchall()
        conversations = []
        for row in result:
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
    finally: 
        db.close()

def get_all_customer_service(data: dict, db):
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
    result = db.execute(stmt, params).mappings().all()

    # result lúc này là list[RowMapping] → có thể convert sang list[dict]
    return [dict(row) for row in result]

def check_repply_cached(id: int, db):
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
            session = db.query(ChatSession).filter(ChatSession.id == id).first()
            if not session:
                return False
            session_status = session.status
            session_time = session.time
        
        can_reply = False
        
        # Logic check repply
        if session_time and datetime.now() > session_time and session_status == "false":
            # Cập nhật database
            session = db.query(ChatSession).filter(ChatSession.id == id).first()
            session.status = "true"
            session.time = None
            db.commit()
            db.refresh(session)
            
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

def check_repply(id : int, db):
    try:
        session  = db.query(ChatSession).filter(ChatSession.id == id).first()
        
        
        if session.time and datetime.now() > session.time and session.status == "false":
            session.status = "true"
            session.time = None
            db.commit()
            db.refresh(session)

            return True

        if session.status == "true":
            return True
        
        print(type(session.status))
        return False 
    except Exception as e:
        print(e)
        traceback.print_exc()




def sendMessage(data: dict, content: str, db):
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
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
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
        db.commit()
        db.refresh(message)

        # Gửi tin nhắn đến platform sau khi tạo message
        if session.channel == "facebook":
            name_to_send = session.name[2:]
            send_fb(session.page_id, name_to_send, message, db)
        elif session.channel == "telegram":
            name_to_send = session.name[2:]
            send_telegram(name_to_send, message, db)
        elif session.channel == "zalo":
            name_to_send = session.name[2:]
            send_zalo(name_to_send, message, db)
        
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
       





def send_fb(page_id : str, sender_id, data, db=None):
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
        # Kiểm tra nếu có ảnh
        images_data = None
        if hasattr(data, 'image'):
            images_data = data.image
        elif isinstance(data, dict) and 'image' in data:
            images_data = data['image']
           
        if images_data:
            try:
                if isinstance(images_data, str):
                    images = json.loads(images_data)
                elif isinstance(images_data, list):
                    images = images_data
                else:
                    images = images_data
               
                if images and len(images) > 0:
                    attachments = []
                    for image_url in images:
                        attachments.append({
                            "type": "image",
                            "payload": {
                                "url": image_url
                            }
                        })
                   
                    # Gửi tất cả ảnh trong một request
                    image_payload = {
                        "recipient": {
                            "id": sender_id
                        },
                        "message": {
                            "attachments": attachments
                        }
                    }
                   
                    print(f"📋 Image payload for Facebook: {json.dumps(image_payload, indent=2)}")
                   
                    try:
                        response = requests.post(url_image, json=image_payload)
                        print(f"📊 Images response: {response.status_code}")
                        print(f"📄 Response body: {response.text}")
                       
                        if response.status_code == 200:
                            response_data = response.json()
                            print(f"✅ Successfully sent {len(images)} images")
                            print(f"📬 Message ID: {response_data.get('message_id', 'N/A')}")
                        else:
                            print(f"❌ Failed to send images: {response.text}")
                    except requests.exceptions.RequestException as req_error:
                        print(f"🌐 Network error sending images: {req_error}")
                    except Exception as send_error:
                        print(f"❌ Unexpected error sending images: {send_error}")
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






   
def send_zalo(chat_id, message, db=None):
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    try:
        zalo  = db.query(ZaloBot).filter(ZaloBot.id  == 1).first()
        
        ACCESS_TOKEN = zalo.access_token
        
        url = "https://openapi.zalo.me/v3.0/oa/message/cs"
        headers = {
            "Content-Type": "application/json",
            "access_token": ACCESS_TOKEN
        }
        
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
                        image_payload = {
                            "recipient": {"user_id": f"{chat_id}"},
                            "message": {
                                "attachment": {
                                    "type": "template",
                                    "payload": {
                                        "template_type": "media",
                                        "elements": [{
                                            "media_type": "image",
                                            "url": image_url
                                        }]
                                    }
                                }
                            }
                        }
                        requests.post(url, headers=headers, json=image_payload)
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
            text_payload = {
                "recipient": {"user_id": f"{chat_id}"},
                "message": {"text": content_data}
            }
            requests.post(url, headers=headers, json=text_payload)
    
    except Exception as e:
        print("hangviet")
        print(e)
        traceback.print_exc()
    finally:
        if should_close:
            db.close() 
      
def send_message_page_service(data: dict, db):
    prefix = None
    if data["platform"] == "facebook":
        prefix = "F"
    elif data["platform"] == "telegram":
        prefix = "T"
    elif data["platform"] == "zalo": 
        prefix = "Z"
    else:
        prefix = "U"
    
    session  = db.query(ChatSession).filter(ChatSession.name == f"{prefix}-{data['sender_id']}").first()
    
    
    url_channel = None

    if data["platform"] == "facebook":
        fb = db.query(FacebookPage).filter(
            FacebookPage.page_id == data.get("page_id", "")
        ).first()
        url_channel = fb.url if fb else ""

    # elif data["platform"] == "zalo":
    #     zalo = db.query(ZaloPage).filter(
    #         ZaloPage.page_id == data.get("page_id", "")
    #     ).first()
    #     url_channel = zalo.url if zalo else ""

        # elif data["platform"] == "telegram":
        #     tg = db.query(TelegramPage).filter(
        #         TelegramPage.page_id == data.get("page_id", "")
        #     ).first()
        #     url_channel = tg.url if tg else ""

            
            
        
        
        
        if not session:
            session = ChatSession(
                name=f"{prefix}-{data['sender_id']}",
                channel=data["platform"],
                page_id = data.get("page_id", ""),
                url_channel = url_channel
            )
            
            db.add(session)
            db.commit()
            db.refresh(session)
            

           
        response_messages = []  
        
        message = Message(
            chat_session_id=session.id,
            sender_type="customer",
            content=data["message"]
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        
        response_messages.append({
            "id": message.id,
            "chat_session_id": message.chat_session_id,
            "sender_type": message.sender_type,
            "sender_name": message.sender_name,
            "content": message.content,
            "session_name": session.name,
            "platform" : data["platform"]
        })
        

        if check_repply(session.id, db) : 
            rag = RAGModel(db_session=db)

            mes = rag.generate_response(message.content, session.id)
            
            
            
            message_1 = Message(
                chat_session_id= session.id,
                sender_type="bot",
                content=mes
            )
            db.add(message_1)
            db.commit()
            db.refresh(message_1)
            
            
            if data["platform"] == "facebook":  
                send_fb(data["page_id"], data['sender_id'], message_1, db)
            elif data["platform"] == "telegram":
                send_telegram(data["sender_id"], message_1, db)
            elif data["platform"] == "zalo":
                send_zalo(data["sender_id"], message_1, db)
            
            
            response_messages.append({
                "id": message_1.id,
                "chat_session_id": message_1.chat_session_id,
                "sender_type": message_1.sender_type,
                "sender_name": message_1.sender_name,
                "content": message_1.content,
                "session_name": session.name,
                "platform" : data["platform"]
            })
            
            print("AAAAAAAAAA")
            
            print(response_messages)
            
            
        
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

def update_chat_session(id: int, data: dict, user, db: Session):
    try:
        chatSession = db.query(ChatSession).filter(ChatSession.id == id).first()
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
            tags = db.query(Tag).filter(Tag.id.in_(data["tags"])).all()
            chatSession.tags = tags
        db.commit()
        db.refresh(chatSession)
        
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
        db.rollback()
        return None
def update_tag_chat_session(id: int, data: dict, db):
    try:
        chatSession = db.query(ChatSession).filter(ChatSession.id == id).first()
        if not chatSession:
            return None
        if "tags" in data and isinstance(data["tags"], list):
            from models.tag import Tag
            tags = db.query(Tag).filter(Tag.id.in_(data["tags"])).all()
            chatSession.tags = tags
        
        db.commit()
        db.refresh(chatSession)
        return chatSession
        
    except Exception as e:
        print(e)
    finally:
        db.close()

def delete_chat_session(ids: list[int], db):
    sessions = db.query(ChatSession).filter(ChatSession.id.in_(ids)).all()
    if not sessions:
        return 0
    
    # Clear cache cho từng session trước khi xóa
    for s in sessions:
        clear_session_cache(s.id)
        db.delete(s)
    db.commit()
    return len(sessions)

def delete_message(chatId: int, ids: list[int], db):
    print("chatId", chatId)
    print("data", ids)
    messages = db.query(Message).filter(
        Message.id.in_(ids),
        Message.chat_session_id == chatId
    ).all()
    
    if not messages:
        return 0
        
    for m in messages:
        db.delete(m)
    db.commit()
    return len(messages)

def update_chat_session_tag(id: int, data: dict, db: Session):
    try:
        chatSession = db.query(ChatSession).filter(ChatSession.id == id).first()
        if not chatSession:
            return None
        from models.tag import Tag
        tags = db.query(Tag).filter(Tag.id.in_(data["tags"])).all()
        chatSession.tags = tags
        db.commit()
        db.refresh(chatSession)
        
        # Clear cache sau khi update
        clear_session_cache(id)
        
        return chatSession
        
    except Exception as e:
        print(e)
        db.rollback()
        return None