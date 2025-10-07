import json
import os
import re
from typing import List, Dict
from sqlalchemy import text
from sqlalchemy.orm import Session
from config.get_embedding import get_embedding_gemini
import google.generativeai as genai
from typing import List, Dict
from config.database import SessionLocal
from sqlalchemy import desc
from models.llm import LLM
from models.chat import Message
from dotenv import load_dotenv
from models.chat import ChatSession, CustomerInfo
from models.field_config import FieldConfig
from config.redis_cache import cache_get, cache_set, cache_delete
# Load biến môi trường
load_dotenv()
class RAGModel:
    def __init__(self, model_name: str = "gemini-2.0-flash-001", db_session: Session = None):
        
        # Sử dụng db_session từ parameter nếu có, không thì tạo mới
        if db_session:
            self.db_session = db_session
            self.should_close_db = False  # Không đóng db vì không phải tự tạo
        else:
            self.db_session = SessionLocal()
            self.should_close_db = True  # Đóng db vì tự tạo
        
        llm = self.db_session.query(LLM).filter(LLM.id == 1).first()
        print(llm)
        # Cấu hình Gemini
        genai.configure(api_key=llm.key)
        self.model = genai.GenerativeModel(model_name)
    def get_latest_messages(self, chat_session_id: int, limit: int): 
        print(f"DEBUG: Querying messages for chat_session_id={chat_session_id}, limit={limit}")
        
        messages = (
            self.db_session.query(Message)
            .filter(Message.chat_session_id == chat_session_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
            .all() 
        )
        
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

        # return results
        conversation = []
        for msg in results:
            line = f"{msg['sender_type']}: {msg['content']}"
            conversation.append(line)
        
        conversation_text = "\n".join(conversation)
        print(f"DEBUG: Final conversation text: '{conversation_text}'")
        
        # Không đóng db_session nữa vì được quản lý từ bên ngoài
        return conversation_text
    
    
    
    def build_search_key(self, chat_session_id, question):
        history = self.get_latest_messages(chat_session_id=chat_session_id, limit=5)
        prompt = f"""
        Hội thoại trước đó:
        {history}

        Câu hỏi hiện tại:
        {question}

        Hãy trích ra từ khóa tìm kiếm ngắn gọn (dưới 15 từ) phản ánh ý định chính của người dùng.
        """
        response = self.model.generate_content(prompt)
        
        return response.text

    def search_similar_documents(self, query: str, top_k: int ) -> List[Dict]:
        try:
            # Tạo embedding cho query1
            query_embedding = get_embedding_gemini(query)

            # numpy.ndarray -> list -> string (pgvector format)
            query_embedding = query_embedding.tolist()
            query_embedding = "[" + ",".join([str(x) for x in query_embedding]) + "]"

            sql = text("""
                SELECT id, chunk_text, search_vector <-> (:query_embedding)::vector AS similarity
                FROM document_chunks
                ORDER BY search_vector <-> (:query_embedding)::vector
                LIMIT :top_k
            """)

            rows = self.db_session.execute(
                sql, {"query_embedding": query_embedding, "top_k": top_k}
            ).fetchall()

            results = []
            for row in rows:
                results.append({
                    "content": row.chunk_text,
                    "similarity_score": float(row.similarity)
                })

            return results

        except Exception as e:
            raise Exception(f"Lỗi khi tìm kiếm: {str(e)}")
    
    
    def get_field_configs(self):
        """Lấy cấu hình fields từ bảng field_config với Redis cache"""
        cache_key = "field_configs:required_optional"
        
        # Thử lấy từ cache trước
        cached_result = cache_get(cache_key)
        if cached_result is not None:
            print("DEBUG: Lấy field configs từ cache")
            return cached_result.get('required_fields', {}), cached_result.get('optional_fields', {})
        
        try:
            print("DEBUG: Lấy field configs từ database")
            field_configs = self.db_session.query(FieldConfig).order_by(FieldConfig.excel_column_letter).all()
            
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
        try:
            # Lấy thông tin khách hàng từ bảng customer_info
            customer_info = self.db_session.query(CustomerInfo).filter(
                CustomerInfo.chat_session_id == chat_session_id
            ).first()
            
            
            if customer_info and customer_info.customer_data:
                # Không đóng db_session nữa vì được quản lý từ bên ngoài
                # Nếu customer_data là string JSON, parse nó
                if isinstance(customer_info.customer_data, str):
                    return json.loads(customer_info.customer_data)
                # Nếu đã là dict thì return trực tiếp
                return customer_info.customer_data
            return {}
        except Exception as e:
            print(f"Lỗi khi lấy thông tin khách hàng: {str(e)}")
            return {}
    
    def generate_response(self, query: str, chat_session_id: int) -> str:
        try:
            history = self.get_latest_messages(chat_session_id=chat_session_id, limit=10)
            customer_info = self.get_customer_infor(chat_session_id)
            
            if not query or query.strip() == "":
                return "Nội dung câu hỏi trống, vui lòng nhập lại."
            
            search = self.build_search_key(chat_session_id, query)
            print(f"Search: {search}")
            
            # Lấy ngữ cảnh
            knowledge = self.search_similar_documents(search, 10)
            
            # Lấy cấu hình fields động
            required_fields, optional_fields = self.get_field_configs()
            
        
            
            # Tạo danh sách thông tin cần thu thập
            required_info_list = "\n".join([f"- {field_name} (bắt buộc)" for field_name in required_fields.values()])
            optional_info_list = "\n".join([f"- {field_name} (tùy chọn)" for field_name in optional_fields.values()])
            
            
            prompt = f"""
                    Bạn là một trợ lý ảo bán hàng chuyên nghiệp của thương hiệu thời trang Hason Fashion.
                    Nhiệm vụ của bạn là tư vấn, hỗ trợ, và chốt đơn hàng theo quy trình và quy tắc dưới đây, sử dụng toàn bộ thông tin tra cứu từ bảng [KIẾN THỨC CƠ SỞ] (Google Sheet).

                    1. Giai đoạn 1: Tư vấn thông tin
                    Luôn bắt đầu ở giai đoạn này.

                    Câu trả lời chỉ dựa theo thông tin có trong bảng Kiến Thức Cơ Sở — tuyệt đối không bịa hoặc thêm thông tin không có thật.

                    Khi khách hỏi chi tiết, tra cứu các cột tương ứng:

                    Giá → Giới thiệu cột “Giá bán”.

                    Tình trạng (còn hàng, hết hàng) → Tra cột “Tình trạng”.

                    Size còn hàng → Tra cột “Size”.

                    Màu sản phẩm → Tra cột “Màu”.

                    Hình ảnh → Gửi link từ cột “Hình ảnh”.

                    Mô tả và chất liệu → Tra cột “Mô tả sản phẩm” và “Chất liệu”.

                    Nếu không tìm thấy thông tin, hãy nói: “Để em kiểm tra lại thông tin này và phản hồi lại cho mình sau ạ.”

                    Nếu khách hỏi ngoài phạm vi Kiến Thức Cơ Sở (ví dụ chương trình khuyến mãi, sự kiện...), hãy trả lời: “Hiện tại em chưa nắm được thông tin này, em sẽ cập nhật và phản hồi lại cho mình sớm nhất ạ.” Sau đó đặt câu hỏi gợi mở để tìm hiểu nhu cầu của khách hàng (ví dụ: “Anh/chị đang tìm mẫu nào hoặc sản phẩm cho dịp gì ạ?”).

                    Nếu khách cần tư vấn chuyên sâu hoặc muốn được gọi lại, hãy hẹn trong vòng 24h sẽ có nhân viên Hason Fashion liên hệ. Khi đó, hãy xin tên và số điện thoại để cửa hàng hỗ trợ.

                    2. Quy tắc tư vấn thông minh
                    Không hỏi lại sản phẩm đã xác định: Nếu trước đó khách hàng đã nói rõ sản phẩm, khi họ muốn đặt mua chỉ cần xác nhận lại: “Anh/chị muốn đặt sản phẩm [TÊN SẢN PHẨM] phải không ạ?”.

                    Xin thông tin khéo léo:

                    “Để em cập nhật thông tin của anh/chị cụ thể và chính xác hơn ạ.”

                    “Để em hoàn thiện đơn hàng và hỗ trợ anh/chị tốt nhất ạ.”

                    “Để cửa hàng có thể xác nhận và gửi hàng cho anh/chị nhanh nhất ạ.”

                    Nếu khách hỏi nhiều sản phẩm: Hãy xác nhận lại đúng sản phẩm họ muốn chốt.

                    3. Giai đoạn 2: Chốt đơn
                    Chỉ chuyển sang giai đoạn này khi khách hàng thể hiện mong muốn mua hàng rõ ràng (“Mình muốn đặt”, “Cho mình mua cái này”, “Đặt giúp mình nha”).

                    Khi vào giai đoạn chốt, yêu cầu các thông tin sau theo thứ tự ưu tiên:

                    Họ tên (bắt buộc)

                    Số điện thoại (bắt buộc)

                    Địa chỉ nhận hàng (bổ sung)

                    Tên sản phẩm (tự động lấy theo Kiến Thức Cơ Sở)

                    Size

                    Màu

                    Link hình ảnh (đính kèm từ bảng)

                    Phương thức thanh toán (nếu khách chủ động hỏi)

                    Nếu các thông tin bắt buộc đã có trong lịch sử chat, không hỏi lại, chỉ xác nhận.

                    Nếu khách ở Đà Nẵng hoặc gần đó, gợi ý ghé cửa hàng Hason Fashion để thử trực tiếp: “Nếu anh/chị ở Đà Nẵng, có thể ghé qua cửa hàng Hason Fashion tại 01 Đỗ Đăng Tuyển để thử sản phẩm trực tiếp ạ.”

                    4. Xác nhận thông tin trước khi chốt
                    Khi khách hàng đã cung cấp đầy đủ thông tin, bắt buộc tóm tắt lại để xác nhận:

                    “Em xin được tóm tắt lại đơn hàng của anh/chị:
                    📝 Họ tên: [Họ tên]
                    📱 Số điện thoại: [SĐT]
                    📦 Sản phẩm: [Tên sản phẩm]
                    📏 Size: [Size]
                    🎨 Màu sắc: [Màu]
                    🔗 Link sản phẩm: [Hình ảnh]
                    🏠 Địa chỉ nhận hàng: [Địa chỉ]
                    💵 Phương thức thanh toán: [COD/Chuyển khoản (nếu có)]

                    Anh/chị vui lòng xác nhận giúp em xem thông tin trên đã chính xác chưa ạ?”

                    Chỉ khi khách xác nhận “đúng rồi”, “ok”, “chuẩn rồi” thì mới nói:
                    “Em đã ghi nhận đơn hàng của anh/chị. Hason Fashion sẽ liên hệ xác nhận và giao hàng sớm nhất ạ.”

                    5. Quy tắc xưng hô
                    Luôn gọi khách hàng là “anh/chị”, xưng “em”.

                    Sau khi khách cung cấp tên, gọi tên khách trong câu trả lời tiếp theo (ví dụ: “Dạ, em cảm ơn chị Linh ạ”).

                    Tuyệt đối không dùng “em” và “bạn” trong cùng câu.

                    6. Phong cách giao tiếp
                    Luôn mở đầu bằng “Dạ”, “Dạ vâng”.

                    Chỉ thêm cảm thán (ạ, dạ, vâng) ở cuối toàn câu trả lời, không chèn giữa các câu ngắn.

                    Giọng văn chuyên nghiệp, thân thiện, nhiệt tình.

                    Ví dụ đúng:
                    Dạ, sản phẩm Váy Linen dáng A hiện có giá 690.000đ.
                    Mẫu này còn size S và M, màu trắng và be ạ.

                    Ví dụ sai:
                    Dạ, sản phẩm Váy Linen dáng A hiện có giá 690.000đ ạ. Hiện còn size S và M ạ. Có màu trắng và be ạ.

                    7. Quy tắc trả lời đúng trọng tâm
                    Khách hỏi giá → chỉ trả lời giá.

                    Hỏi size → chỉ trả lời size còn hàng.

                    Hỏi màu → chỉ trả lời màu có trong bảng.

                    Hỏi hình ảnh → chỉ gửi link hình.

                    Hỏi chất liệu/mô tả → chỉ đọc nội dung hai cột đó.

                    Chỉ mở rộng thông tin khi khách yêu cầu thêm.

                    8. Quy tắc định dạng (bắt buộc)
                    Chỉ trả lời bằng văn bản thuần túy (plain text), không dùng markdown hoặc ký hiệu đặc biệt.

                    Chỉ xuống dòng khi thực sự cần (thường sau mỗi câu).

                    Ví dụ đúng:
                    Dạ, sản phẩm Áo sơ mi lụa cổ nơ có giá 550.000đ.
                    Mẫu này còn size S, M, L và màu trắng, xanh navy, be ạ.

                    9. Thông tin thương hiệu
                    🏷️ Thương hiệu: Hason Fashion
                    🏠 Địa chỉ: 01 Đỗ Đăng Tuyển, Đà Nẵng
                    📞 Hotline: 0236.3.507.507
                    ⏰ Giờ mở cửa: 8h00 - 21h00 hàng ngày
                    🌐 Website: chatbotai.hasontech.com
               """

            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            print(e)
            return f"Lỗi khi sinh câu trả lời: {str(e)}"
    
    
    

    def extract_customer_info_realtime(self, chat_session_id: int, limit_messages: int):
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
                
            response = self.model.generate_content(prompt)
            cleaned = re.sub(r"```json|```", "", response.text).strip()
            
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
