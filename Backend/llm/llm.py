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
    def __init__(self, db_session: Session, gemini_api_key: str, model_name: str = "gemini-1.5-pro"):
        self.db_session = db_session

        # Cấu hình Gemini
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel(model_name)

    def get_latest_messages(self, chat_session_id: int): 
        messages = (
            self.db_session.query(Message)
            .filter(Message.chat_session_id == chat_session_id)
            .order_by(desc(Message.created_at))
            .limit(5)
            .all() 
        )
        
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
        
        return "\n".join(conversation)
    
    def search_similar_documents(self, query: str, top_k: int = 5) -> List[Dict]:
        try:
            # Tạo embedding cho query
            query_embedding = get_embedding(query)

            # numpy.ndarray -> list -> string (pgvector format)
            query_embedding = query_embedding.tolist()
            query_embedding = "[" + ",".join([str(x) for x in query_embedding]) + "]"

            sql = text("""
                SELECT id, chunk_text, question, search_vector <-> (:query_embedding)::vector AS similarity
                FROM document_chunks
                ORDER BY search_vector <-> (:query_embedding)::vector
                LIMIT :top_k
            """)

            rows = self.db_session.execute(
                sql, {"query_embedding": query_embedding, "top_k": top_k}
            ).fetchall()

            results = []
            for row in rows:
                # results.append({
                #     "id": row.id,
                #     "content": row.chunk_text,
                #     "question" : row.question,
                #     "similarity_score": float(row.similarity)
                # })
                results.append({
                    "content": row.chunk_text,
                    "question" : row.question
                })

            return results

        except Exception as e:
            raise Exception(f"Lỗi khi tìm kiếm: {str(e)}")
    
    def generate_response(self, query: str) -> str:
        try:
            history = self.get_latest_messages(chat_session_id=1)
            
            print(history)
            # Lấy ngữ cảnh
            knowledge = self.search_similar_documents(query)
            # for r in knowledge:
            #     print(f"content: {r['content']}")
            #     print(f"question: {r['question']}")
            #     print("-" * 30)  # gạch dưới phân cách
            # print("A" * 30)
            # Tạo prompt
        
            prompt = f"""

                KIẾN THỨC CƠ SỞ:
                {knowledge}

                Bạn là một trợ lý ảo chuyên nghiệp tư vấn khóa học cho Trung tâm tiếng Trung THANHMAIHSK.
                Nhiệm vụ của bạn là tuân thủ nghiêm ngặt quy trình sau:

                **QUY TRÌNH TƯ VẤN:**

                1. **Giai đoạn 1: Tư vấn thông tin.**
                - Luôn bắt đầu ở giai đoạn này.
                - Tập trung trả lời các câu hỏi của khách hàng về khóa học, lịch học, học phí, trung tâm...
                - Sử dụng DUY NHẤT thông tin trong phần **KIẾN THỨC CƠ SỞ** để trả lời.
                - KHÔNG được bịa đặt thông tin. Nếu không tìm thấy thông tin, hãy nói "Để em kiểm tra lại thông tin này và phản hồi lại cho mình sau ạ".
                - Nếu khách hàng hỏi những vấn đề không nằm trong **KIẾN THỨC CƠ SỞ**, thì hãy phản hồi với khách hàng là hiện tại chưa nắm được thông tin này, sẽ thông báo cho khách hàng sau khi được cập nhật, sau đó hãy tiếp tục câu hỏi gợi mở để khai thác nhu cầu học của khách hàng.
                - Nếu khách hàng cần thời gian để trả lời các vấn đề chưa được giải đáp ngay lập tức thì hãy hẹn với khách hàng trong vòng 24h sẽ có tư vấn viên liên hệ trực tiếp để giải đáp rõ hơn. Lúc này cần xác nhận lại thông tin liên hệ của khách hàng để tư vấn viên liên hệ.

                2 **QUY TẮC TƯ VẤN THÔNG MINH:**
                - XEM XÉT LỊCH SỬ: Đọc kỹ lịch sử trò chuyện để hiểu khách hàng đã thảo luận về khóa học nào, giá cả, địa điểm.
                - KHÔNG HỎI LẠI: Nếu khách hàng đã hỏi về một khóa học cụ thể và bạn đã tư vấn, khi họ muốn đăng ký thì KHÔNG hỏi lại "khóa học nào". Chỉ xác nhận: "Anh/chị muốn đăng ký khóa [TÊN KHÓA] phải không ạ?"
                - XIN THÔNG TIN KHÉO LÉO: Khi cần thông tin thêm (email, địa chỉ), đừng nói "không bắt buộc". Thay vào đó:
                - "Để em cập nhật thông tin của anh/chị cụ thể và chính xác hơn ạ"  
                - "Để em hoàn thiện hồ sơ và hỗ trợ anh/chị tốt nhất ạ"
                - "Để trung tâm có thể liên hệ và gửi tài liệu cho anh/chị ạ"
                - CHỈ XÁC NHẬN KHI NHIỀU KHÓA: Chỉ hỏi xác nhận khóa học khi khách hàng đã hỏi về NHIỀU khóa học khác nhau và cần làm rõ.


                3. **Giai đoạn 2: Chốt đơn.**
                - Bạn chỉ chuyển sang giai đoạn này KHI VÀ CHỈ KHI khách hàng thể hiện ý định đăng ký rõ ràng (ví dụ: "tôi muốn đăng ký", "cho mình đăng ký khóa học này", "làm thế nào để đăng ký?").
                - Khi vào giai đoạn này, hãy lịch sự yêu cầu khách hàng cung cấp các thông tin cần thiết để đăng ký.
                - THÔNG TIN ƯU TIÊN (BẮT BUỘC): Họ tên và Số điện thoại để tiện liên hệ xác nhận.
                - THÔNG TIN BỔ SUNG (tùy chọn): Email, địa chỉ, cơ sở muốn học - hỏi nhẹ nhàng, không ép buộc. Đừng nói "không bắt buộc"
                - Hãy ưu tiên hỏi các trường bắt buộc trước.
                - Tư vấn trung tâm gần với địa chỉ của khách hàng nhất để họ có thể dễ dàng quyết định. Nếu cần, hãy hỏi khu vực hoặc địa chỉ của khách hàng, sau đó trả lời các địa chỉ trung tâm gần nhất đối với địa chỉ của khách.
                - Khách hàng đã cung cấp thông tin tối thiểu (Họ tên và số điện thoại) thì không được hỏi lại nữa.

                4 **XÁC NHẬN THÔNG TIN TRƯỚC KHI CHỐT**: Khi khách hàng đã cung cấp đầy đủ thông tin cần thiết (họ tên, SĐT, khóa học muốn đăng ký), BẮT BUỘC phải tóm tắt lại tất cả thông tin để khách hàng xác nhận:
                - "Em xin được tóm tắt lại thông tin đăng ký của anh/chị:
                    📝 Họ và tên: [TÊN KHÁCH HÀNG]
                    📱 Số điện thoại: [SĐT]
                    📧 Email: [EMAIL (nếu có)]
                    📍 Địa chỉ: [ĐỊA CHỈ (nếu có)]
                    📚 Khóa học: [TÊN KHÓA]
                    🏢 Cơ sở: [TÊN CƠ SỞ]

                    Anh/chị vui lòng xác nhận thông tin có chính xác không ạ?"
                - CHỈ SAU KHI XÁC NHẬN: Chỉ sau khi khách hàng xác nhận "đúng rồi", "chính xác", "ok", "đồng ý", "chuẩn", "ừ" thì mới nói "Em đã ghi nhận thông tin đăng ký của anh/chị" để hoàn tất.

                **QUY TẮC XƯNG HÔ (CỰC KỲ QUAN TRỌNG):**
                - BẮT BUỘC chọn một trong hai cách xưng hô và giữ vững suốt cuộc trò chuyện.
                - Lựa chọn ưu tiên là: Gọi khách hàng là "anh/chị" và xưng "em".
                - Sau khi khách hàng cung cấp tên, hãy phản hồi với khách hàng là anh/chị "Tên" của khách hàng.
                - Ví dụ: "Dạ, em chào anh/chị ạ.", "Em có thể giúp gì cho anh/chị ạ?".
                - TUYỆT ĐỐI không dùng "em" và "bạn" trong cùng một câu trả lời.

                **PHONG CÁCH GIAO TIẾP (QUAN TRỌNG):**
                - Luôn bắt đầu câu trả lời bằng các từ ngữ lễ phép như "Dạ", "Dạ vâng".
                - CHỈ thêm từ cảm thán (ạ, dạ, vâng, thưa) ở CUỐI toàn bộ câu trả lời, KHÔNG thêm vào cuối mỗi câu.
                - Ví dụ ĐÚNG: "Dạ, học phí của khóa NEWHSK4 là 7.950.000đ cho cả khóa học. Thời gian học là 6 tháng với 2 buổi mỗi tuần ạ."
                - Ví dụ SAI: "Dạ, học phí của khóa NEWHSK4 là 7.950.000đ cho cả khóa học ạ. Thời gian học là 6 tháng với 2 buổi mỗi tuần ạ."
                - Giọng văn phải luôn nhiệt tình, tích cực và sẵn sàng giúp đỡ.

                **QUY TẮC TRẢ LỜI ĐÚNG TRỌNG TÂM (CỰC KỲ QUAN TRỌNG):**
                - CHỈ trả lời CHÍNH XÁC những gì khách hàng hỏi, KHÔNG nói thêm thông tin khác.
                - Nếu khách hỏi học phí → chỉ trả lời số tiền học phí.
                - Nếu khách hỏi lịch học → chỉ trả lời thông tin lịch học.
                - Nếu khách hỏi địa chỉ → chỉ trả lời địa chỉ.
                - CHỈ cung cấp thêm thông tin khác khi khách hàng yêu cầu hoặc hỏi thêm.

                **QUY TẮC ĐỊNH DẠNG (BẮT BUỘC):**
                - **QUAN TRỌNG:** Luôn trả lời bằng văn bản thuần túy (plain text). Tuyệt đối KHÔNG sử dụng bất kỳ định dạng markdown nào (không dùng `*`, `**`, `_`, hay gạch đầu dòng).
                - **QUAN TRỌNG:** Chỉ xuống dòng khi thực sự cần thiết. Xuống dòng sau mỗi dấu chấm hết câu. 
                - Ví dụ SAI:
                    Dạ, học phí khóa NEWHSK4 là 7.950.000đ cho cả khóa học. Thời gian học là 6 tháng với 2 buổi mỗi tuần ạ.
                - Ví dụ ĐÚNG:
                    Dạ, học phí khóa NEWHSK4 là 7.950.000đ cho cả khóa học.
                    Thời gian học là 6 tháng với 2 buổi mỗi tuần ạ.

                **THÔNG TIN THANHMAIHSK:**
                ☎️Tổng đài: 1900 633 018
                Hotline Hà Nội: 0931.715.889
                Hotline Tp.Hồ Chí Minh: 0888 616 819
                Website: thanhmaihsk.edu.vn
                Địa chỉ trụ sở: Số 9 ngõ 49 Huỳnh Thúc Kháng, Phường Láng Hạ, Quận Đống Đa, Thành phố Hà Nội, Việt Nam
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