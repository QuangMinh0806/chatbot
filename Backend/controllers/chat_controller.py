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
    sendMessage
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
    
    print("Thêm khách hàng vào Google Sheets thành công.")


async def sendMessage_controller(data: dict):
    try:
        message = sendMessage(data, data.get("content"))
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
    print(session_id)
    await manager.connect_customer(websocket, session_id)
    db = SessionLocal()
    
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

            # Thu thập thông tin khách hàng sau MỖI tin nhắn
            try:
                rag = RAGModel()
                extracted_info = rag.extract_customer_info_realtime(session_id, limit_messages=15)
                
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
                print(f"Lỗi khi trích xuất thông tin: {extract_error}")

            # Xử lý chốt đơn (khi bot nói "em đã ghi nhận thông tin")
            if len(res_messages) > 1:
                bot_reply = res_messages[1].get("content", "")
                
                if "em đã ghi nhận thông tin" in bot_reply.lower():
                    try:
                        # Lấy thông tin customer đã được cập nhật
                        final_customer = db.query(CustomerInfo).filter(
                            CustomerInfo.chat_session_id == session_id
                        ).first()
                        
                        if final_customer and final_customer.customer_data:
                            # Thêm vào Google Sheets
                            add_customer(final_customer.customer_data)
                            
                            # Thông báo chốt đơn thành công
                            order_complete = {
                                "chat_session_id": session_id,
                                "customer_data": final_customer.customer_data,
                                "type": "order_completed"
                            }
                            await manager.broadcast_to_admins(order_complete)
                            print(f"✅ Đã chốt đơn thành công cho khách hàng {session_id}")
                            
                    except Exception as order_error:
                        print(f"Lỗi khi xử lý chốt đơn: {order_error}")

    except Exception as e:
        print(f"Lỗi trong customer_chat: {e}")
        manager.disconnect_customer(websocket, session_id)

    finally:
        db.close()

async def admin_chat(websocket: WebSocket, user: dict):
        # await manager.connect(websocket)
        
        await manager.connect_admin(websocket)

        try:
            while True:
                
                
                data = await websocket.receive_json()
                
                
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
    
def get_all_customer_controller(data: dict):
    customers = get_all_customer_service(data)
    return customers


async def update_chat_session_controller(id: int, data: dict, user):
    chatSession = update_chat_session(id, data, user)
    if not chatSession:
        return {"message": "Not Found"}
    
    
    await manager.broadcast_to_admins(chatSession)
    
    return chatSession

async def update_tag_chat_session_controller(id: int, data: dict):
    chatSession = update_tag_chat_session(id, data)
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
    
    db = SessionLocal()
    
    try:
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
                print(f"Lỗi khi trích xuất thông tin: {extract_error}")
    
    finally:
        db.close()

def delete_chat_session_controller(ids: list[int]):
    deleted_count = delete_chat_session(ids)   # gọi xuống service
    return {
        "deleted": deleted_count,
        "ids": ids
    }

def delete_message_controller(chatId: int, ids: list[int]):
    deleted_count = delete_message(chatId, ids)   # gọi xuống service
    return {
        "deleted": deleted_count,
        "ids": ids
    }