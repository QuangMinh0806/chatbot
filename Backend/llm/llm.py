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
from services.field_config_service import get_all_field_configs_service
from models.chat import ChatSession, CustomerInfo
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
        messages = (
            self.db_session.query(Message)
            .filter(Message.chat_session_id == chat_session_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
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
        
        # Không đóng db_session nữa vì được quản lý từ bên ngoài
        return "\n".join(conversation)
    
    
    
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
    
    
    def infomation_customer(self):
        field_configs = get_all_field_configs_service()
        if not field_configs:
            return {}, {}

        thongtin = field_configs[0]
        thongtinbatbuoc = (
            json.loads(thongtin.thongtinbatbuoc) if isinstance(thongtin.thongtinbatbuoc, str) else thongtin.thongtinbatbuoc
        )
        thongtintuychon = (
            json.loads(thongtin.thongtintuychon) if isinstance(thongtin.thongtintuychon, str) else thongtin.thongtintuychon
        )
        return thongtinbatbuoc, thongtintuychon
    
    def get_customer_infor(self, chat_session_id: int) -> dict:
        """Lấy thông tin khách hàng đã cung cấp từ database"""
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
            
            # Phân tích thông tin khách hàng đã có
            has_basic_info = customer_info.get('name') or customer_info.get('phone')
            has_learning_goal = customer_info.get('class') or any(keyword in str(customer_info) for keyword in ['mục tiêu', 'học', 'trình độ'])
            has_preference = any(keyword in str(customer_info) for keyword in ['online', 'offline', 'thời gian', 'lịch'])
            
            prompt = f"""

                KIẾN THỨC CƠ SỞ:
                {knowledge}

                THÔNG TIN KHÁCH HÀNG ĐÃ CÓ:
                {customer_info}

                Bạn là một trợ lý ảo chuyên nghiệp tư vấn khóa học cho Trung tâm tiếng Trung THANHMAIHSK.
                Bạn PHẢI tuân thủ nghiêm ngặt quy trình sau:

                **QUY TRÌNH TƯ VẤN CHUYÊN NGHIỆP:**

                **GIAI ĐOẠN 1: KHAI THÁC NHU CẦU & XÂY DỰNG NIỀM TIN**
                - LUÔN ưu tiên khai thác nhu cầu học tập trước khi cung cấp thông tin về giá cả
                - Hỏi về: Mục tiêu học tập, trình độ hiện tại, hình thức học (online/offline), thời gian có thể học
                - Khi khách hàng hỏi về GIÁ CẢ mà chưa có đủ thông tin cần thiết:
                  + Trả lời: "Dạ, để em tư vấn chính xác khóa học và mức học phí phù hợp nhất với anh/chị"
                  + Sau đó HỎI KHAI THÁC: "Anh/chị cho em biết mục tiêu học tiếng Trung của mình là gì ạ?"
                  + "Hiện tại anh/chị đã có nền tảng tiếng Trung chưa ạ?"
                  + "Anh/chị muốn học online hay đến trung tâm trực tiếp ạ?"
                
                **GIAI ĐOẠN 2: TƯ VẤN KHÓA HỌC PHÙ HỢP**
                - Chỉ sau khi đã khai thác được nhu cầu mới tư vấn khóa học cụ thể
                - Giải thích TẠI SAO khóa học này phù hợp với nhu cầu của khách
                
                **GIAI ĐOẠN 3: THẢO LUẬN HỌC PHÍ**
                - CHỈ báo giá sau khi đã:
                  + Khai thác được nhu cầu
                  + Tư vấn được khóa học phù hợp  
                - Khi báo giá, luôn đi kèm với GIẢI THÍCH GIÁ TRỊ:
                  "Học phí này bao gồm: [liệt kê các dịch vụ, tài liệu, hỗ trợ...]"
                  "So với các trung tâm khác, chúng em có ưu điểm: [điểm mạnh]"

                **QUY TẮC TƯ VẤN THÔNG MINH:**
                - KHÔNG HỎI LẠI: Nếu đã biết khách quan tâm khóa nào, không hỏi lại "khóa học nào"
                - TƯƠNG TÁC HAI CHIỀU: Luôn đặt câu hỏi để khách hàng tham gia cuộc trò chuyện
                - KẾT HỢP THÔNG TIN: Sử dụng thông tin khách đã cung cấp để cá nhân hóa tư vấn
                - XÂY DỰNG RAPPORT: Thể hiện sự quan tâm, hiểu biết về tình huống của khách

                **CÂU HỎI KHAI THÁC NHU CẦU:**
                - "Mục tiêu học tiếng Trung của anh/chị là gì ạ? (du học, công việc, sở thích?)"
                - "Hiện tại anh/chị đã có nền tảng tiếng Trung chưa ạ?"
                - "Anh/chị muốn học online hay đến trung tâm trực tiếp ạ?"
                - "Thời gian anh/chị có thể sắp xếp để học như thế nào ạ?"


                **QUY TẮC CHỐT ĐƠN:**
                - CHỈ chuyển sang giai đoạn chốt đơn khi khách thể hiện ý định đăng ký rõ ràng
                - Ưu tiên lấy SỐ ĐIỆN THOẠI và HỌ TÊN trước
                - Nếu khách chưa sẵn sàng đăng ký, hẹn tư vấn viên gọi lại để tư vấn thêm

                **PHONG CÁCH GIAO TIẾP:**
                - Xưng "em" - gọi "anh/chị" 
                - Bắt đầu bằng "Dạ"
                - Nhiệt tình, tích cực, chuyên nghiệp
                - Tương tác hai chiều, không cung cấp thông tin một chiều

                **QUY TẮC ĐỊNH DẠNG:**
                - Trả lời bằng văn bản thuần túy (plain text)
                - Không dùng markdown formatting
                - Xuống dòng sau mỗi dấu chấm hết câu

                **THÔNG TIN LIÊN HỆ:**
                ☎️Tổng đài: 1900 633 018
                Hotline Hà Nội: 0931.715.889  
                Hotline TP.HCM: 0888 616 819
                Website: thanhmaihsk.edu.vn
                ---
                
                **LỊCH SỬ TRÒ CHUYỆN:**
                {history}
                
                **TIN NHẮN MỚI:**
                user: {query}

                **HƯỚNG DẪN XỬ LÝ:**
                - Nếu khách hỏi giá mà chưa khai thác nhu cầu → Khai thác nhu cầu trước
                - Nếu khách đã cung cấp thông tin → Sử dụng để tư vấn cá nhân hóa
                - Luôn đặt câu hỏi để tương tác, không chỉ cung cấp thông tin
                - Xây dựng niềm tin trước khi báo giá

                TRẢ LỜI:
               """
               
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            print(e)
            return f"Lỗi khi sinh câu trả lời: {str(e)}"
    
    
    def build_prompt(self, history):
        thongtinbatbuoc, thongtintuychon = self.infomation_customer()

        # Gộp tất cả field
        all_fields = {**thongtinbatbuoc, **thongtintuychon}

        # Tạo danh sách field dạng "- key : label"
        fields_text = "\n".join([f"- {label}" for key, label in all_fields.items()])

        # Tạo JSON template động
        json_template = ",\n".join([
            f'    "{label}": <{label} hoặc null>'
            for key, label in all_fields.items()
        ])

        prompt = f"""
            Đây là đoạn hội thoại:
            {history}

            Hãy trích xuất thông tin khách hàng dưới dạng JSON với các trường sau:
            {fields_text}

            Nếu không có thông tin thì để null.
            
            VD : 
            {{
            {json_template}
            }}
            
            Lưu ý quan trọng : Chỉ trả về JSON object, không kèm giải thích, không kèm ```json
            """

        return prompt

    def extract_customer_info_realtime(self, chat_session_id: int, limit_messages: int = 10):
        """
        Trích xuất thông tin khách hàng theo thời gian thực sau mỗi tin nhắn
        """
        try:
            history = self.get_latest_messages(chat_session_id=chat_session_id, limit=limit_messages)
            if not history or history.strip() == "":
                print("DEBUG: No history found, returning empty JSON")
                return json.dumps({
                    "name": None,
                    "email": None,
                    "phone": None,
                    "address": None,
                    "class": None,
                    "registration": False
                })
            prompt = f"""
                Bạn là một công cụ phân tích hội thoại để trích xuất thông tin khách hàng.

                Dưới đây là đoạn hội thoại gần đây:
                {history}

                Hãy trích xuất TOÀN BỘ thông tin khách hàng có trong hội thoại và trả về JSON với các trường:
                - name: họ tên khách hàng
                - email: email khách hàng  
                - phone: số điện thoại
                - address: địa chỉ
                - class: khóa học quan tâm/muốn đăng ký
                - registration: có ý định đăng ký không (true/false)

                QUY TẮC QUAN TRỌNG:
                - Trích xuất tất cả thông tin có thể từ hội thoại
                - Nếu không có thông tin thì để null
                - CHỈ trả về JSON thuần túy, không có text khác
                - Không sử dụng markdown formatting
                - JSON phải hợp lệ để dùng với json.loads()

                Ví dụ format trả về:
                {{
                    "name": "Nguyễn Văn A",
                    "email": "nguyenvana@gmail.com",
                    "phone": "0123456789",
                    "address": "Hà Nội",
                    "class": "NEWHSK3",
                    "registration": true
                }}
                """
                
            response = self.model.generate_content(prompt)
            cleaned = re.sub(r"```json|```", "", response.text).strip()
            
            return cleaned
            
        except Exception as e:
            print(f"Lỗi trích xuất thông tin: {str(e)}")
            return None

    def extract_with_ai(self, chat_session_id : int):
        try : 
            history = self.get_latest_messages(chat_session_id=chat_session_id, limit=20)

            
            prompt = f"""
                Bạn là một công cụ trích xuất dữ liệu khách hàng.

                Dưới đây là đoạn hội thoại:
                {history}

                Hãy trích xuất thông tin khách hàng và trả về duy nhất một JSON hợp lệ với các trường sau:
                - name
                - email
                - phone
                - address
                - class
                - registration

                QUAN TRỌNG: 
                - Chỉ trả về JSON thuần túy
                - Không thêm bất kỳ text, giải thích, hoặc markdown formatting nào
                - Tuyệt đối sử dụng "```json" hoặc "```" trong câu trả lời
                - Dữ liệu trả ra phải dùng được ở json.loads(data)
                - Kết quả phải là JSON hợp lệ, ví dụ:

                Trả về kết quả theo định dạng JSON sau:
                    {{
                        "name": "Nguyen Van A",
                        "email": "abc@gmail.com",
                        "phone": "0362916134",
                        "address": "Đà Nẵng",
                        "class": "NEWHSK3",
                        "registration": true
                    }}
                """
                
            response = self.model.generate_content(prompt)
            
        
            cleaned = re.sub(r"```json|```", "", response.text).strip()
            
            return cleaned
        except Exception as e:
            return f"Lỗi khi sinh câu trả lời: {str(e)}"