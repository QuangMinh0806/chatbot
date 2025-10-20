"""
Module xử lý GPT Model
Chứa các hàm để generate response cho GPT (function-based)
"""

from typing import Optional
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from llm.help_llm import (
    generate_response_common,
    extract_customer_info_realtime
)


async def generate_gpt_response(
    api_key: str,
    db_session: AsyncSession,
    query: str,
    chat_session_id: int,
    model_name: str = "gpt-4o-mini",
    model_type: str = "gpt"
) -> str:
    """
    Generate response cho GPT model (function-based)
    
    Args:
        api_key: str - OpenAI API key
        db_session: AsyncSession - Database session
        query: str - Câu hỏi từ user
        chat_session_id: int - ID của chat session
        model_name: str - Tên model GPT (mặc định: gpt-4o-mini)
        model_type: str - Loại model (mặc định: gpt) - để tránh gọi get_current_model() trong search
    
    Returns:
        str - Response từ GPT model
    """
    try:
        # Khởi tạo GPT model object để tương thích với generate_response_common
        client = AsyncOpenAI(api_key=api_key)
        
        class GPTModelWrapper:
            """Wrapper class để tương thích với generate_response_common"""
            def __init__(self, client, model_name, api_key):
                self.client = client
                self.model_name = model_name
                self.api_key = api_key
            
            async def generate_content(self, prompt: str) -> str:
                """Generate content sử dụng OpenAI API"""
                response = await self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
        
        model = GPTModelWrapper(client, model_name, api_key)
        
        # Gọi hàm chung generate_response_common với model_name để tránh query DB
        return await generate_response_common(
            model=model,
            db_session=db_session,
            query=query,
            chat_session_id=chat_session_id,
            api_key_for_embedding=api_key,
            model_name=model_type  # Truyền model_type để search_similar_documents không cần gọi DB
        )
        
    except Exception as e:
        print(f"❌ Error generating GPT response: {e}")
        return "Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn."


async def extract_customer_info_gpt(
    api_key: str,
    db_session: AsyncSession,
    chat_session_id: int,
    limit_messages: int,
    model_name: str = "gpt-4o-mini"
) -> Optional[str]:
    """
    Trích xuất thông tin khách hàng sử dụng GPT
    
    Args:
        api_key: str - OpenAI API key
        db_session: AsyncSession - Database session
        chat_session_id: int - ID của chat session
        limit_messages: int - Số lượng tin nhắn cần phân tích
        model_name: str - Tên model GPT
    
    Returns:
        str - JSON string chứa thông tin khách hàng
    """
    # Khởi tạo GPT model wrapper để tương thích với extract_customer_info_realtime
    client = AsyncOpenAI(api_key=api_key)
    
    class GPTModelWrapper:
        def __init__(self, client, model_name, api_key):
            self.client = client
            self.model_name = model_name
            self.api_key = api_key
        
        async def generate_content(self, prompt: str) -> str:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            return response.choices[0].message.content
    
    model = GPTModelWrapper(client, model_name, api_key)
    
    return await extract_customer_info_realtime(
        model,
        db_session,
        chat_session_id,
        limit_messages
    )
