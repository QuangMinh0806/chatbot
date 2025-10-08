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
from helper.task import extract_customer_info_background


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

# Try to initialize Google Sheets client — but don't crash the app if creds/file not available.
# This avoids import-time failures (and noisy ALTS logs) when running outside GCP or when the
# service account file is missing. If initialization fails, `client` and `sheet` will be None
# and `add_customer` will skip attempts to write to Sheets.



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
        
        await manager.connect_admin(websocket)
        
        try:
            while True:
                
                
                data = await websocket.receive_json()
                                
                # Gửi tin nhắn admin nhanh (không chờ lưu DB)
                res_messages = await send_message_fast_service(data, user, db)
                
                #Gửi đến tất cả customer đang kết nối (có thể lọc theo session_id nếu cần)
                for msg in res_messages:
                    await manager.send_to_customer(msg["chat_session_id"], msg)
                    await manager.broadcast_to_admins(msg)
                    
                        

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
    
    # Thu thập thông tin khách hàng sau MỖI tin nhắn từ platform - chạy background task
    if message:
        session_id = message[0].get("chat_session_id")
        asyncio.create_task(extract_customer_info_background(session_id, db, manager))

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
def get_dashboard_summary_controller(db: Session):
    result = get_dashboard_summary(db)
    return result