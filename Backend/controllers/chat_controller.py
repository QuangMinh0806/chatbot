from services.chat_service import (
    create_session_service,
    send_message_service,
    get_history_chat_service,
    get_all_history_chat_service,
    send_message_page_service,
    update_chat_session
)
from services.llm_service import (get_all_llms_service)
from fastapi import WebSocket
from datetime import datetime
import requests
from config.websocket_manager import ConnectionManager
import datetime
import json
from llm.llm import RAGModel
manager = ConnectionManager()


def create_session_controller():
    chat = create_session_service()    
    return {
        "id": chat
    }

async def customer_chat(websocket: WebSocket, session_id: int):
    print(session_id)
    await manager.connect_customer(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_json()
            print(data)

            # Lưu tin nhắn customer vào DB
            res_messages = send_message_service(data, user=None)
            print(res_messages)

            for msg in res_messages:
                print(msg)
                await manager.broadcast_to_admins(msg)
                print("send1")
                await manager.send_to_customer(session_id, msg)
                print("send2")

            bot_reply = res_messages[1].get("content", "")
            
            print(bot_reply)
            
            if "em đã ghi nhận thông tin" in bot_reply.lower():
                
                print("Nhận thông tin")
                rag = RAGModel()
                
                value = rag.extract_with_ai(res_messages[0].get("chat_session_id"))
                print(value)
                
                value2 = json.loads(value)
                
                print(value2)
            
            print("hết")

    except Exception as e:
        print(e)
        manager.disconnect_customer(websocket, session_id)



async def admin_chat(websocket: WebSocket, user: dict):
        # await manager.connect(websocket)
        
        await manager.connect_admin(websocket)

        try:
            while True:
                
                
                data = await websocket.receive_json()
                
                print(data)
                # await manager.broadcast(f"Message customer: {data}")
                
                # Lưu tin nhắn admin vào DB
                res_messages = send_message_service(data, user)
                
                # # Gửi đến tất cả customer đang kết nối (có thể lọc theo session_id nếu cần)
                for msg in res_messages:
                #     await manager.broadcast(msg)
                    await manager.send_to_customer(msg["chat_session_id"], msg)
                    await manager.broadcast_to_admins(msg)
                    
                    print("Gửi")
                        

        except Exception:
            manager.disconnect_admin(websocket)
            
       
async def handle_send_message(websocket: WebSocket, data : dict, user):
    message = send_message_service(websocket, data, user)
    
    # gửi realtime cho client
    return message
    
def get_history_chat_controller(chat_session_id: int):
    messages = get_history_chat_service(chat_session_id)
    return messages


def get_all_history_chat_controller():
    messages = get_all_history_chat_service()
    return messages

def parse_telegram(body: dict):
    print("ok")
    msg = body.get("message", {})
    sender_id = msg.get("from", {}).get("id")
    text = msg.get("text", "")


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

    message_text = messaging_event.get("message", {}).get("text", "")

    return {
        "platform": "facebook",
        "page_id": page_id,
        "sender_id": sender_id,
        "message": message_text,
        "timestamp": timestamp_str
    }

async def chat_fb(channel, body: dict):
    
    
    data = None
    
    if channel == "tele":
        data = parse_telegram(body)
        print("ok")
    
    elif channel == "fb":
        data = parse_facebook(body)
    
        
    message = send_message_page_service(data)   

    print(message)
    for msg in message:
        print("trả lời")
        await manager.broadcast_to_admins(msg)
    
    
    


def update_chat_session_controller(id: int, data: dict):
    chatSession = update_chat_session(id, data)
    if not chatSession:
        return {"message": "Not Found"}
    return chatSession

