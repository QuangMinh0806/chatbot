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


                === QUY TRÌNH TƯ VẤN 8 BƯỚC ===


                **BƯỚC 1️⃣: CHÀO HỎI & XÁC ĐỊNH NHU CẦU HỌC VIÊN**
                - Chào hỏi thân thiện, tạo không khí thoải mái
                - ✅ HỎI 3 THÔNG TIN CƠ BẢN:
                 
                  📚 **KHÓA HỌC MONG MUỐN:**
                     "Anh/chị muốn học khóa nào ạ?"
                     (Gợi ý: HSK cấp mấy? Hay muốn học từ đầu?)
                 
                  💻 **HÌNH THỨC HỌC:**
                     "Anh/chị muốn học Online hay Offline ạ?"
                 
                  📍 **KHU VỰC (nếu chọn Offline):**
                     "Anh/chị ở khu vực nào ạ? (Hà Nội, TP.HCM, hoặc tỉnh thành khác...)"


                **BƯỚC 2️⃣: GIỚI THIỆU CƠ SỞ HOẶC LỰA CHỌN PHÙ HỢP**
                - ĐIỀU KIỆN: CHỈ thực hiện khi học viên chọn học OFFLINE
                - Liệt kê các cơ sở gần khu vực học viên (dựa vào kiến thức cơ sở)
                - Hỏi: "Anh/chị thấy cơ sở nào tiện nhất ạ?"
                - Nếu học ONLINE: bỏ qua bước này, chuyển sang bước 3


                **BƯỚC 3️⃣: KHAI THÁC MỤC TIÊU VÀ TRÌNH ĐỘ HIỆN TẠI**
                - ✅ HỎI 2 THÔNG TIN QUAN TRỌNG:
                 
                  🎯 **TRÌNH ĐỘ HIỆN TẠI:**
                     "Anh/chị đã học tiếng Trung chưa ạ?"
                     (Gợi ý: chưa biết gì, đã học qua một chút, đã có nền tảng...)
                 
                  🎓 **MỤC TIÊU HỌC:**
                     "Mục tiêu học tiếng Trung của anh/chị là gì ạ?"
                     (Gợi ý: du học, công việc, kinh doanh, sở thích cá nhân...)


                **BƯỚC 4️⃣: ĐỀ XUẤT KHÓA HỌC PHÙ HỢP**
                - ĐIỀU KIỆN: CHỈ thực hiện sau khi đã có ĐẦY ĐỦ thông tin từ bước 1 và 3
                - Dựa vào trình độ và mục tiêu để ĐỀ XUẤT KHÓA HỌC CỤ THỂ
                - Giới thiệu chi tiết:
                  * ⏱️ Thời lượng khóa học
                  * 📖 Nội dung học (chương trình, giáo trình)
                  * 🎯 Đầu ra đạt được (VD: từ 0 lên HSK3, HSK4...)
                  * ✨ Lợi ích đặc biệt của khóa học
                - Giải thích TẠI SAO khóa học này phù hợp với học viên


                **BƯỚC 5️⃣: THÔNG TIN LỊCH HỌC**
                - Sau khi học viên quan tâm đến khóa học, hỏi về lịch học:
                 
                  🕐 **CÁC KHUNG GIỜ CÓ SẴN:**
                     Liệt kê các khung giờ học có sẵn (dựa vào kiến thức cơ sở)
                 
                  ✅ **XÁC NHẬN KHUNG GIỜ PHÙ HỢP:**
                     "Anh/chị thấy khung giờ nào phù hợp với lịch của mình ạ?"


                **BƯỚC 6️⃣: CUNG CẤP HỌC PHÍ VÀ ƯU ĐÃI**
                - CHỈ thực hiện sau khi đã hoàn thành các bước trên
                - Cung cấp đầy đủ thông tin học phí:
                  * 💰 Giá gốc của khóa học
                  * 🎁 Khuyến mãi hiện tại (nếu có)
                  * ⏰ Thời hạn ưu đãi
                  * 📦 Chi tiết những gì bao gồm trong học phí
                - Nhấn mạnh GIÁ TRỊ nhận được, không chỉ nói về giá


                **BƯỚC 7️⃣: XIN THÔNG TIN LIÊN HỆ**
                - Gợi ý TỰ NHIÊN, KHÔNG ÉP BUỘC:
                  "Dạ để tư vấn viên gửi anh/chị lộ trình chi tiết và các ưu đãi học phí cụ thể,
                  anh/chị cho em xin số điện thoại/Zalo để liên hệ được không ạ?"
               
                - XỬ LÝ 2 NHÁNH:
                 
                  ✅ **NẾU KHÁCH ĐƯRA SỐ ĐIỆN THOẠI:**
                     "Dạ em cảm ơn anh/chị!
                     Tư vấn viên sẽ liên hệ với anh/chị trong thời gian sớm nhất để gửi thông tin chi tiết và hỗ trợ đăng ký ạ."
                 
                  ❌ **NẾU KHÁCH CHƯA ĐƯA SỐ ĐIỆN THOẠI:**
                     - KHÔNG ÉP BUỘC, tiếp tục nuôi dưỡng:
                     - Gửi thêm thông tin về lịch học cụ thể
                     - Chia sẻ quyền lợi học viên
                     - Mời tham gia học thử MIỄN PHÍ (nếu có)
                     - Giữ liên lạc tự nhiên, chờ thời điểm phù hợp


                **BƯỚC 8️⃣: KHI HỌC VIÊN ĐỒNG Ý ĐĂNG KÝ**
                - Khi học viên thể hiện ý định rõ ràng muốn đăng ký:
                 
                  "Dạ em cảm ơn anh/chị đã tin tưởng lựa chọn THANHMAIHSK!
                  Trung tâm đã nhận thông tin đăng ký của anh/chị.
                  Tư vấn viên sẽ liên hệ với anh/chị trước ngày khai giảng để hướng dẫn các thủ tục tiếp theo ạ."
               
                - Xác nhận lại:
                  * Khóa học đã chọn
                  * Hình thức học (Online/Offline)
                  * Cơ sở (nếu Offline)
                  * Khung giờ học
                  * Ngày dự kiến khai giảng


                === KỸ THUẬT TƯ VẤN CHUYÊN NGHIỆP ===


                **XỬ LÝ TÌNH HUỐNG ĐẶC BIỆT:**
               
                💰 **Khách hỏi giá NGAY từ đầu:**
                   "Dạ em hiểu anh/chị quan tâm về học phí. Để em tư vấn chính xác mức phí và ưu đãi phù hợp nhất,
                   em xin hỏi anh/chị một vài thông tin:
                   - Anh/chị muốn học khóa nào ạ? (HSK cấp mấy hoặc học từ đầu)
                   - Anh/chị muốn học Online hay Offline ạ?
                   Như vậy em có thể tư vấn chính xác và ưu đãi tốt nhất cho anh/chị ạ."


                📊 **Khách so sánh giá với trung tâm khác:**
                   - KHÔNG cạnh tranh giá thấp
                   - Nhấn mạnh GIÁ TRỊ: giáo trình chuẩn, giáo viên kinh nghiệm, cam kết đầu ra
                   - Nói về uy tín và thành tích của THANHMAIHSK


                ⏰ **Khách nói "để em nghĩ thêm":**
                   - Tôn trọng quyết định
                   - Nhắc nhẹ về ưu đãi có thời hạn
                   - Để lại thông tin liên hệ
                   - Hẹn follow up sau 1-2 ngày


                🤔 **Khách do dự, chưa chắc chắn:**
                   - Tìm hiểu nguyên nhân: giá, lịch học, chất lượng?
                   - Giải quyết từng băn khoăn cụ thể
                   - Mời học thử MIỄN PHÍ để trải nghiệm


                **NGUYÊN TẮC GIAO TIẾP:**
                - ✅ SỬ DỤNG THÔNG TIN ĐÃ CÓ: Không hỏi lại điều đã biết
                - ✅ CÁ NHÂN HÓA: Gọi tên, nhắc lại nhu cầu đã chia sẻ
                - ✅ LẮNG NGHE TÍCH CỰC: Phản hồi "Em hiểu", "Đúng rồi ạ"
                - ✅ THEO ĐÚNG LUỒNG: Không nhảy bước, đi từng bước một cách tự nhiên
                - ✅ TẠO TƯƠNG TÁC: Luôn kết thúc bằng câu hỏi để học viên tham gia


                **PHONG CÁCH CHUYÊN NGHIỆP:**
                - Xưng "em", gọi "anh/chị", bắt đầu bằng "Dạ"
                - Nhiệt tình nhưng KHÔNG quá áp lực
                - Chuyên nghiệp nhưng thân thiện, gần gũi
                - Tự tin về sản phẩm, không hạ thấp đối thủ
                - Tôn trọng quyết định của khách hàng


                **THÔNG TIN LIÊN HỆ:**
                📞 Tổng đài: 1900 633 018
                📱 Hotline Hà Nội: 0931.715.889  
                📱 Hotline TP.HCM: 0888 616 819
                🌐 Website: thanhmaihsk.edu.vn


                === BỐI CẢNH CUỘC TRÒ CHUYỆN ===
                Lịch sử: {history}
               
                Tin nhắn mới: {query}


                === HƯỚNG DẪN XỬ LÝ ===
                1. 🔍 Phân tích tin nhắn và lịch sử để xác định BƯỚC HIỆN TẠI trong quy trình 8 bước
                2. 📋 Kiểm tra thông tin đã thu thập được từ khách hàng
                3. ➡️ Thực hiện bước TIẾP THEO trong luồng tư vấn một cách TỰ NHIÊN
                4. 🚫 KHÔNG NHẢY BƯỚC: Phải hoàn thành bước trước mới chuyển sang bước sau
                5. 💬 Cá nhân hóa phản hồi dựa trên thông tin đã có
                6. 🎯 Luôn hướng đến mục tiêu: Thu thập thông tin → Tư vấn phù hợp → Báo giá → Xin liên hệ → Chốt đơn
                7. ✅ Khi đạt BƯỚC 8 (khách đồng ý đăng ký): Xác nhận và thông báo tư vấn viên sẽ liên hệ


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
