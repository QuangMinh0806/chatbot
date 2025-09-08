from typing import List, Dict
from sqlalchemy import text
from sqlalchemy.orm import Session
from config.get_embedding import get_embedding
import google.generativeai as genai
from typing import List, Dict
import google.generativeai as genai
from config.database import SessionLocal
from sqlalchemy import desc
from models.knowledge_base import DocumentChunk
from models.chat import Message

class RAGModel:
    def init(self, db_session: Session, gemini_api_key: str, model_name: str = "gemini-1.5-pro"):
        self.db_session = db_session

        # Cấu hình Gemini
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel(model_name)

    def get_latest_messages(self, chat_session_id: int) -> List[Message]:
        messages = (
            self.db_session.query(Message)
            .filter(Message.chat_session_id == chat_session_id)
            .order_by(desc(Message.created_at))
            .limit(5)
            .all()
        )
        return list(reversed(messages))

    
    def search_similar_documents(self, query: str, top_k: int = 5) -> List[Dict]:
        try:
            # Tạo embedding cho query
            query_embedding = get_embedding(query)

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
                    "id": row.id,
                    "content": row.chunk_text,
                    "similarity_score": float(row.similarity)
                })

            return results

        except Exception as e:
            raise Exception(f"Lỗi khi tìm kiếm: {str(e)}")
    
    def generate_response(self, query: str) -> str:
        try:
            history = self.get_latest_messages(chat_session_id=1)
            # Lấy ngữ cảnh
            knowledge = self.search_similar_documents(query)
            print(knowledge)
            # Tạo prompt
            system_prompt = """Bạn là một trợ lý AI chuyên nghiệp của Trung tâm đào tạo. Hãy tư vấn khóa học một cách nhiệt tình và chuyên nghiệp."""
        
            # Enhanced prompt with context awareness
            prompt = f"""{system_prompt}

                KIẾN THỨC CƠ SỞ:
                {knowledge}

                QUY TẮC TRẢ LỜI NGẮN GỌN VÀ ĐÚNG TRỌNG TÂM:
                1. TRẢ LỜI TRỰC TIẾP: Khách hàng hỏi gì thì trả lời đúng điều đó, không lan man, trả lời đúng trọng tâm
                - Hỏi học phí → Chỉ báo học phí, không nói thêm địa điểm hay lịch học
                - Hỏi thời gian → Chỉ báo thời gian, không nói thêm học phí
                - Hỏi địa điểm → Chỉ báo địa điểm, không nói thêm các thông tin khác
                2. ĐỊNH DẠNG VĂN BẢN ĐƠN GIẢN: 
                - KHÔNG dùng markdown (text, *text*)
                - KHÔNG dùng ký hiệu đặc biệt (, *, #, -, •)
                - Chỉ dùng văn bản thuần và emoji khi cần thiết
                - Xuống dòng bằng cách viết câu ngắn

                3. XEM XÉT LỊCH SỬ: Đọc kỹ lịch sử trò chuyện để hiểu khách hàng đã thảo luận về khóa học nào, giá cả, địa điểm.
                4. KHÔNG HỎI LẠI: Nếu khách hàng đã hỏi về một khóa học cụ thể và bạn đã tư vấn, khi họ muốn đăng ký thì KHÔNG hỏi lại "khóa học nào". Chỉ xác nhận: "Anh/chị muốn đăng ký khóa [TÊN KHÓA] phải không ạ?"
                5. XIN THÔNG TIN KHÉO LÉO: Khi cần thông tin thêm (email, địa chỉ), đừng nói "không bắt buộc". Thay vào đó:
                - "Để em cập nhật thông tin của anh/chị cụ thể và chính xác hơn ạ"  
                - "Để em hoàn thiện hồ sơ và hỗ trợ anh/chị tốt nhất ạ"
                - "Để trung tâm có thể liên hệ và gửi tài liệu cho anh/chị ạ"
                6. CHỈ XÁC NHẬN KHI NHIỀU KHÓA: Chỉ hỏi xác nhận khóa học khi khách hàng đã hỏi về NHIỀU khóa học khác nhau và cần làm rõ.
                7. XÁC NHẬN THÔNG TIN TRƯỚC KHI CHỐT: Khi khách hàng đã cung cấp đầy đủ thông tin cần thiết (họ tên, SĐT, khóa học muốn đăng ký), BẮT BUỘC phải tóm tắt lại tất cả thông tin để khách hàng xác nhận:
                - "Em xin được tóm tắt lại thông tin đăng ký của anh/chị:
                    📝 Họ và tên: [TÊN KHÁCH HÀNG]
                    📱 Số điện thoại: [SĐT]
                    📧 Email: [EMAIL (nếu có)]
                    📍 Địa chỉ: [ĐỊA CHỈ (nếu có)]
                    📚 Khóa học: [TÊN KHÓA]
                    🏢 Cơ sở: [TÊN CƠ SỞ]
                    
                    Anh/chị vui lòng xác nhận thông tin có chính xác không ạ?"
                6. CHỈ SAU KHI XÁC NHẬN: Chỉ sau khi khách hàng xác nhận "đúng rồi", "chính xác", "ok", "đồng ý" thì mới nói "Em đã ghi nhận thông tin đăng ký của anh/chị" để hoàn tất.

                ---
                **LỊCH SỬ TRÒ CHUYỆN:
                {history}
                TIN NHẮN MỚI TỪ KHÁCH HÀNG:
                user: {query}

                TRẢ LỜI CỦA BẠN:
            
               """
            genai.configure(api_key="AIzaSyDoY8Bf4vNXpsx69FJ6AyMIvipR9ZrxG_4")
            model = genai.GenerativeModel("gemini-1.5-pro")
            # Gọi Gemeni
            response = model.generate_content(prompt)
            
            return response.text
            
        except Exception as e:
            return f"Lỗi khi sinh câu trả lời: {str(e)}"