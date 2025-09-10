from sqlalchemy.orm import Session
from config.database import SessionLocal
from models.config import  Config
from datetime import datetime

def get_config_by_company(id: int):
    db = SessionLocal()
    try:
        return db.query(Config).filter(Config.id == id).first()
    finally:
        db.close()


def update_config(id: int, data: dict):
    db = SessionLocal()
    try:
        config = db.query(Config).filter(Config.id == id).first()
        if not config:
            return None

        config.status = bool(data.get("status"))
        config.time = data.get("time")  
        db.commit()
        db.refresh(config)
        return config
    finally:
        db.close()
    
