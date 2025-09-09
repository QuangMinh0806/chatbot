from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text
from datetime import datetime
from config.database import Base



class LLM(Base):
    __tablename__ = "llm" 
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    key = Column(String(150), nullable=False)
    prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    