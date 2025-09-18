import random
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
import requests
import traceback

def create_session_service():
    db = SessionLocal()
    try:
        session = ChatSession(
            name=f"W-{random.randint(10**7, 10**8 - 1)}",
            channel="web",
        )
        db.add(session)
        db.flush()   # để session.id được gán ngay
        session_id = session.id
        db.commit()
        return session_id
    finally:
        db.close()
        
def send_message_service(data: dict, user):
    print("ngon")
    db = SessionLocal()
    try:
        print("ngon")
        sender_name = user.get("fullname") if user else None
        
        
        # Tin nhắn đến
        message = Message(
            chat_session_id=data.get("chat_session_id"),
            sender_type=data.get("sender_type"),
            content=data.get("content"),
            sender_name=sender_name
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        print("ngon")
        
        response_messages = []  
        
        session = db.query(ChatSession).filter(ChatSession.id == data.get("chat_session_id")).first()
        
        
        
        response_messages.append({
            "id": message.id,
            "chat_session_id": message.chat_session_id,
            "sender_type": message.sender_type,
            "sender_name": message.sender_name,
            "content": message.content,
            "session_name": session.name,
            "session_status" : session.status
            # "created_at": message.created_at
        })
        
        
        if data.get("sender_type") == "admin":
            session = db.query(ChatSession).filter(ChatSession.id == data.get("chat_session_id")).first()
            session.status = "false" 
            session.time = datetime.now() + timedelta(hours=1)  
            db.commit()
            
            print(session)
            
            name_to_send = session.name[2:]
            
            if session.channel == "facebook":
                
                send_fb(session.page_id, name_to_send, message)
            elif session.channel == "telegram":
                send_telegram(name_to_send, message)
            elif session.channel == "zalo":
                send_zalo(name_to_send, message)
            
            
            
            return response_messages
        
        
        
        elif check_repply(data.get("chat_session_id")) :
            
            print("ok")
            rag = RAGModel()
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
                "session_name": session.name
                # "created_at": message_bot.created_at
            })
        
        
        print("ok in")
        
                        
        return response_messages
    except Exception as e:
        print(e)
        traceback.print_exc()
    finally: 
        db.close()

def get_history_chat_service(chat_session_id: int):
    db = SessionLocal()
    
    messages = (
        db.query(Message)
        .filter(Message.chat_session_id == chat_session_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return messages


def get_all_history_chat_service():
    db = SessionLocal()
    
    query = text("""
        SELECT 
            cs.id AS session_id,
            cs.status,
            cs.channel,
            ci.customer_data,
            cs.name,
            cs.time,
            m.sender_type,
            m.content,
            m.sender_name, 
            m.created_at AS created_at,
            tag.name AS tag_name
        FROM chat_sessions cs
        LEFT JOIN customer_info ci ON cs.id = ci.chat_session_id
        JOIN messages m ON cs.id = m.chat_session_id
        LEFT JOIN tag ON tag.id = cs.id_tag
        JOIN (
            SELECT
                chat_session_id,
                MAX(created_at) AS latest_time
            FROM messages
            GROUP BY chat_session_id
        ) AS latest ON cs.id = latest.chat_session_id AND m.created_at = latest.latest_time
        ORDER BY m.created_at DESC;
    """)
    
    result = db.execute(query).fetchall()
    
    conversations = [
        dict(row._mapping) for row in result
    ]
    return conversations

def check_repply(id : int):
    db = SessionLocal()
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












def send_fb(page_id : str, sender_id, data):
    db = SessionLocal()
    
    print(page_id)
    page  = db.query(FacebookPage).filter(FacebookPage.page_id == page_id).first()
    print(page)
    PAGE_ACCESS_TOKEN = page.access_token
    
    print(page)
    
    url = f"https://graph.facebook.com/v23.0/{page_id}/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient":{
            "id": sender_id
        },
        "message":{
            "text":data.content
        }
    }

    
    
    requests.post(url, json=payload, timeout=10)
    










async def send_telegram(chat_id, message):
    
    db = SessionLocal()
    token  = db.query(TelegramBot).filter(TelegramBot.id  == 1).first()
    
    TELEGRAM_TOKEN = token.bot_token
    
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message.content
    }
    
    await requests.post(url, json=payload)







   
def send_zalo(chat_id, message):
    try:
        db = SessionLocal()
        zalo  = db.query(ZaloBot).filter(ZaloBot.id  == 1).first()
        
        ACCESS_TOKEN = zalo.access_token
        
        
        url = "https://openapi.zalo.me/v3.0/oa/message/cs"
        headers = {
            "Content-Type": "application/json",
            "access_token": ACCESS_TOKEN
        }
        payload = {
            "recipient": {"user_id": f"{chat_id}"},
            "message": {"text": message.content}
        }
    
        
        requests.post(url, headers=headers, json=payload)
        
    except Exception as e:
        print("hangviet")
        print(e)
        traceback.print_exc() 
      
def send_message_page_service(data: dict):
    db = SessionLocal()
    try:
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
        
        
        if not session:
            session = ChatSession(
                name=f"{prefix}-{data['sender_id']}",
                channel=data["platform"],
                page_id = data.get("page_id", "") 
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
        

        if check_repply(session.id) : 
            rag = RAGModel()

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
                send_fb(data["page_id"], data['sender_id'], message_1)
            elif data["platform"] == "telegram":
                send_telegram(data["sender_id"], message_1)
            elif data["platform"] == "zalo":
                send_zalo(data["sender_id"], message_1)
            
            
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
        
    except Exception as e:
        print(e)
        traceback.print_exc()   
    finally:
        db.close()

def update_chat_session(id: int, data: dict):
    db = SessionLocal()
    try:
        chatSession = db.query(ChatSession).filter(ChatSession.id == id).first()
        if not chatSession:
            return None

        chatSession.status = bool(data.get("status"))
        chatSession.time = data.get("time")  
        db.commit()
        db.refresh(chatSession)
        return chatSession
    finally:
        db.close()
