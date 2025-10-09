import json
import os
import re
from typing import List, Dict
from sqlalchemy import text
from sqlalchemy.orm import Session
from llm.prompt import prompt_builder
from config.get_embedding import get_embedding_gemini
import google.generativeai as genai
from llm.base_rag import BaseRAGModel
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()

class RAGModel(BaseRAGModel):
    def __init__(self, model_name: str = "gemini-2.0-flash-001", db_session: Session = None):
        # Gọi constructor của class cha
        super().__init__(db_session)
        
        # Cấu hình Gemini
        genai.configure(api_key=self.llm_config.key)
        self.model = genai.GenerativeModel(model_name)

    def build_search_key(self, chat_session_id: int, question: str) -> str:
        """Xây dựng từ khóa tìm kiếm từ lịch sử và câu hỏi hiện tại"""
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

    def search_similar_documents(self, query: str, top_k: int) -> List[Dict]:
        """Tìm kiếm tài liệu tương tự sử dụng Gemini embedding"""
        return super().search_similar_documents(query, top_k, get_embedding_gemini)

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
            print("kien thuc co so", knowledge)

            prompt = prompt_builder(knowledge, customer_info, required_info_list, optional_info_list, history, query)
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            print(e)
            return f"Lỗi khi sinh câu trả lời: {str(e)}"

    def extract_customer_info_realtime(self, chat_session_id: int, limit_messages: int):
        """Trích xuất thông tin khách hàng theo thời gian thực sử dụng Gemini"""
        def gemini_generate(prompt):
            response = self.model.generate_content(prompt)
            return response.text
        
        return super().extract_customer_info_realtime(chat_session_id, limit_messages, gemini_generate)
