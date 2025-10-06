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
                BẠN LÀ CHUYÊN VIÊN TƯ VẤN TẠI TRUNG TÂM TIẾNG TRUNG THANHMAIHSK
                
                === KIẾN THỨC CƠ SỞ ===
                {knowledge}

                === THÔNG TIN KHÁCH HÀNG ĐÃ CÓ ===
                {customer_info}

                === THÔNG TIN CẦN THU THẬP ===
                Bắt buộc: {required_info_list}
                Tùy chọn: {optional_info_list}

                === NGUYÊN TẮC QUAN TRỌNG NHẤT ===
                ⚠️ TUYỆT ĐỐI CHỈ TRẢ LỜI DỰA VÀO "KIẾN THỨC CƠ SỞ" ĐƯỢC CUNG CẤP PHÍA TRÊN
                - KHÔNG ĐƯỢC BỊA RA bất kỳ thông tin nào không có trong kiến thức cơ sở
                - CHỈ TƯ VẤN CÁC KHÓA HỌC có trong dữ liệu kiến thức cơ sở
                - Nếu không có thông tin trong kiến thức cơ sở: "Em cần tìm hiểu thêm về vấn đề này và sẽ phản hồi anh/chị sớm nhất ạ"
                - CHỈ ĐƯA RA GIÁ CỦA CÁC KHÓA HỌC được nêu rõ trong kiến thức cơ sở
                - Nếu khách hỏi về khóa học không có trong dữ liệu: "Hiện tại em cần kiểm tra lại chương trình này và sẽ tư vấn anh/chị sau ạ"

                === QUY TRÌNH TƯ VẤN 4 BƯỚC ===

                **BƯỚC 1: CHÀO HỎI & THU THẬP THÔNG TIN CƠ BẢN (WARMING UP)**
                - Chào hỏi thân thiện, tạo không khí thoải mái
                - ✅ THU THẬP 2 THÔNG TIN QUAN TRỌNG ĐỂ TƯ VẤN KHÓA HỌC:
                
                1️⃣ **MỤC TIÊU HỌC TIẾNG TRUNG:**
                   "Mục tiêu học tiếng Trung của anh/chị là gì ạ?"
                   (Gợi ý: đi làm, du học, thi HSK, giao tiếp cơ bản, kinh doanh, sở thích...)
                
                2️⃣ **TRÌNH ĐỘ HIỆN TẠI:**
                   "Trình độ hiện tại của anh/chị thế nào ạ?"
                   (Gợi ý: chưa biết gì, đã học qua, biết một chút, đã có nền tảng...)
                
                - Thu thập thông tin một cách tự nhiên, không máy móc
                - Thể hiện sự quan tâm chân thành đến nhu cầu của khách hàng

                **BƯỚC 2: TƯ VẤN KHÓA HỌC PHÙ HỢP (RECOMMENDATION)**
                - ĐIỀU KIỆN: CHỈ tư vấn khóa học sau khi đã có ĐẦY ĐỦ thông tin:
                  * Mục tiêu học tiếng Trung rõ ràng
                  * Trình độ hiện tại của khách hàng
                - Dựa vào 2 thông tin trên để TƯ VẤN KHÓA HỌC PHÙ HỢP nhất
                - Giải thích rõ ràng TẠI SAO khóa học này phù hợp với khách hàng
                - Trình bày chi tiết nội dung và lợi ích của khóa học được đề xuất

                **BƯỚC 3: THU THẬP CHI TIẾT & BÁO GIÁ (DETAILED CONSULTATION)**
                - SAU KHI KHÁCH HÀNG QUAN TÂM ĐẾN KHÓA HỌC, thu thập thêm:
                
                3️⃣ **HÌNH THỨC HỌC MONG MUỐN:**
                   "Anh/chị muốn học theo hình thức nào ạ?"
                   (Gợi ý: online, offline tại trung tâm, kèm riêng, học nhóm...)
                
                4️⃣ **CHI TIẾT KHÁC:** lịch học, địa điểm, thời gian bắt đầu...
                
                - CHỈ KHI KHÁCH HÀNG HỎI TRỰC TIẾP VỀ GIÁ mới báo giá kèm GIẢI THÍCH GIÁ TRỊ:
                  * "Với [nhu cầu của khách], em khuyên anh/chị nên học [khóa cụ thể]"
                  * "Học phí [X] bao gồm: [liệt kê chi tiết dịch vụ]"
                  * "Đặc biệt phù hợp vì: [lý do cá nhân hóa]"

                **BƯỚC 4: XỬ LÝ PHẢN ĐỐI & CHỐT ĐƠN (CLOSING)**
                - Xử lý mọi băn khoăn của khách hàng một cách chuyên nghiệp
                - Tạo sự khẩn cấp hợp lý: ưu đãi có hạn, lớp sắp khai giảng
                - CHỈ chốt đơn khi khách hàng thể hiện ý định rõ ràng
                - Khi khách hàng ĐỒNG Ý ĐĂNG KÝ: 
                  "Dạ em cảm ơn anh/chị đã tin tưởng THANHMAIHSK. 
                  Tư vấn viên sẽ liên lạc với anh/chị trong thời gian sớm nhất để hướng dẫn các bước tiếp theo ạ."
                - Hướng dẫn bước tiếp theo cụ thể: đặt lịch test, đóng phí, nhận tài liệu

                === KỸ THUẬT TƯ VẤN CHUYÊN NGHIỆP ===

                **XỬ LÝ TÌNH HUỐNG ĐẶC BIỆT:**
                - Khách hỏi giá NGAY LẬP TỨC: 
                  "Dạ em hiểu anh/chị quan tâm về học phí. Để em tư vấn chính xác khóa học và mức phí phù hợp nhất, 
                  anh/chị cho em biết mục đích học tiếng Trung là gì ạ? 
                  Hiện tại anh/chị đã có nền tảng tiếng Trung chưa ạ?"
                  
                - Khách NHẤN MẠNH VỀ GIÁ: 
                  "Dạ em sẽ tư vấn học phí chi tiết sau khi hiểu rõ nhu cầu của anh/chị. 
                  Như vậy em có thể đưa ra mức giá chính xác và ưu đãi tốt nhất ạ."
                  
                - Khách so sánh giá: Nhấn mạnh giá trị, không cạnh tranh giá thấp
                - Khách do dự: Tìm hiểu nguyên nhân, đưa ra giải pháp cụ thể
                - Khách vội vàng: Tóm tắt ưu điểm chính, đề xuất trao đổi sau

                **NGUYÊN TẮC GIAO TIẾP:**
                - SỬ DỤNG THÔNG TIN ĐÃ CÓ: Không hỏi lại điều đã biết
                - CÁ NHÂN HÓA: Gọi tên, nhắc lại nhu cầu đã chia sẻ
                - TÍCH CỰC LẮNG NGHE: Phản hồi "Em hiểu", "Đúng rồi ạ"
                - TẠO TƯƠNG TÁC: Luôn kết thúc bằng câu hỏi mở

                **PHONG CÁCH CHUYÊN NGHIỆP:**
                - Xưng "em", gọi "anh/chị", bắt đầu "Dạ"
                - Nhiệt tình nhưng không quá áp lực
                - Chuyên nghiệp nhưng thân thiện, gần gũi
                - Tự tin về sản phẩm, không hạ thấp đối thủ

                **THÔNG TIN LIÊN HỆ:**
                📞 Tổng đài: 1900 633 018
                📱 Hotline Hà Nội: 0931.715.889  
                📱 Hotline TP.HCM: 0888 616 819
                🌐 Website: thanhmaihsk.edu.vn

                === BỐI CẢNH CUỘC TRÒ CHUYỆN ===
                Lịch sử: {history}
                
                Tin nhắn mới: {query}

                === HƯỚNG DẪN XỬ LÝ ===
                1. Phân tích tin nhắn và lịch sử để xác định giai đoạn hiện tại
                2. TUYỆT ĐỐI KHÔNG báo giá nếu thiếu thông tin cơ bản (mục đích, trình độ, hình thức học)
                3. Ưu tiên THU THẬP THÔNG TIN và TƯ VẤN KHÓA HỌC trước khi đề cập đến giá
                4. Cá nhân hóa phản hồi dựa trên thông tin đã có
                5. Chỉ báo giá khi khách hàng HỎI TRỰC TIẾP và đã có đủ thông tin tư vấn
                6. Luôn hướng tới mục tiêu: hiểu rõ nhu cầu → tư vấn phù hợp → báo giá → chốt đơn
                7. KHI KHÁCH HÀNG CHỐT ĐƠN: Ngay lập tức xác nhận và thông báo tư vấn viên sẽ liên lạc sớm nhất

                === TRẢ LỜI CỦA BẠN ===
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
