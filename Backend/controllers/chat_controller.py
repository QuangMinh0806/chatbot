from services.chat_service import (
    create_session_service,
    send_message_service,
    get_history_chat_service,
    get_all_history_chat_service,
    send_message_page_service,
    update_chat_session
)
from fastapi import WebSocket
import datetime
def create_session_controller():
    chat = create_session_service()
    return {
        "id": chat
    }

import requests
async def handle_send_message(websocket: WebSocket, data : dict):
    message = send_message_service(data)
    
    # gửi realtime cho client
    return message
    
def get_history_chat_controller(chat_session_id: int):
    messages = get_history_chat_service(chat_session_id)
    return messages


def get_all_history_chat_controller():
    messages = get_all_history_chat_service()
    return messages


def chat_fb(body: dict):
    
    if body.get("object") != "page": 
        return None

    
    
    
    entry = body.get("entry", [])[0]   # chỉ lấy entry đầu tiên
    page_id = entry.get("id")

    messaging_event = entry.get("messaging", [])[0]  # chỉ lấy message đầu tiên
    sender_id = messaging_event["sender"]["id"]
    timestamp = messaging_event.get("timestamp")

    # Convert timestamp sang dạng dễ đọc
    timestamp_str = datetime.datetime.fromtimestamp(timestamp/1000).strftime("%Y-%m-%d %H:%M:%S")

    message_text = messaging_event.get("message", {}).get("text", "")

    data = {
        "page_id": page_id,
        "sender_id": sender_id,
        "message": message_text,
        "timestamp": timestamp_str
    }
    
    message = send_message_page_service(data)
    
    if message == -1:
        return None
    
    
    PAGE_ACCESS_TOKEN = "EAAR8b7S65eUBPTDWLZCvDZAsi7FNT9nZB7MvcAWeqiH27mXopvTBOYv5fAYT7Qi8ZB59brhwZAu1c2bFxRUZCkfqo3d5h4w1AWGuxq1ZCQrYlXZC1L680G2aNFHdk3dHZCDghS0qE0UrWIrJZAGd2hXhzGLirz4sVaK1wCXNWuVRBHoxMRPE3WZAXYZBGorfKFGr4mirEKvHMnQZBn33Tz9ERZAfk5LT3SluSuaXN7xKVJb6II" 
    
    url = f"https://graph.facebook.com/v23.0/666547383218465/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient":{
            "id": sender_id
        },
        "message":{
            "text":message["content"]
        }
    }
    
    
    requests.post(url, json=payload, timeout=10)
    
    

    
def get_fb(body: dict):
    
    if body.get("object") != "page":
        return None

    entry = body.get("entry", [])[0]   # chỉ lấy entry đầu tiên
    page_id = entry.get("id")

    messaging_event = entry.get("messaging", [])[0]  # chỉ lấy message đầu tiên
    sender_id = messaging_event["sender"]["id"]
    timestamp = messaging_event.get("timestamp")

    # Convert timestamp sang dạng dễ đọc
    timestamp_str = datetime.datetime.fromtimestamp(timestamp/1000).strftime("%Y-%m-%d %H:%M:%S")

    message_text = messaging_event.get("message", {}).get("text", "")

    data = {
        "page_id": page_id,
        "sender_id": sender_id,
        "message": message_text,
        "timestamp": timestamp_str
    }
    
    
    print(data)


def update_chat_session_controller(id: int, data: dict):
    chatSession = update_chat_session(id, data)
    if not chatSession:
        return {"message": "Not Found"}
    return chatSession

