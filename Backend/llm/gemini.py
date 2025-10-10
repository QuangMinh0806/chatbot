import json
from typing import Optional
import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from llm.help_llm import (
    get_latest_messages,
    search_similar_documents,
    get_field_configs,
    get_customer_infor,
    extract_customer_info_realtime,
    build_search_key
)
from llm.prompt import prompt_builder


class GeminiModel:
    
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash-001"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.model_name = model_name
        self.api_key = api_key  # Lưu API key để dùng cho embedding
        self.is_initialized = True
    
    def generate_content(self, prompt: str):
        try:
            return self.model.generate_content(prompt)
        except Exception as e:
            print(f"❌ Error generating content with Gemini: {e}")
            raise


async def initialize_gemini_model(api_key: str, model_name: str = "gemini-2.0-flash-001") -> GeminiModel:
    try:
        model = GeminiModel(api_key, model_name)
        print(f"✅ Gemini model initialized: {model_name}")
        return model
    except Exception as e:
        print(f"❌ Failed to initialize Gemini model: {e}")
        raise


async def generate_gemini_response(
    model: GeminiModel,
    db_session: AsyncSession,
    query: str,
    chat_session_id: int
) -> str:

    try:
        history = await get_latest_messages(db_session, chat_session_id, limit=10)
        customer_info = await get_customer_infor(db_session, chat_session_id)
        
        if not query or query.strip() == "":
            return "Nội dung câu hỏi trống, vui lòng nhập lại."
        
        # Tạo search key từ help_llm
        search_key = await build_search_key(
            model=model,
            db_session=db_session,
            chat_session_id=chat_session_id,
            question=query,
            customer_info=customer_info
        )
        print(f"🔍 Search key: {search_key}")
        
        # Tìm kiếm tài liệu liên quan
        # Lưu ý: Embedding luôn dùng OpenAI API (từ env), không dùng Gemini API
        # Vì database đã được embedding với OpenAI model
        knowledge = await search_similar_documents(
            db_session, 
            search_key, 
            top_k=10,
            api_key=None  # Gemini dùng env variable cho OpenAI embedding
        )
        print(f"📚 Knowledge retrieved: {len(knowledge)} documents")
        
        # Lấy cấu hình fields
        required_fields, optional_fields = await get_field_configs(db_session)
        
        # Tạo danh sách thông tin cần thu thập
        required_info_list = "\n".join([f"- {field_name} (bắt buộc)" for field_name in required_fields.values()])
        optional_info_list = "\n".join([f"- {field_name} (tùy chọn)" for field_name in optional_fields.values()])
        
        # Gọi prompt builder từ file prompt.py
        prompt = await prompt_builder(
            knowledge=knowledge,
            customer_info=customer_info,
            required_info_list=required_info_list,
            optional_info_list=optional_info_list,
            history=history,
            query=query
        )
        
        # Generate response
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"❌ Error generating Gemini response: {e}")
        return f"Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn: {str(e)}"


async def extract_customer_info_gemini(
    model: GeminiModel,
    db_session: AsyncSession,
    chat_session_id: int,
    limit_messages: int
) -> Optional[str]:
    return await extract_customer_info_realtime(
        model, 
        db_session, 
        chat_session_id, 
        limit_messages
    )
