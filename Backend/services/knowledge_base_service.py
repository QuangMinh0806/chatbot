from sqlalchemy.orm import Session
from models.knowledge_base import KnowledgeBase
from config.database import SessionLocal
from config.sheet import get_sheet


def get_all_kb_service():
    db = SessionLocal()
    try:
        kbs = db.query(KnowledgeBase).filter(KnowledgeBase.id == 9).first()
        return kbs
    finally:
        db.close()



def update_kb_service(kb_id: int, data: dict):
    db = SessionLocal()
    try:
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
        if not kb:
            return None

        kb.title = data.get("title", kb.title)
        kb.content = data.get("content", kb.content)
        kb.source = data.get("source", kb.source)
        kb.category = data.get("category", kb.category)
        kb.is_active = data.get("is_active", kb.is_active)

        db.commit()
        db.refresh(kb)
        return kb
    finally:
        db.close()

def create_kb_service(data: dict):
    db = SessionLocal()
    try:
        kb = KnowledgeBase(
            title=data["title"],
            content=data["content"],
            source=data.get("source", "manual"),
            category=data.get("category", "general"),
            is_active=data.get("is_active", True)
        )
        db.add(kb)
        db.commit()
        db.refresh(kb)
        
        get_sheet(kb.source, kb.id)
        return kb
    finally:
        db.close()
        
