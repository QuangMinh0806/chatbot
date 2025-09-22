from services.chat_service import (
    create_session_service,
    send_message_service,
    get_history_chat_service,
    get_all_history_chat_service,
    send_message_page_service,
    update_chat_session,
    check_session_service
)
from services.llm_service import (get_all_llms_service)
from fastapi import WebSocket
from datetime import datetime
from models.chat import CustomerInfo
import requests
from config.websocket_manager import ConnectionManager
import datetime
import json
from llm.llm import RAGModel
manager = ConnectionManager()
from config.database import SessionLocal
db = SessionLocal()

def create_session_controller():
    chat = create_session_service()    
    return {
        "id": chat
    }

def check_session_controller(sessionId ):
    chat = check_session_service(sessionId)    
    return {
        "id": chat
    }
from google.oauth2.service_account import Credentials
import gspread

creds = Credentials.from_service_account_file(
    "config/config_sheet.json",  # file service account JSON tải từ Google Cloud
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

            if len(res_messages) > 1:
                bot_reply = res_messages[1].get("content", "")
                
                
                if "em đã ghi nhận thông tin" in bot_reply.lower():
                    
                    rag = RAGModel()
                    
                    value = rag.extract_with_ai(res_messages[1].get("chat_session_id"))
                    
                    
                    value2 = json.loads(value)
                    
                    print(value2)
                    
                    customer = CustomerInfo(
                        chat_session_id = res_messages[1].get("chat_session_id"),
                        customer_data = value2,
                        field_config_id = 1
                    )
                    
                    db.add(customer)
                    db.commit()
                    
                    add_customer(value2)
                    
                    customer_chat = {
                        "chat_session_id": res_messages[1].get("chat_session_id"),
                        "customer_data": customer.customer_data
                    }
                    
                    
                    
                    await manager.broadcast_to_admins(customer_chat)
                    
                    db.close()

            

    except Exception as e:
        print(e)
        manager.disconnect_customer(websocket, session_id)

    finally:
        db.close()

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
    
    


def update_chat_session_controller(id: int, data: dict, user):
    chatSession = update_chat_session(id, data, user)
    if not chatSession:
        return {"message": "Not Found"}
    return chatSession

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


def parse_zalo(body: dict):
    event_name = body.get("event_name")
    sender_id = None
    text = None

    if event_name == "user_send_text":
        sender_id = body["sender"]["id"]
        text = body["message"]["text"]
        

    return {
        "platform": "zalo",
        "sender_id": sender_id,
        "message": text
    }

async def chat_platform(channel, body: dict):
    
    
    data = None
    
    if channel == "tele":
        data = parse_telegram(body)
        print("ok")
    
    elif channel == "fb":
        data = parse_facebook(body)
     
    elif channel == "zalo":
        data = parse_zalo(body)
        
        
     
    message = send_message_page_service(data)   

    
    for msg in message:
        await manager.broadcast_to_admins(msg)
    
    
    if len(message) > 1:
        bot_reply = message[1].get("content", "")
        
        
        if "em đã ghi nhận thông tin" in bot_reply.lower():
            
            rag = RAGModel()
            
            value = rag.extract_with_ai(message[1].get("chat_session_id"))
            print(value)
            
            value2 = json.loads(value)
            
            print(value2)
            
            customer = CustomerInfo(
                chat_session_id = message[1].get("chat_session_id"),
                customer_data = value2,
                field_config_id = 1
            )
            
            db.add(customer)
            db.commit()
            
            add_customer(value2)
            
            customer_chat = {
                "chat_session_id": message[1].get("chat_session_id"),
                "customer_data": customer.customer_data
            }
            
            
            await manager.broadcast_to_admins(customer_chat)
            db.close()