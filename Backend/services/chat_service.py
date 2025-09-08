from models.chat import ChatSession, Message
from config.database import SessionLocal
from sqlalchemy import text
from llm.llm import RAGModel

def create_session_service():
    db = SessionLocal()
    try:
        chat = ChatSession()
        db.add(chat)
        db.commit()
        return chat.id
    finally:
        db.close()

def send_message_service(data: dict):
    db = SessionLocal()
    try:
        message = Message(
            chat_session_id=1,
            sender_type=data.get("sender_type"),
            content=data.get("content")
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        import os
        rag = RAGModel(db_session=db, gemini_api_key=os.getenv("GOOGLE_API_KEY"))
        mes = rag.generate_response(message.content)
        message_1 = Message(
            chat_session_id=1,
            sender_type="bot",
            content=mes
        )
        db.add(message_1)
        db.commit()
        db.refresh(message_1)

        return {
            "id": 1,
            "chat_session_id": message_1.chat_session_id,
            "sender_type": message_1.sender_type,
            "content": message_1.content
        }
    finally:
        db.close()

def get_history_chat_service(chat_session_id: int):
    db = SessionLocal()
    
    return (
        db.query(Message)
        .filter(Message.chat_session_id == chat_session_id)
        .order_by(Message.created_at.asc())
        .all()
    )


def get_history_chat_service(chat_session_id: int):
    db = SessionLocal()
    
    return (
        db.query(Message)
        .filter(Message.chat_session_id == 1)
        .order_by(Message.created_at.asc())
        .all()
    )



def get_all_history_chat_service():
    db = SessionLocal()
    
    query = text("""
        SELECT 
            cs.id AS session_id,
            cs.status,
            cs.channel,
            ci.full_name,
            ci.phone_number,
            m.sender_type,
            m.content,
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