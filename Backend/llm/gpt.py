import json
from typing import List, Dict
from sqlalchemy import text, desc
from config.get_embedding import get_embedding_chatgpt
from config.database import SessionLocal
from models.llm import LLM
from models.chat import Message
from dotenv import load_dotenv
from services.field_config_service import get_all_field_configs_service
from openai import OpenAI
import os
# Load biến môi trường
load_dotenv()


class RAGModel:
    def __init__(self, model_name: str = "gpt-4o-mini"):
        # llm = db.query(LLM).filter(LLM.id == 1).first()
        
        # Khởi tạo client OpenAI
        self.client = OpenAI(api_key=os.getenv(os.getenv("OPENAI_API_KEY")))
        self.model = model_name
        self.db_session = SessionLocal()

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
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in reversed(messages)
        ]

        conversation = []
        for msg in results:
            line = f"{msg['sender_type']}: {msg['content']}"
            conversation.append(line)

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

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        return response.choices[0].message.content.strip()

    def search_similar_documents(self, query: str, top_k: int) -> List[Dict]:
        try:
            # Tạo embedding cho query
            query_embedding = get_embedding_chatgpt(query)

            # numpy.ndarray -> list -> string (pgvector format)
            query_embedding = query_embedding.tolist()
            query_embedding = "[" + ",".join([str(x) for x in query_embedding]) + "]"

            sql = text(
                """
                SELECT id, chunk_text, search_vector <-> (:query_embedding)::vector AS similarity
                FROM document_chunks
                ORDER BY search_vector <-> (:query_embedding)::vector
                LIMIT :top_k
            """
            )

            rows = self.db_session.execute(
                sql, {"query_embedding": query_embedding, "top_k": top_k}
            ).fetchall()

            results = []
            for row in rows:
                results.append(
                    {
                        "content": row.chunk_text,
                        "similarity_score": float(row.similarity),
                    }
                )

            return results

        except Exception as e:
            raise Exception(f"Lỗi khi tìm kiếm: {str(e)}")

    def infomation_customer(self):
        field_configs = get_all_field_configs_service()
        if not field_configs:
            return {}, {}

        thongtin = field_configs[0]
        thongtinbatbuoc = (
            json.loads(thongtin.thongtinbatbuoc)
            if isinstance(thongtin.thongtinbatbuoc, str)
            else thongtin.thongtinbatbuoc
        )
        thongtintuychon = (
            json.loads(thongtin.thongtintuychon)
            if isinstance(thongtin.thongtintuychon, str)
            else thongtin.thongtintuychon
        )
        return thongtinbatbuoc, thongtintuychon

    def generate_response(self, query: str) -> str:
        try:
            # history = self.get_latest_messages(chat_session_id=chat_session_id, limit=10)

            # if not query or query.strip() == "":
            #     return "Nội dung câu hỏi trống, vui lòng nhập lại."

            # search = self.build_search_key(chat_session_id, query)
            # print(f"Search: {search}")

            # knowledge = self.search_similar_documents(search, 10)

            # prompt = f"""
            # KIẾN THỨC CƠ SỞ:
            # {knowledge}

            # LỊCH SỬ TRÒ CHUYỆN:
            # {history}

            # TIN NHẮN MỚI TỪ KHÁCH HÀNG:
            # user: {query}

            # TRẢ LỜI CỦA BẠN:
            # """

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Bạn là trợ lý AI thông minh, trả lời rõ ràng, chính xác."},
                    {"role": "user", "content": query},
                ],
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            return f"Lỗi khi sinh câu trả lời: {str(e)}"

    def build_prompt(self, history):
        thongtinbatbuoc, thongtintuychon = self.infomation_customer()
        all_fields = {**thongtinbatbuoc, **thongtintuychon}
        fields_text = "\n".join([f"- {label}" for key, label in all_fields.items()])
        json_template = ",\n".join(
            [f'    "{label}": <{label} hoặc null>' for key, label in all_fields.items()]
        )

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

    def extract_with_ai(self, chat_session_id: int):
        try:
            history = self.get_latest_messages(chat_session_id=chat_session_id, limit=20)

            prompt = f"""
            Đây là đoạn hội thoại:
            {history}

            Hãy trích xuất thông tin khách hàng dưới dạng JSON với các trường sau:
            - name
            - phone
            - Địa chỉ
            - Email

            Nếu không có thông tin thì để null.

            VD :
                {{
                    "name": <họ tên hoặc null>,
                    "phone": <số điện thoại hoặc null>,
                    "address": <địa chỉ hoặc null>,
                    "email": <email hoặc null>
                }}

            Lưu ý quan trọng : Chỉ trả về JSON object, không kèm giải thích, không kèm ```json
            """

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            return f"Lỗi khi sinh câu trả lời: {str(e)}"
