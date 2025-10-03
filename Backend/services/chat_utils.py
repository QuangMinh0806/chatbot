"""
Chat Utils - Các hàm utility cho chat service
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from models.chat import ChatSession
from services.session_service import SessionService
from services.message_service import MessageService


class ChatUtils:
    """Các hàm utility cho chat"""
    
    def __init__(self, db: Session):
        self.db = db
        self.session_service = SessionService(db)
        self.message_service = MessageService(db)
    
    def get_all_customers(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Lấy danh sách customers với filter"""
        channel = data.get("channel")
        tag_id = data.get("tag_id")
        return self.session_service.get_all_customers(channel, tag_id)
    
    def update_chat_session(self, session_id: int, data: Dict[str, Any], 
                           user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật chat session"""
        return self.session_service.update_session(session_id, data, user)
    
    def delete_chat_sessions(self, session_ids: List[int]) -> int:
        """Xóa nhiều chat sessions"""
        return self.session_service.delete_sessions(session_ids)
    
    def delete_messages(self, chat_id: int, message_ids: List[int]) -> int:
        """Xóa tin nhắn"""
        return self.message_service.delete_messages(chat_id, message_ids)
    
    def update_session_tags(self, session_id: int, data: Dict[str, Any]) -> Optional[Any]:
        """Cập nhật tags của session"""
        try:
            session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session:
                return None
            
            if "tags" in data and isinstance(data["tags"], list):
                from models.tag import Tag
                tags = self.db.query(Tag).filter(Tag.id.in_(data["tags"])).all()
                session.tags = tags
            
            self.db.commit()
            self.db.refresh(session)
            return session
            
        except Exception as e:
            print(f"Error updating session tags: {e}")
            self.db.rollback()
            return None


# Backward compatibility functions
def get_all_customer_service(data: Dict[str, Any], db: Session) -> List[Dict[str, Any]]:
    """Backward compatibility cho get_all_customer_service"""
    utils = ChatUtils(db)
    return utils.get_all_customers(data)


def update_chat_session(session_id: int, data: Dict[str, Any], user: Dict[str, Any], db: Session) -> Optional[Dict[str, Any]]:
    """Backward compatibility cho update_chat_session"""
    utils = ChatUtils(db)
    return utils.update_chat_session(session_id, data, user)


def delete_chat_session(ids: List[int], db: Session) -> int:
    """Backward compatibility cho delete_chat_session"""
    utils = ChatUtils(db)
    return utils.delete_chat_sessions(ids)


def update_tag_chat_session(session_id: int, data: Dict[str, Any], db: Session) -> Optional[Any]:
    """Backward compatibility cho update_tag_chat_session"""
    utils = ChatUtils(db)
    return utils.update_session_tags(session_id, data)