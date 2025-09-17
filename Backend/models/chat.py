from sqlalchemy import JSON, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base
from sqlalchemy import Column, Boolean

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    # name = Column(String)
    status = Column(String, default="true")
    time = Column(DateTime, nullable=True)
    channel = Column(String, default="web")
    name = Column(String, default="web")
    created_at = Column(DateTime, default=datetime.now())
    messages = relationship("Message", back_populates="session")
    customer_info = relationship("CustomerInfo", back_populates="session", uselist=False)
    id_tag = Column(Integer, ForeignKey("tag.id"), nullable=True)
    tag = relationship("Tag", back_populates="chat_sessions")
    
class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    sender_name = Column(String)
    sender_type = Column(String)   # customer / bot / staff
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.now())
    sender_name = Column(String)
    session = relationship("ChatSession", back_populates="messages")
 
class CustomerInfo(Base):
    __tablename__ = "customer_info"
    id = Column(Integer, primary_key=True, index=True)
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    created_at = Column(DateTime, default=datetime.now())

    field_config_id = Column(Integer, ForeignKey("field_config.id"), nullable=False)
    field_config = relationship("FieldConfig")
    session = relationship("ChatSession", back_populates="customer_info")
    customer_data = Column(JSON, nullable=True, default={})