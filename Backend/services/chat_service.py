import random
from models.chat import ChatSession, Message, CustomerInfo
from config.database import SessionLocal
from sqlalchemy import text
from llm.llm import RAGModel
from datetime import datetime, timedelta
from fastapi import WebSocket
import random



def create_session_service():
    db = SessionLocal()
    try:
        session = ChatSession(
            name=f"W-{random.randint(10**7, 10**8 - 1)}",  # random 8 số
            channel="web",
        )
        db.add(session)
        db.commit()
        return session.id
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
        
        
        print("1")

        if data.get("sender_type") == "admin":
            session = db.query(ChatSession).filter(ChatSession.id == data.get("chat_session_id")).first()
            session.status = "false" 
            session.time = datetime.now() + timedelta(hours=1)  
            db.commit()
            return response_messages
        
        
        
        elif check_repply(data.get("chat_session_id")) :
            
            import os
            rag = RAGModel(db_session=db, gemini_api_key=os.getenv("GOOGLE_API_KEY"))
            mes = rag.generate_response(message.content)
            message_bot = Message(
                chat_session_id=data.get("chat_session_id"),
                sender_type="bot",
                content=mes
            )
            db.add(message_bot)
            db.commit()
            db.refresh(message_bot)

            response_messages.append({
                "id": message_bot.id,
                "chat_session_id": message_bot.chat_session_id,
                "sender_type": message_bot.sender_type,
                "sender_name": message_bot.sender_name,
                "content": message_bot.content,
                "session_name": session.name
                # "created_at": message_bot.created_at
            })
        
        print(check_repply(data.get("chat_session_id")))
                        
        return response_messages
    
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
            ci.full_name,
            ci.phone_number,
            cs.name,
            cs.time,
            m.sender_type,
            m.content,
            m.sender_name, 
            m.created_at AS created_at
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


def send_message_page_service(data: dict):
    db = SessionLocal()
    try:
        session  = db.query(ChatSession).filter(ChatSession.name == f"W-{data['sender_id']}").first()
        
        if not session:
            session = ChatSession(
                name=f"W-{data['sender_id']}",
                channel="facebook",
            )
            
            db.add(session)
            db.commit()
            db.refresh(session)
        
        message = Message(
            chat_session_id=session.id,
            sender_type="customer",
            content=data["message"]
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
         
        
        if check_repply(session.id) : 
            import os
            rag = RAGModel(db_session=db, gemini_api_key=os.getenv("GOOGLE_API_KEY"))
            mes = rag.generate_response(message.content)
            message_1 = Message(
                chat_session_id= session.id,
                sender_type="bot",
                content=mes
            )
            db.add(message_1)
            db.commit()
            db.refresh(message_1)
            
            print("không chặn")
            return {
                "id": message_1.id,
                "chat_session_id": message_1.chat_session_id,
                "sender_type": message_1.sender_type,
                "content": message_1.content
            }
        
        print("chặn") 
        return -1
        
        

        
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
