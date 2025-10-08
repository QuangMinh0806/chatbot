from sqlalchemy.orm import Session
from models.knowledge_base import KnowledgeBase
from config.database import SessionLocal
from config.sheet import get_sheet
from llm.llm import RAGModel
import logging

logger = logging.getLogger(__name__)


def get_all_kb_service(db: Session):
    kbs = db.query(KnowledgeBase).first()
    return kbs



def update_kb_service(kb_id: int, data: dict, db: Session):
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        return None
    kb.title = data.get("title", kb.title)
    kb.content = data.get("content", kb.content)
    kb.source = data.get("source", kb.source)
    kb.category = data.get("category", kb.category)
    kb.is_active = data.get("is_active", kb.is_active)
    kb.customer_id = data.get("customer_id", kb.customer_id)
    
    db.commit()
    db.refresh(kb)
    
    # Xử lý Google Sheet nếu source là sheet ID
    if kb.source and len(kb.source) > 20:  # Google Sheet ID thường dài > 20 ký tự
        try:
            result = get_sheet(kb.source, kb.id)
            if not result["success"]:
                logger.error(f"Lỗi xử lý Google Sheet: {result['message']}")
                # Có thể return error hoặc tiếp tục tùy yêu cầu
            else:
                logger.info(f"Đã xử lý thành công Google Sheet: {result['message']}")
        except Exception as e:
            logger.error(f"Lỗi không mong muốn khi xử lý Google Sheet: {str(e)}")

    return kb


def create_kb_service(data: dict, db: Session):
    db.query(KnowledgeBase).delete()
    db.commit()
    
    kb = KnowledgeBase(
        title=data["title"],
        content=data["content"],
        source=data.get("source", "manual"),
        customer_id=data.get("customer_id", "manual"),
        category=data.get("category", "general"),
        is_active=data.get("is_active", True)
    )
    db.add(kb)
    db.commit()
    db.refresh(kb)
    
    # Xử lý Google Sheet nếu source là sheet ID
    if kb.source and len(kb.source) > 20:  # Google Sheet ID thường dài > 20 ký tự
        try:
            result = get_sheet(kb.source, kb.id)
            if not result["success"]:
                logger.error(f"Lỗi xử lý Google Sheet: {result['message']}")
                # Có thể raise exception hoặc return error tùy yêu cầu
            else:
                logger.info(f"Đã xử lý thành công Google Sheet: {result['message']}")
        except Exception as e:
            logger.error(f"Lỗi không mong muốn khi xử lý Google Sheet: {str(e)}")
    
    return kb


def search_kb_service(query: str, db: Session):
    
    rag = RAGModel()
    
    return rag.search_similar_documents(query, 5)
    
    