"""
Module xử lý Gemini Model
Chứa các hàm để generate response cho Gemini (function-based)
"""

import os
from typing import Optional
import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from llm.help_llm import (
    generate_response_common,
    extract_customer_info_realtime
)


async def generate_gemini_response(
    api_key: str,
    db_session: AsyncSession,
    query: str,
    chat_session_id: int,
    model_name: str = "gemini-2.0-flash-001",
    model_type: str = "gemini"
) -> str:
    """
    Generate response cho Gemini model (function-based)
    
    Args:
        api_key: str - Google API key
        db_session: AsyncSession - Database session
        query: str - Câu hỏi từ user
        chat_session_id: int - ID của chat session
        model_name: str - Tên model Gemini (mặc định: gemini-2.0-flash-001)
        model_type: str - Loại model (mặc định: gemini) - để tránh gọi get_current_model() trong search
    
    Returns:
        str - Response từ Gemini model
    """
    try:
        # Khởi tạo Gemini model object để tương thích với generate_response_common
        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel(model_name)
        
        class GeminiModelWrapper:
            """Wrapper class để tương thích với generate_response_common"""
            def __init__(self, model, api_key):
                self.model = model
                self.api_key = api_key
            
            def generate_content(self, prompt: str):
                """Generate content sử dụng Gemini API (sync)"""
                return self.model.generate_content(prompt)
        
        model = GeminiModelWrapper(gemini_model, api_key)
        
        # Gọi hàm chung generate_response_common với model_name để tránh query DB
        return await generate_response_common(
            model=model,
            db_session=db_session,
            query=query,
            chat_session_id=chat_session_id,
            model_name=model_type  # Truyền model_type để search_similar_documents không cần gọi DB
        )
        
    except Exception as e:
        print(f"❌ Error generating Gemini response: {e}")
        return "Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn."


async def extract_customer_info_gemini(
    api_key: str,
    db_session: AsyncSession,
    chat_session_id: int,
    limit_messages: int,
    model_name: str = "gemini-2.0-flash-001"
) -> Optional[str]:
    """
    Trích xuất thông tin khách hàng sử dụng Gemini
    
    Args:
        api_key: str - Google API key
        db_session: AsyncSession - Database session
        chat_session_id: int - ID của chat session
        limit_messages: int - Số lượng tin nhắn cần phân tích
        model_name: str - Tên model Gemini
    
    Returns:
        str - JSON string chứa thông tin khách hàng
    """
    # Khởi tạo Gemini model wrapper để tương thích với extract_customer_info_realtime
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel(model_name)
    
    class GeminiModelWrapper:
        def __init__(self, model, api_key):
            self.model = model
            self.api_key = api_key
        
        def generate_content(self, prompt: str):
            return self.model.generate_content(prompt)
    
    model = GeminiModelWrapper(gemini_model, api_key)
    
    return await extract_customer_info_realtime(
        model,
        db_session,
        chat_session_id,
        limit_messages
    )
