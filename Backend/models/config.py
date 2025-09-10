from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from config.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Boolean

class Config(Base):
    __tablename__ = "config"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    time = Column(DateTime, default=datetime.utcnow)
    
    status = Column(Boolean, default=True)

    company_id = Column(Integer, ForeignKey("company.id"), unique=True)  

    company = relationship("Company", back_populates="config")
    
    