import json
import os
import re
import time
from typing import List, Dict
from sqlalchemy import text, desc, select
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import SessionLocal
from models.llm import LLM
from models.chat import Message, ChatSession, CustomerInfo
from models.field_config import FieldConfig
from config.redis_cache import cache_get, cache_set, cache_delete
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()


class BaseRAGModel:
    """Base class chung cho các RAG model (Gemini, GPT, etc.)"""
    
    # Class variable để track key changes
    _last_known_key = None
    _key_cache_timestamp = None
    
    def __init__(self, db_session: AsyncSession = None):
        # Sử dụng db_session từ parameter nếu có, không thì tạo mới
        if db_session:
            self.db_session = db_session
            self.should_close_db = False  # Không đóng db vì không phải tự tạo
        else:
            # Để tương thích với code cũ, tạo sync session 
            # Trong thực tế nên truyền AsyncSession từ bên ngoài
            self.db_session = SessionLocal()
            self.should_close_db = True  # Đóng db vì tự tạo
        
        # Khởi tạo các thuộc tính cơ bản
        self.llm_config = None
        self.is_initialized = False

    async def initialize(self):
        """Initialize model với async database query - phải được override trong subclass"""
        raise NotImplementedError("Subclass must implement initialize method")

    def _key_changed(self, force_check: bool = False) -> bool:
        """Kiểm tra xem API key có thay đổi không - chỉ dùng cho sync version"""
        current_time = time.time()
        
        # Chỉ check mỗi 2 giây để tránh query DB liên tục (trừ khi force_check)
        if (not force_check and 
            BaseRAGModel._key_cache_timestamp and 
            current_time - BaseRAGModel._key_cache_timestamp < 2):
            return False
        
        # Lấy key mới nhất từ DB (sync)
        if hasattr(self.db_session, 'execute'):  # Check if it's async or sync
            # Sync session
            fresh_config = self.db_session.query(LLM).filter(LLM.id == 1).first()
        else:
            return False  # Không thể check key với async session
            
        if not fresh_config:
            return False
            
        current_key = fresh_config.key
        old_key = BaseRAGModel._last_known_key
        key_changed = (old_key != current_key)
        
        # Update cache
        BaseRAGModel._last_known_key = current_key
        BaseRAGModel._key_cache_timestamp = current_time
        
        if key_changed:
            print(f"DEBUG: API Key changed! Old: {old_key[:10] if old_key else 'None'}..., New: {current_key[:10]}...")
            self.llm_config = fresh_config
            
        return key_changed

    # Legacy sync methods để tương thích với code cũ
    def get_latest_messages(self, chat_session_id: int, limit: int) -> str: 
        """Legacy sync version - deprecated, sử dụng async version trong subclass"""
        print(f"DEBUG: Querying messages for chat_session_id={chat_session_id}, limit={limit}")
        
        if hasattr(self.db_session, 'query'):  # Sync session
            messages = (
                self.db_session.query(Message)
                .filter(Message.chat_session_id == chat_session_id)
                .order_by(desc(Message.created_at))
                .limit(limit)
                .all() 
            )
        else:
            # Async session - should not be used here
            print("WARNING: Using sync method with async session")
            return ""
        
        print(f"DEBUG: Found {len(messages)} messages")
        
        results = [
            {
                "id": m.id,
                "content": m.content,
                "sender_type": m.sender_type,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in reversed(messages) 
        ]

        print(f"DEBUG: Results after processing: {results}")

        # Tạo conversation text
        conversation = []
        for msg in results:
            line = f"{msg['sender_type']}: {msg['content']}"
            conversation.append(line)
        
        conversation_text = "\n".join(conversation)
        print(f"DEBUG: Final conversation text: '{conversation_text}'")
        
        return conversation_text

    def get_field_configs(self):
        """Legacy sync version - deprecated, sử dụng async version trong subclass"""
        cache_key = "field_configs:required_optional"
        
        # Thử lấy từ cache trước
        cached_result = cache_get(cache_key)
        if cached_result is not None:
            print("DEBUG: Lấy field configs từ cache")
            return cached_result.get('required_fields', {}), cached_result.get('optional_fields', {})
        
        try:
            print("DEBUG: Lấy field configs từ database")
            if hasattr(self.db_session, 'query'):  # Sync session
                field_configs = self.db_session.query(FieldConfig).order_by(FieldConfig.excel_column_letter).all()
            else:
                print("WARNING: Using sync method with async session")
                return {}, {}
            
            required_fields = {}
            optional_fields = {}
            
            for config in field_configs:
                field_name = config.excel_column_name
                if config.is_required:
                    required_fields[field_name] = field_name
                else:
                    optional_fields[field_name] = field_name
            
            # Cache kết quả với TTL 24 giờ (86400 giây)
            cache_data = {
                'required_fields': required_fields,
                'optional_fields': optional_fields
            }
            cache_set(cache_key, cache_data, ttl=86400)
            print(f"DEBUG: Đã cache field configs với {len(required_fields)} required và {len(optional_fields)} optional fields")
                    
            return required_fields, optional_fields
        except Exception as e:
            print(f"Lỗi khi lấy field configs: {str(e)}")
            # Trả về dict rỗng nếu có lỗi
            return {}, {}
    
    def get_customer_infor(self, chat_session_id: int) -> dict:
        """Legacy sync version - deprecated, sử dụng async version trong subclass"""
        try:
            if hasattr(self.db_session, 'query'):  # Sync session
                # Lấy thông tin khách hàng từ bảng customer_info
                customer_info = self.db_session.query(CustomerInfo).filter(
                    CustomerInfo.chat_session_id == chat_session_id
                ).first()
            else:
                print("WARNING: Using sync method with async session")
                return {}
            
            if customer_info and customer_info.customer_data:
                # Nếu customer_data là string JSON, parse nó
                if isinstance(customer_info.customer_data, str):
                    return json.loads(customer_info.customer_data)
                # Nếu đã là dict thì return trực tiếp
                return customer_info.customer_data
            return {}
        except Exception as e:
            print(f"Lỗi khi lấy thông tin khách hàng: {str(e)}")
            return {}

    def search_similar_documents(self, query: str, top_k: int, embedding_function) -> List[Dict]:
        """Legacy sync version - deprecated, sử dụng async version trong subclass"""
        try:
            # Tạo embedding cho query
            query_embedding = embedding_function(query)

            # numpy.ndarray -> list -> string (pgvector format)
            query_embedding = query_embedding.tolist()
            query_embedding = "[" + ",".join([str(x) for x in query_embedding]) + "]"

            sql = text("""
                SELECT id, chunk_text, search_vector <-> (:query_embedding)::vector AS similarity
                FROM document_chunks
                ORDER BY search_vector <-> (:query_embedding)::vector
                LIMIT :top_k
            """)

            if hasattr(self.db_session, 'execute'):  # Sync session  
                rows = self.db_session.execute(
                    sql, {"query_embedding": query_embedding, "top_k": top_k}
                ).fetchall()
            else:
                print("WARNING: Using sync method with async session")
                return []

            results = []
            for row in rows:
                results.append({
                    "content": row.chunk_text,
                    "similarity_score": float(row.similarity)
                })

            return results

        except Exception as e:
            raise Exception(f"Lỗi khi tìm kiếm: {str(e)}")

    def extract_customer_info_realtime(self, chat_session_id: int, limit_messages: int, llm_generate_function):
        """Legacy sync version - deprecated, sử dụng async version trong subclass"""
        try:
            history = self.get_latest_messages(chat_session_id=chat_session_id, limit=limit_messages)
            
            print("HISTORY FOR EXTRACTION:", history)
            
            # Lấy cấu hình fields động
            required_fields, optional_fields = self.get_field_configs()
            all_fields = {**required_fields, **optional_fields}
            
            # Nếu không có field configs, trả về JSON rỗng
            if not all_fields:
                print("DEBUG: No field configs found, returning empty JSON")
                return json.dumps({})
            
            # Nếu không có lịch sử hội thoại, trả về JSON rỗng với các fields từ config
            if not history or history.strip() == "":
                print("DEBUG: No history found, returning empty JSON")
                empty_json = {field_name: None for field_name in all_fields.values()}
                return json.dumps(empty_json)
            
            # Tạo danh sách fields cho prompt - chỉ các fields từ field_config
            fields_description = "\n".join([
                f"- {field_name}: trích xuất {field_name.lower()} từ hội thoại"
                for field_name in all_fields.values()
            ])
            
            # Tạo ví dụ JSON template - chỉ các fields từ field_config
            example_json = {field_name: f"<{field_name}>" for field_name in all_fields.values()}
            example_json_str = json.dumps(example_json, ensure_ascii=False, indent=4)
            
            prompt = f"""
                Bạn là một công cụ phân tích hội thoại để trích xuất thông tin khách hàng.

                Dưới đây là đoạn hội thoại gần đây:
                {history}

                Hãy trích xuất TOÀN BỘ thông tin khách hàng có trong hội thoại và trả về JSON với CÁC TRƯỜNG SAU (chỉ các trường này):
                {fields_description}

                QUY TẮC QUAN TRỌNG:
                - CHỈ trích xuất các trường được liệt kê ở trên
                - KHÔNG thêm bất kỳ trường nào khác (như registration, status, etc.)
                - Nếu không có thông tin cho trường nào thì để null
                - CHỈ trả về JSON thuần túy, không có text khác
                - Không sử dụng markdown formatting
                - JSON phải hợp lệ để dùng với json.loads()

                Ví dụ format trả về (chỉ chứa các trường từ cấu hình):
                {example_json_str}
                """
                
            response_text = llm_generate_function(prompt)
            cleaned = re.sub(r"```json|```", "", response_text).strip()
            
            return cleaned
            
        except Exception as e:
            print(f"Lỗi trích xuất thông tin: {str(e)}")
            return None

    def infomation_customer(self):
        """Wrapper method để tương thích với code cũ"""
        required_fields, optional_fields = self.get_field_configs()
        return required_fields, optional_fields

    @staticmethod
    def clear_field_configs_cache():
        """Xóa cache field configs khi có thay đổi cấu hình"""
        cache_key = "field_configs:required_optional"
        success = cache_delete(cache_key)
        print(f"DEBUG: {'Thành công' if success else 'Thất bại'} xóa cache field configs")
        return success

    # Abstract methods - phải được implement trong class con
    async def build_search_key(self, chat_session_id: int, question: str, customer_info=None) -> str:
        """Xây dựng từ khóa tìm kiếm từ lịch sử và câu hỏi hiện tại"""
        raise NotImplementedError("Subclass must implement build_search_key method")
    
    async def generate_response(self, query: str, chat_session_id: int) -> str:
        """Tạo câu trả lời cho query của người dùng"""
        raise NotImplementedError("Subclass must implement generate_response method")
    
    async def extract_customer_info_realtime(self, chat_session_id: int, limit_messages: int):
        """Trích xuất thông tin khách hàng theo thời gian thực"""
        raise NotImplementedError("Subclass must implement extract_customer_info_realtime method")
    
    async def get_latest_messages(self, chat_session_id: int, limit: int) -> str:
        """Lấy tin nhắn gần đây nhất từ chat session"""
        raise NotImplementedError("Subclass must implement get_latest_messages method")
    
    async def search_similar_documents(self, query: str, top_k: int) -> List[Dict]:
        """Tìm kiếm tài liệu tương tự dựa trên vector embedding"""
        raise NotImplementedError("Subclass must implement search_similar_documents method")
    
    async def get_field_configs(self):
        """Lấy cấu hình fields từ bảng field_config với Redis cache"""
        raise NotImplementedError("Subclass must implement get_field_configs method")
    
    async def get_customer_infor(self, chat_session_id: int) -> dict:
        """Lấy thông tin khách hàng từ database"""
        raise NotImplementedError("Subclass must implement get_customer_infor method")