import json
import os
import re
from typing import List, Dict
from sqlalchemy import text, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from config.get_embedding import get_embedding_chatgpt
from llm.base_rag import BaseRAGModel
from llm.prompt import prompt_builder
from openai import OpenAI
from models.llm import LLM
from models.chat import Message, CustomerInfo
from models.field_config import FieldConfig
from config.redis_cache import cache_get, cache_set, cache_delete
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()


class RAGModel(BaseRAGModel):
    def __init__(self, model_name: str = "gpt-4o-mini", db_session: AsyncSession = None):
        # Gọi constructor của class cha
        super().__init__(db_session)
        
        # Khởi tạo client OpenAI với key mới nhất
        self.model_name = model_name
        self.client = None
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize model với async database query"""
        if self.is_initialized:
            return
            
        result = await self.db_session.execute(select(LLM).filter(LLM.id == 1))
        llm = result.scalar_one_or_none()
        print(f"DEBUG GPT: LLM Config: {llm}")
        
        # Cấu hình OpenAI
        self.client = OpenAI(api_key=llm.key)
        self.is_initialized = True
        
    def _refresh_client(self):
        """Refresh OpenAI client với API key mới nhất từ database nếu cần"""
        if self._key_changed():
            # Tạo client mới với key mới nhất  
            self.client = OpenAI(api_key=self.llm_config.key)
            print(f"DEBUG GPT: Refreshed OpenAI client with new key")
        
    def _ensure_fresh_client(self):
        """Đảm bảo client được refresh nếu key thay đổi"""
        if not hasattr(self, 'client') or self._key_changed():
            self.client = OpenAI(api_key=self.llm_config.key)
            print(f"DEBUG GPT: Created/Refreshed OpenAI client")

    async def get_latest_messages(self, chat_session_id: int, limit: int): 
        result = await self.db_session.execute(
            select(Message)
            .filter(Message.chat_session_id == chat_session_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
        )
        messages = result.scalars().all()
        
        results = [
            {
                "id": m.id,
                "content": m.content,
                "sender_type": m.sender_type,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in reversed(messages) 
        ]

        # return results
        conversation = []
        for msg in results:
            line = f"{msg['sender_type']}: {msg['content']}"
            conversation.append(line)
        
        conversation_text = "\n".join(conversation)
        
        return conversation_text

    async def build_search_key(self, chat_session_id: int, question: str, customer_info=None) -> str:
        """Xây dựng từ khóa tìm kiếm từ lịch sử và câu hỏi hiện tại"""
        # Đảm bảo model được initialize trước khi sử dụng
        if not self.is_initialized:
            await self.initialize()
        
        history = await self.get_latest_messages(chat_session_id=chat_session_id, limit=5)
        
        # Chuẩn bị thông tin khách hàng cho context
        customer_context = ""
        if customer_info:
            customer_context = f"\nThông tin khách hàng: {customer_info}"
        
        prompt = f"""
        Tạo từ khóa tìm kiếm cho câu hỏi của khách hàng.
        
        Hội thoại trước:
        {history}
        {customer_context}

        Câu hỏi: {question}

        QUY TẮC ĐƠN GIẢN:
        
        1. ƯU TIÊN GIỮ NGUYÊN câu hỏi nếu nó đã đầy đủ thông tin
           VD: "Khóa HSK3 học những gì?" → GIỮ NGUYÊN: "Khóa HSK3 học những gì"
        
        2. CHỈ BỔ SUNG khi câu hỏi THIẾU thông tin quan trọng từ context:
           - Thiếu tên khóa học → thêm tên khóa từ hội thoại trước
           - Hỏi lịch mà có thông tin hình thức/địa điểm → thêm vào
        
        3. ⚠️ QUY TẮC QUAN TRỌNG - Khi hỏi về LỊCH KHAI GIẢNG:
           
           Nếu khách chọn ONLINE (học từ xa, trực tuyến):
           → BẮT BUỘC có: "lớp học trực tuyến" hoặc "online"
           → VD: "lịch khai giảng lớp học trực tuyến HSK3"
           
           Nếu khách chọn OFFLINE (học trực tiếp):
           → BẮT BUỘC có: THÀNH PHỐ và TÊN CƠ SỞ
           → VD: "lịch khai giảng HSK3 cơ sở Đống Đa Hà Nội"
           → VD: "lịch khai giảng HSK3 cơ sở Lê Lợi Đà Nẵng"
        
        4. KHÔNG ĐƯỢC:
           - Thêm quá nhiều từ đồng nghĩa
           - Mở rộng không cần thiết
           - Viết lại câu hỏi theo cách khác
        
        5. GIỮ NGẮN GỌN: Tối đa 10 từ, trừ khi cần thiết
        
        VÍ DỤ:
        
        Câu hỏi đầy đủ - GIỮ NGUYÊN:
        - "Khóa HSK3 học những gì?" → "Khóa HSK3 học những gì"
        - "Học phí khóa giao tiếp bao nhiêu?" → "Học phí khóa giao tiếp"
        - "Có cơ sở ở Hà Nội không?" → "Cơ sở ở Hà Nội"
        - "Đội ngũ giảng viên thế nào?" → "Đội ngũ giảng viên"
        - "Sĩ số lớp bao nhiêu?" → "Sĩ số lớp"
        - "Có cho học thử không?" → "Học thử"
        
        Câu hỏi về lịch - PHÂN BIỆT ONLINE/OFFLINE:
        - "Khi nào khai giảng?" (khách chọn ONLINE, HSK3) 
          → "lịch khai giảng lớp học trực tuyến HSK3"
        
        - "Khi nào khai giảng?" (khách chọn ONLINE, HSK4)
          → "lịch khai giảng lớp học trực tuyến HSK4"
        
        - "Lịch tháng này?" (khách chọn OFFLINE, HSK5, Hà Nội)
          → "lịch khai giảng dự kiến HSK5 cơ sở Đống Đa Hà Nội"
        
        - "Khi nào học?" (khách chọn OFFLINE, HSK3, cơ sở Mỹ Đình)
          → "lịch học HSK3 cơ sở Mỹ Đình"

        - "Có lớp nào sắp khai giảng?" (OFFLINE, TP.HCM)
          → "lịch khai giảng TP.HCM"
        
        Câu hỏi thiếu context khác - BỔ SUNG TỐI THIỂU:
        - "Học phí bao nhiêu?" (đang nói HSK4) → "HSK4 học phí"
        - "Học những gì?" (đang nói khóa giao tiếp) → "Khóa giao tiếp học gì"
        
        CHỈ TRẢ VỀ TỪ KHÓA, KHÔNG GIẢI THÍCH.
        """

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        return response.choices[0].message.content.strip()

    async def search_similar_documents(self, query: str, top_k: int) -> List[Dict]:
        """Tìm kiếm tài liệu tương tự sử dụng ChatGPT embedding"""
        try:
            # Tạo embedding cho query
            query_embedding = get_embedding_chatgpt(query)

            # numpy.ndarray -> list -> string (pgvector format)
            query_embedding = query_embedding.tolist()
            query_embedding = "[" + ",".join([str(x) for x in query_embedding]) + "]"

            sql = text("""
                SELECT id, chunk_text, search_vector <-> (:query_embedding)::vector AS similarity
                FROM document_chunks
                ORDER BY search_vector <-> (:query_embedding)::vector
                LIMIT :top_k
            """)

            result = await self.db_session.execute(
                sql, {"query_embedding": query_embedding, "top_k": top_k}
            )
            rows = result.fetchall()

            results = []
            for row in rows:
                results.append({
                    "content": row.chunk_text,
                    "similarity_score": float(row.similarity)
                })

            return results

        except Exception as e:
            raise Exception(f"Lỗi khi tìm kiếm: {str(e)}")

    async def get_field_configs(self):
        """Lấy cấu hình fields từ bảng field_config với Redis cache"""
        cache_key = "field_configs:required_optional"
        
        # Thử lấy từ cache trước
        cached_result = cache_get(cache_key)
        if cached_result is not None:
            return cached_result.get('required_fields', {}), cached_result.get('optional_fields', {})
        
        try:
            result = await self.db_session.execute(
                select(FieldConfig).order_by(FieldConfig.excel_column_letter)
            )
            field_configs = result.scalars().all()
            
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
                    
            return required_fields, optional_fields
        except Exception as e:
            print(f"Lỗi khi lấy field configs: {str(e)}")
            # Trả về dict rỗng nếu có lỗi
            return {}, {}
    
    async def get_customer_infor(self, chat_session_id: int) -> dict:
        try:
            # Lấy thông tin khách hàng từ bảng customer_info
            result = await self.db_session.execute(
                select(CustomerInfo).filter(CustomerInfo.chat_session_id == chat_session_id)
            )
            customer_info = result.scalar_one_or_none()
            
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
    async def generate_response(self, query: str, chat_session_id: int) -> str:
        try:
            # Ensure model is initialized
            if not self.is_initialized:
                await self.initialize()
            
            history = await self.get_latest_messages(chat_session_id=chat_session_id, limit=10)
            customer_info = await self.get_customer_infor(chat_session_id)
            
            if not query or query.strip() == "":
                return "Nội dung câu hỏi trống, vui lòng nhập lại."
            
            # Truyền customer_info vào build_search_key để tối ưu tìm kiếm
            search = await self.build_search_key(chat_session_id, query, customer_info)
            print(f"Search key: {search}")
            print("-----------------------------")
            
            # Lấy ngữ cảnh
            knowledge = await self.search_similar_documents(search, 10)
            print("KNOWLEDGE FOR ANSWERING:", knowledge)
            # Lấy cấu hình fields động
            required_fields, optional_fields = await self.get_field_configs()
            
            # Tạo danh sách thông tin cần thu thập
            required_info_list = "\n".join([f"- {field_name} (bắt buộc)" for field_name in required_fields.values()])
            optional_info_list = "\n".join([f"- {field_name} (tùy chọn)" for field_name in optional_fields.values()])
            
            prompt = f"""
                BẠN LÀ CHUYÊN VIÊN TƯ VẤN TẠI TRUNG TÂM TIẾNG TRUNG THANHMAIHSK
                
                === KIẾN THỨC CƠ SỞ ===
                {knowledge}

                === THÔNG TIN KHÁCH HÀNG ĐÃ CÓ ===
                {customer_info}

                === THÔNG TIN CẦN THU THẬP ===
                Bắt buộc: {required_info_list}
                Tùy chọn: {optional_info_list}

                === NGUYÊN TẮC QUAN TRỌNG NHẤT ===
                
                🚨 QUY TẮC SỐ 1 - ƯU TIÊN Ý ĐỊNH THỰC SỰ CỦA KHÁCH:
                - PHÂN TÍCH câu hỏi/tin nhắn của khách để HIỂU Ý ĐỊNH THỰC SỰ
                - Khách muốn biết ĐIỀU GÌ? → TRẢ LỜI ĐIỀU ĐÓ TRƯỚC
                - ĐỪNG cứng nhắc theo quy trình nếu khách đang hỏi điều khác
                - Sau khi TRẢ LỜI ĐẦY ĐỦ, mới cân nhắc tiếp tục quy trình
                
                🚨 QUY TẮC SỐ 2 - TUYỆT ĐỐI KHÔNG HỎI LẠI THÔNG TIN ĐÃ CÓ:
                - LUÔN KIỂM TRA "THÔNG TIN KHÁCH HÀNG ĐÃ CÓ" TRƯỚC KHI HỎI BẤT KỲ ĐIỀU GÌ
                - Nếu đã có Họ tên → KHÔNG HỎI LẠI họ tên
                - Nếu đã có SĐT → KHÔNG HỎI LẠI số điện thoại
                - Nếu đã có Email → KHÔNG HỎI LẠI email
                - Nếu đã có bất kỳ thông tin nào → KHÔNG HỎI LẠI thông tin đó
                - ĐẶC BIỆT: Khi tư vấn khóa thứ 2, thứ 3... CHỈ hỏi về khóa học, KHÔNG hỏi lại thông tin cá nhân
                - Hỏi lại thông tin đã có = GÂY KHÓ CHỊU CỰC KỲ CHO KHÁCH HÀNG
                
                ⚠️ QUY TẮC SỐ 3 - CHỈ TRẢ LỜI DỰA VÀO === KIẾN THỨC CƠ SỞ ===:
                - KHÔNG ĐƯỢC BỊA RA bất kỳ thông tin nào không có trong kiến thức cơ sở
                - CHỈ TƯ VẤN CÁC KHÓA HỌC có trong dữ liệu kiến thức cơ sở
                - Nếu không có thông tin trong kiến thức cơ sở: "Em cần tìm hiểu thêm về vấn đề này và sẽ phản hồi anh/chị sớm nhất ạ"
                - CHỈ ĐƯA RA GIÁ CỦA CÁC KHÓA HỌC được nêu rõ trong kiến thức cơ sở
                - Nếu khách hỏi về khóa học không có trong dữ liệu: "Hiện tại em cần kiểm tra lại chương trình này và sẽ tư vấn anh/chị sau ạ"

                === XỬ LÝ CÂU HỎI NGOÀI LỀ - ƯU TIÊN CAO NHẤT ===
                
                🚨 CỰC KỲ QUAN TRỌNG: KHÁCH HÀNG KHÔNG BẮT BUỘC PHẢI THEO QUY TRÌNH
                
                **TRIẾT LÝ XỬ LÝ - LINH HOẠT, KHÔNG CỨNG NHẮC:**
                - Quy trình 7 bước CHỈ LÀ THAM KHẢO, KHÔNG BẮT BUỘC
                - Khách hàng có quyền HỎI BẤT CỨ ĐIỀU GÌ, BẤT CỨ KHI NÀO
                - Công việc của bạn: TRẢ LỜI NHỮNG GÌ KHÁCH ĐANG QUAN TÂM
                - QUY TRÌNH phục vụ KHÁCH HÀNG, không phải KHÁCH HÀNG phục vụ quy trình
                
                **NGUYÊN TẮC XỬ LÝ CÂU HỎI NGOÀI LỀ:**
                1. PHÂN TÍCH: Khách ĐANG QUAN TÂM đến điều gì?
                2. TẬP TRUNG: Trả lời ĐIỀU KHÁCH ĐANG HỎI, không lạc đề
                3. TRẢ LỜI ĐẦY ĐỦ: Cung cấp MỌI thông tin liên quan từ KIẾN THỨC CƠ SỞ
                4. KHÔNG ÉP QUY TRÌNH: Đừng cố kéo về "bước tiếp theo" khi khách chưa hài lòng
                5. TỰ NHIÊN: Chỉ tiếp tục quy trình khi cuộc trò chuyện TỰ NHIÊN chuyển sang chủ đề khác

                **THÔNG TIN LIÊN HỆ:**
                📞 Tổng đài: 1900 633 018
                📱 Hotline Hà Nội: 0931.715.889  
                📱 Hotline TP.HCM: 0888 616 819
                🌐 Website: thanhmaihsk.edu.vn

                === BỐI CẢNH CUỘC TRÒ CHUYỆN ===
                Lịch sử: {history}
                
                Tin nhắn mới: {query}

                === HƯỚNG DẪN XỬ LÝ ===
                1. Phân tích lịch sử hội thoại để XÁC ĐỊNH ĐANG Ở BƯỚC NÀO trong quy trình 7 bước
                2. Kiểm tra xem đã có đủ thông tin cho bước hiện tại chưa
                3. Nếu thiếu thông tin: Thu thập thông tin còn thiếu
                4. Nếu đủ thông tin: Chuyển sang bước tiếp theo
                5. CHỈ TẬP TRUNG VÀO 1 BƯỚC tại 1 thời điểm
                6. KHÔNG nhảy bước hoặc trả lời vượt quá bước hiện tại
                7. Luôn đảm bảo quy trình logic: Bước 1 → Bước 2 → ... → Bước 7

                === TRẢ LỜI CỦA BẠN ===
               """
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(e)
            return f"Lỗi khi sinh câu trả lời: {str(e)}"

    async def extract_customer_info_realtime(self, chat_session_id: int, limit_messages: int):
        """Trích xuất thông tin khách hàng theo thời gian thực sử dụng OpenAI"""
        try:
            # Ensure model is initialized
            if not self.is_initialized:
                await self.initialize()
                
            history = await self.get_latest_messages(chat_session_id=chat_session_id, limit=limit_messages)
            
            # Lấy cấu hình fields động
            required_fields, optional_fields = await self.get_field_configs()
            all_fields = {**required_fields, **optional_fields}
            
            # Nếu không có field configs, trả về JSON rỗng
            if not all_fields:
                return json.dumps({})
            
            # Nếu không có lịch sử hội thoại, trả về JSON rỗng với các fields từ config
            if not history or history.strip() == "":
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
                
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
            )
            cleaned = re.sub(r"```json|```", "", response.choices[0].message.content).strip()
            
            return cleaned
            
        except Exception as e:
            print(f"Lỗi trích xuất thông tin: {str(e)}")
            return None
    
    @staticmethod
    def clear_field_configs_cache():
        """Xóa cache field configs khi có thay đổi cấu hình"""
        cache_key = "field_configs:required_optional"
        success = cache_delete(cache_key)
        print(f"DEBUG: {'Thành công' if success else 'Thất bại'} xóa cache field configs")
        return success
