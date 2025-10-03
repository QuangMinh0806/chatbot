"""
Message Service - Quản lý tin nhắn
"""
import json
import asyncio
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.chat import ChatSession, Message
from config.save_base64_image import save_base64_image
from llm.llm import RAGModel
from helper.task import save_message_to_db_async, update_session_admin_async
from services.session_service import SessionService
from services.platform_message_service import PlatformMessageService


class MessageService:
    """Service quản lý tin nhắn"""
    
    def __init__(self, db: Session):
        self.db = db
        self.session_service = SessionService(db)
        self.platform_service = PlatformMessageService(db)
    
    def _save_images(self, image_data: Any) -> List[str]:
        """Lưu images từ base64"""
        if not image_data:
            return []
        
        try:
            return save_base64_image(image_data)
        except Exception as e:
            print(f"Error saving images: {e}")
            traceback.print_exc()
            return []
    
    def create_message(self, chat_session_id: int, sender_type: str, 
                      content: str, sender_name: Optional[str] = None,
                      images: Optional[List[str]] = None) -> Message:
        """Tạo tin nhắn mới"""
        message = Message(
            chat_session_id=chat_session_id,
            sender_type=sender_type,
            content=content,
            sender_name=sender_name,
            image=json.dumps(images) if images else None
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
    
    def get_message_history(self, chat_session_id: int, page: int = 1, 
                           limit: int = 10) -> List[Message]:
        """Lấy lịch sử tin nhắn với pagination"""
        offset = (page - 1) * limit
        
        messages = (
            self.db.query(Message)
            .filter(Message.chat_session_id == chat_session_id)
            .order_by(Message.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        messages = list(reversed(messages))
        
        # Parse images
        for msg in messages:
            try:
                msg.image = json.loads(msg.image) if msg.image else []
            except Exception:
                msg.image = []

        return messages
    
    def get_all_conversations(self) -> List[Dict[str, Any]]:
        """Lấy tất cả cuộc hội thoại với tin nhắn mới nhất"""
        try:
            query = text("""
                SELECT 
                    cs.id AS session_id,
                    cs.status,
                    cs.channel,
                    cs.url_channel,
                    cs.alert,
                    ci.customer_data::text AS customer_data, 
                    cs.name,
                    cs.time,
                    cs.current_receiver,
                    cs.previous_receiver,
                    m.sender_type,
                    m.content,
                    m.sender_name, 
                    m.created_at AS created_at,
                    COALESCE(JSON_AGG(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') AS tag_names,
                    COALESCE(JSON_AGG(t.id) FILTER (WHERE t.id IS NOT NULL), '[]') AS tag_ids
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
                LEFT JOIN chat_session_tag cst ON cs.id = cst.chat_session_id
                LEFT JOIN tag t ON t.id = cst.tag_id
                GROUP BY 
                    cs.id, cs.status, cs.channel, ci.customer_data::text,
                    cs.name, cs.time, cs.alert, cs.current_receiver, cs.previous_receiver,
                    m.sender_type, m.content, m.sender_name, m.created_at
                ORDER BY m.created_at DESC;
            """)
            
            result = self.db.execute(query).fetchall()
            conversations = []
            
            for row in result:
                row_dict = dict(row._mapping)
                try:
                    row_dict["image"] = json.loads(row_dict["image"]) if row_dict.get("image") else []
                except Exception:
                    row_dict["image"] = []  
                conversations.append(row_dict)
                
            return conversations
            
        except Exception as e:
            print(f"Error getting conversations: {e}")
            traceback.print_exc()
            return []
    
    def delete_messages(self, chat_id: int, message_ids: List[int]) -> int:
        """Xóa tin nhắn"""
        messages = self.db.query(Message).filter(
            Message.id.in_(message_ids),
            Message.chat_session_id == chat_id
        ).all()
        
        if not messages:
            return 0
            
        for message in messages:
            self.db.delete(message)
        
        self.db.commit()
        return len(messages)
    
    def send_message_sync(self, data: Dict[str, Any], user: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Gửi tin nhắn đồng bộ (version cũ)"""
        sender_name = user.get("fullname") if user else None
        chat_session_id = data.get("chat_session_id")
        
        # Lưu images
        image_urls = self._save_images(data.get("image"))
        
        # Tạo tin nhắn user
        message = self.create_message(
            chat_session_id=chat_session_id,
            sender_type=data.get("sender_type"),
            content=data.get("content"),
            sender_name=sender_name,
            images=image_urls
        )
        
        # Lấy session
        session = self.session_service.get_session_by_id(chat_session_id)
        if not session:
            return []
        
        response_messages = [{
            "id": message.id,
            "chat_session_id": message.chat_session_id,
            "sender_type": message.sender_type,
            "sender_name": message.sender_name,
            "content": message.content,
            "image": image_urls,
            "session_name": session.name,
            "session_status": session.status
        }]
        
        # Xử lý tin nhắn admin
        if data.get("sender_type") == "admin":
            self.session_service.update_session_status(
                chat_session_id, "false", sender_name
            )
            
            # Cập nhật response với thông tin mới
            updated_session = self.session_service.get_session_by_id(chat_session_id)
            response_messages[0].update({
                "session_status": updated_session.status,
                "current_receiver": updated_session.current_receiver,
                "previous_receiver": updated_session.previous_receiver,
                "time": updated_session.time.isoformat() if updated_session.time else None
            })
            
            # Gửi đến platform
            self._send_to_platform(session, message)
            
        # Xử lý bot reply
        elif self.session_service.check_can_reply(chat_session_id):
            bot_message = self._generate_bot_response(data.get("content"), session)
            if bot_message:
                response_messages.append({
                    "id": bot_message.id,
                    "chat_session_id": bot_message.chat_session_id,
                    "sender_type": bot_message.sender_type,
                    "sender_name": bot_message.sender_name,
                    "content": bot_message.content,
                    "session_name": session.name,
                    "session_status": session.status,
                    "current_receiver": session.current_receiver,
                    "previous_receiver": session.previous_receiver
                })
        
        return response_messages
    
    async def send_message_async(self, data: Dict[str, Any], user: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Gửi tin nhắn bất đồng bộ (version tối ưu)"""
        sender_name = user.get("fullname") if user else None
        chat_session_id = data.get("chat_session_id")
        
        # Xử lý ảnh nếu có
        image_urls = self._save_images(data.get("image"))
        
        # Lấy session data
        session = self.session_service.get_session_by_id(chat_session_id)
        if not session:
            return []
        
        # Tạo response cho user message
        user_message = {
            "id": None,
            "chat_session_id": chat_session_id,
            "sender_type": data.get("sender_type"),
            "sender_name": sender_name,
            "content": data.get("content"),
            "image": image_urls,
            "session_name": session.name,
            "session_status": session.status
        }
        
        response_messages = [user_message]
        
        # Lưu tin nhắn vào database bất đồng bộ
        task1 = asyncio.create_task(
            save_message_to_db_async(data, sender_name, image_urls, self.db)
        )
        
        # Xử lý admin message
        if data.get("sender_type") == "admin":
            task2 = asyncio.create_task(
                update_session_admin_async(chat_session_id, sender_name, self.db)
            )
            
            # Cập nhật response
            response_messages[0].update({
                "session_status": "false",
                "current_receiver": sender_name,
                "previous_receiver": session.previous_receiver,
                "time": (datetime.now().replace(microsecond=0) + 
                        timedelta(hours=1)).isoformat()
            })
            
            # Gửi đến platform
            self._send_to_platform_async(session, user_message)
            
        # Xử lý bot reply
        elif self.session_service.check_can_reply(chat_session_id):
            bot_content = self._generate_bot_response_content(data.get("content"), session.id)
            
            if bot_content:
                bot_message = {
                    "id": None,
                    "chat_session_id": chat_session_id,
                    "sender_type": "bot",
                    "sender_name": None,
                    "content": bot_content,
                    "session_name": session.name,
                    "session_status": session.status,
                    "current_receiver": session.current_receiver,
                    "previous_receiver": session.previous_receiver
                }
                response_messages.append(bot_message)
                
                # Lưu bot message bất đồng bộ
                bot_data = {
                    "chat_session_id": chat_session_id,
                    "sender_type": "bot",
                    "content": bot_content
                }
                task3 = asyncio.create_task(
                    save_message_to_db_async(bot_data, None, [], self.db)
                )
        
        return response_messages
    
    def send_platform_message(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Xử lý tin nhắn từ platform (Facebook, Telegram, Zalo)"""
        platform = data["platform"]
        sender_id = data["sender_id"]
        page_id = data.get("page_id", "")
        
        # Tạo hoặc lấy session
        session = self.session_service.create_platform_session(
            platform, sender_id, page_id
        )
        
        # Tạo tin nhắn customer
        customer_message = self.create_message(
            chat_session_id=session.id,
            sender_type="customer",
            content=data["message"]
        )
        
        response_messages = [{
            "id": customer_message.id,
            "chat_session_id": customer_message.chat_session_id,
            "sender_type": customer_message.sender_type,
            "sender_name": customer_message.sender_name,
            "content": customer_message.content,
            "session_name": session.name,
            "platform": platform
        }]
        
        # Kiểm tra và tạo bot reply
        if self.session_service.check_can_reply(session.id):
            bot_message = self._generate_bot_response(customer_message.content, session)
            
            if bot_message:
                # Gửi đến platform
                if platform == "facebook":
                    self.platform_service.send_facebook_message(page_id, sender_id, bot_message)
                elif platform == "telegram":
                    self.platform_service.send_telegram_message(sender_id, bot_message)
                elif platform == "zalo":
                    self.platform_service.send_zalo_message(sender_id, bot_message)
                
                response_messages.append({
                    "id": bot_message.id,
                    "chat_session_id": bot_message.chat_session_id,
                    "sender_type": bot_message.sender_type,
                    "sender_name": bot_message.sender_name,
                    "content": bot_message.content,
                    "session_name": session.name,
                    "platform": platform
                })
        
        return response_messages
    
    def broadcast_message(self, data: Dict[str, Any], content: str) -> List[Dict[str, Any]]:
        """Gửi tin nhắn đến nhiều customers"""
        image_urls = self._save_images(data.get("image"))
        response_messages = []
        
        chat_session_ids = data.get("customers", [])
        
        for session_id in chat_session_ids:
            session = self.session_service.get_session_by_id(session_id)
            if not session:
                continue

            # Tạo message
            message = self.create_message(
                chat_session_id=session_id,
                sender_type="bot",
                content=content,
                images=image_urls
            )

            # Gửi đến platform
            self._send_to_platform(session, message)
            
            response_messages.append({
                "id": message.id,
                "chat_session_id": message.chat_session_id,
                "sender_type": message.sender_type,
                "sender_name": message.sender_name,
                "content": message.content,
                "image": image_urls,
                "session_name": session.name,
                "session_status": session.status
            })
       
        return response_messages
    
    def _generate_bot_response(self, user_content: str, session: ChatSession) -> Optional[Message]:
        """Tạo bot response và lưu vào DB"""
        try:
            rag = RAGModel(db_session=self.db)
            bot_content = rag.generate_response(user_content, session.id)
            
            return self.create_message(
                chat_session_id=session.id,
                sender_type="bot",
                content=bot_content
            )
        except Exception as e:
            print(f"Error generating bot response: {e}")
            traceback.print_exc()
            return None
    
    def _generate_bot_response_content(self, user_content: str, session_id: int) -> Optional[str]:
        """Tạo nội dung bot response (không lưu DB)"""
        try:
            rag = RAGModel(db_session=self.db)
            return rag.generate_response(user_content, session_id)
        except Exception as e:
            print(f"Error generating bot response: {e}")
            return None
    
    def _send_to_platform(self, session: ChatSession, message: Message):
        """Gửi tin nhắn đến platform đồng bộ"""
        try:
            name_to_send = session.name[2:]  # Bỏ prefix F-, T-, Z-
            
            if session.channel == "facebook":
                self.platform_service.send_facebook_message(session.page_id, name_to_send, message)
            elif session.channel == "telegram":
                self.platform_service.send_telegram_message(name_to_send, message)
            elif session.channel == "zalo":
                self.platform_service.send_zalo_message(name_to_send, message)
                
        except Exception as e:
            print(f"Error sending to platform: {e}")
    
    def _send_to_platform_async(self, session: ChatSession, message_data: Dict[str, Any]):
        """Gửi tin nhắn đến platform bất đồng bộ"""
        try:
            name_to_send = session.name[2:]
            
            if session.channel == "facebook":
                self.platform_service.send_facebook_message(session.page_id, name_to_send, message_data)
            elif session.channel == "telegram":
                self.platform_service.send_telegram_message(name_to_send, message_data)
            elif session.channel == "zalo":
                self.platform_service.send_zalo_message(name_to_send, message_data)
                
        except Exception as e:
            print(f"Error sending to platform async: {e}")


# Backward compatibility functions
def get_history_chat_service(chat_session_id: int, page: int = 1, limit: int = 10, db: Session = None) -> List[Message]:
    """Backward compatibility cho get_history_chat_service"""
    service = MessageService(db)
    return service.get_message_history(chat_session_id, page, limit)


def get_all_history_chat_service(db: Session) -> List[Dict[str, Any]]:
    """Backward compatibility cho get_all_history_chat_service"""
    service = MessageService(db)
    return service.get_all_conversations()


def send_message_service(data: Dict[str, Any], user: Optional[Dict], db: Session) -> List[Dict[str, Any]]:
    """Backward compatibility cho send_message_service"""
    service = MessageService(db)
    return service.send_message_sync(data, user)


async def send_message_fast_service(data: Dict[str, Any], user: Optional[Dict], db: Session) -> List[Dict[str, Any]]:
    """Backward compatibility cho send_message_fast_service"""
    service = MessageService(db)
    return await service.send_message_async(data, user)


def send_message_page_service(data: Dict[str, Any], db: Session) -> List[Dict[str, Any]]:
    """Backward compatibility cho send_message_page_service"""
    service = MessageService(db)
    return service.send_platform_message(data)


def sendMessage(data: Dict[str, Any], content: str, db: Session) -> List[Dict[str, Any]]:
    """Backward compatibility cho sendMessage"""
    service = MessageService(db)
    return service.broadcast_message(data, content)


def delete_message(chat_id: int, ids: List[int], db: Session) -> int:
    """Backward compatibility cho delete_message"""
    service = MessageService(db)
    return service.delete_messages(chat_id, ids)