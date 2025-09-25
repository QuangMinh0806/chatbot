from sqlalchemy import Column, ForeignKey, Integer, String, JSON, DateTime, Text
from datetime import datetime
from config.database import Base



class LLM(Base):
    __tablename__ = "llm" 
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    key = Column(String(150), nullable=False)
    prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    company_id = Column(Integer, ForeignKey("company.id"), nullable=True)
    system_greeting = Column(Text, nullable=True)
    botName = Column(String(100), nullable=True)
    