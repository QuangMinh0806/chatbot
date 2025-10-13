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
    send_message_fast_service,
    get_dashboard_summary
)
from models.chat import ChatSession, CustomerInfo
from services.llm_service import (get_all_llms_service)
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
from models.chat import CustomerInfo
from sqlalchemy.ext.asyncio import AsyncSession
import requests
from config.websocket_manager import ConnectionManager
import datetime
import json
import asyncio
from llm.llm import RAGModel
manager = ConnectionManager()
from helper.task import extract_customer_info_background


async def create_session_controller(url_channel: str, db: AsyncSession):
    chat = await create_session_service(url_channel, db)    
    return {
        "id": chat
    }

async def check_session_controller(sessionId, url_channel, db: AsyncSession):
    chat = await check_session_service(sessionId, url_channel, db)    
    return {
        "id": chat
    }


async def sendMessage_controller(data: dict, db: AsyncSession):
    try:
        message = await sendMessage(data, data.get("content"), db)
        for msg in message:
            print(msg)
            await manager.broadcast_to_admins(msg)
            print("send1")
            await manager.send_to_customer(msg["chat_session_id"], msg)
            print("send2")

        return {"status": "success", "data": message}
    except Exception as e:
        print(e)

async def customer_chat(websocket: WebSocket, session_id: int):
    """
    ✅ Xử lý tin nhắn từ customer qua WebSocket
    - Mỗi message tạo db session MỚI (< 50ms)
    - KHÔNG giữ db connection suốt kết nối
    - Background tasks xử lý song song
    """
    await manager.connect_customer(websocket, session_id)
    print(f"\n{'='*70}")
    print(f"🔌 [CONNECT] Customer WebSocket connected: session {session_id}")
    print(f"   Time: {datetime.datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
    print(f"{'='*70}\n")
    
    try:
        while True:
            # ✅ Đợi tin nhắn từ customer (async, không block)
            print(f"\n📥 [WAIT] Session {session_id} đang chờ tin nhắn...")
            data = await websocket.receive_json()
            
            receive_time = datetime.datetime.now()
            print(f"\n{'='*70}")
            print(f"📩 [RECEIVE] Session {session_id} nhận tin nhắn")
            print(f"   Time: {receive_time.strftime('%H:%M:%S.%f')[:-3]}")
            print(f"   Content: '{data.get('content', '')[:50]}'")
            print(f"{'='*70}")
            
            # ✅ Tạo db session MỚI cho mỗi message
            from config.database import AsyncSessionLocal
            print(f"🔧 [DB] Tạo AsyncSession mới cho session {session_id}...")
            async with AsyncSessionLocal() as db:
                
                # Xử lý tin nhắn nhanh (< 50ms)
                start_service = datetime.datetime.now()
                print(f"⚙️ [SERVICE] Gọi send_message_fast_service...")
                res_messages = await send_message_fast_service(data, None, db)
                service_time = (datetime.datetime.now() - start_service).total_seconds() * 1000
                print(f"✅ [SERVICE] Hoàn tất trong {service_time:.0f}ms")

                # Gửi tin nhắn đến người dùng ngay lập tức
                print(f"📤 [SEND] Gửi {len(res_messages)} tin nhắn qua WebSocket...")
                for msg in res_messages:
                    await manager.broadcast_to_admins(msg)
                    await manager.send_to_customer(session_id, msg)
                
                send_time = datetime.datetime.now()
                total_time = (send_time - receive_time).total_seconds() * 1000
                print(f"✅ [COMPLETE] Session {session_id} hoàn tất trong {total_time:.0f}ms")
                print(f"   Echo time: {receive_time.strftime('%H:%M:%S.%f')[:-3]}")
                print(f"{'='*70}\n")
            
            # ✅ db session đã đóng tại đây
            print(f"🔒 [DB] AsyncSession đã đóng cho session {session_id}")
            
            # ✅ Thu thập thông tin khách hàng (background - không truyền db)
            asyncio.create_task(extract_customer_info_background(session_id, None, manager))

    except WebSocketDisconnect:
        print(f"\n{'='*70}")
        print(f"👋 [DISCONNECT] Customer disconnect: session {session_id}")
        print(f"   Time: {datetime.datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
        print(f"{'='*70}\n")
        manager.disconnect_customer(websocket, session_id)
    except Exception as e:
        print(f"\n{'='*70}")
        print(f"❌ [ERROR] Lỗi trong customer_chat: session {session_id}")
        print(f"   Error: {e}")
        print(f"{'='*70}\n")
        import traceback
        traceback.print_exc()
        manager.disconnect_customer(websocket, session_id)

async def admin_chat(websocket: WebSocket, user: dict):
    """
    ✅ Xử lý tin nhắn từ admin qua WebSocket
    - Mỗi message tạo db session MỚI
    - KHÔNG giữ db connection suốt kết nối
    """
    await manager.connect_admin(websocket)
    
    try:
        while True:
            # ✅ Đợi tin nhắn từ admin (async, không block)
            data = await websocket.receive_json()
            
            # ✅ Tạo db session MỚI cho mỗi message
            from config.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                            
                # Gửi tin nhắn admin nhanh (< 50ms)
                res_messages = await send_message_fast_service(data, user, db)
                
                # Gửi đến tất cả customer đang kết nối
                for msg in res_messages:
                    await manager.send_to_customer(msg["chat_session_id"], msg)
                    # ✅ Chỉ broadcast cho CÁC ADMIN KHÁC, không gửi lại cho admin đang gửi
                    await manager.broadcast_to_other_admins(websocket, msg)
            
            # ✅ db session đã đóng tại đây
                    
    except WebSocketDisconnect:
        print(f"👋 Admin disconnect: {user.get('fullname')}")
        manager.disconnect_admin(websocket)
    except Exception as e:
        print(f"❌ Lỗi xử lý admin message: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect_admin(websocket)
            
       
async def handle_send_message(websocket: WebSocket, data : dict, user):
    message = send_message_service(websocket, data, user)
    
    # gửi realtime cho client
    return message
    
async def get_history_chat_controller(chat_session_id: int, page: int = 1, limit: int = 10, db: AsyncSession = None):
    messages = await get_history_chat_service(chat_session_id, page, limit, db)
    return messages


async def get_all_history_chat_controller(db: AsyncSession):
    messages = await get_all_history_chat_service(db)
    return messages
    
async def get_all_customer_controller(data: dict, db: AsyncSession):
    customers = await get_all_customer_service(data, db)
    return customers


async def update_chat_session_controller(id: int, data: dict, user, db: AsyncSession):
    chatSession = await update_chat_session(id, data, user, db)
    if not chatSession:
        return {"message": "Not Found"}
    
    
    await manager.broadcast_to_admins(chatSession)
    
    return chatSession

async def update_tag_chat_session_controller(id: int, data: dict, db: AsyncSession):
    chatSession = await update_tag_chat_session(id, data, db)
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

async def chat_platform(channel, body: dict, db: AsyncSession):
    
    
    data = None
    
    if channel == "tele":
        data = parse_telegram(body)
        print("ok")
    
    elif channel == "fb":
        data = parse_facebook(body)
     
    elif channel == "zalo":
        data = parse_zalo(body)
        
        
     
    message = await send_message_page_service(data, db)   
    
    for msg in message:
        await manager.broadcast_to_admins(msg)
    
    # Thu thập thông tin khách hàng sau MỖI tin nhắn từ platform - chạy background task
    if message:
        session_id = message[0].get("chat_session_id")
        asyncio.create_task(extract_customer_info_background(session_id, db, manager))

async def delete_chat_session_controller(ids: list[int], db: AsyncSession):
    deleted_count = await delete_chat_session(ids, db)   # gọi xuống service
    return {
        "deleted": deleted_count,
        "ids": ids
    }

async def delete_message_controller(chatId: int, ids: list[int], db: AsyncSession):
    deleted_count = await delete_message(chatId, ids, db)   # gọi xuống service
    return {
        "deleted": deleted_count,
        "ids": ids
    }
async def get_dashboard_summary_controller(db: AsyncSession):
    result = await get_dashboard_summary(db)
    return result