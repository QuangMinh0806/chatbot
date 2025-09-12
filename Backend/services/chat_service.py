from models.chat import ChatSession, Message, CustomerInfo
from config.database import SessionLocal
from sqlalchemy import text
from llm.llm import RAGModel
from datetime import datetime, timedelta
from fastapi import WebSocket

def create_session_service():
    db = SessionLocal()
    try:
        chat = ChatSession()
        db.add(chat)
        db.commit()
        return chat.id
    finally:
        db.close()

def send_message_service(data: dict, user):
    db = SessionLocal()
    try:
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
        
        response_messages = []  
        
        response_messages.append({
            "id": message.id,
            "chat_session_id": message.chat_session_id,
            "sender_type": message.sender_type,
            "sender_name": message.sender_name,
            "content": message.content,
            # "created_at": message.created_at
        })
        

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
                # "created_at": message_bot.created_at
            })
        
        
                        
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
    """)
    
    result = db.execute(query).fetchall()
    
    conversations = [
        dict(row._mapping) for row in result
    ]
    return conversations

def check_repply(id : int):
    db = SessionLocal()
    print("true")
    session  = db.query(ChatSession).filter(ChatSession.id == id).first()
    
    if session.time and datetime.now() > session.time and session.status == "false":
        session.status = "true"
        session.time = None
        db.commit()
        db.refresh(session)

        return True

    if session.status == "true":
        print("true")
        return True
    
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
