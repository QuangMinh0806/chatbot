import json
import re
import time
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy import text, select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from config.get_embedding import get_embedding_chatgpt
from models.chat import Message, CustomerInfo
from models.field_config import FieldConfig
from models.llm import LLM
from config.redis_cache import cache_get, cache_set, cache_delete


# Cache để tránh query database liên tục
_model_config_cache = None
_cache_timestamp = None
_cache_ttl = 300  # 5 phút


async def get_latest_messages(
    db_session: AsyncSession, 
    chat_session_id: int, 
    limit: int
) -> str:
    """
    Lấy lịch sử tin nhắn gần đây từ database
    
    Args:
        db_session: AsyncSession - Database session
        chat_session_id: int - ID của chat session
        limit: int - Số lượng tin nhắn tối đa cần lấy
    
    Returns:
        str - Lịch sử hội thoại dưới dạng text, mỗi dòng format: "sender_type: content"
    """
    result = await db_session.execute(
        select(Message)
        .filter(Message.chat_session_id == chat_session_id)
        .order_by(desc(Message.created_at))
        .limit(limit)
    )
    messages = result.scalars().all()
    
    results = [
        {
            "id": m.id,
            "content": m.content,
            "sender_type": m.sender_type,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in reversed(messages) 
    ]

    conversation = []
    for msg in results:
        line = f"{msg['sender_type']}: {msg['content']}"
        conversation.append(line)
    
    conversation_text = "\n".join(conversation)
    
    return conversation_text


async def build_search_key(
    model,
    db_session: AsyncSession,
    chat_session_id: int, 
    question: str, 
    customer_info: Optional[dict] = None
) -> str:
    """
    Tạo từ khóa tìm kiếm tối ưu từ câu hỏi của khách hàng
    Sử dụng LLM để phân tích context và tạo search key phù hợp
    
    Args:
        model: LLM model (Gemini hoặc GPT) - model đã được khởi tạo
        db_session: AsyncSession - Database session
        chat_session_id: int - ID của chat session
        question: str - Câu hỏi của khách hàng
        customer_info: dict - Thông tin khách hàng (optional)
    
    Returns:
        str - Từ khóa tìm kiếm đã được tối ưu
    """
    history = await get_latest_messages(db_session, chat_session_id, limit=5)
    
    # Chuẩn bị thông tin khách hàng cho context
    customer_context = ""
    if customer_info:
        customer_context = f"\nThông tin khách hàng: {customer_info}"
    
    prompt = f"""
    Tạo từ khóa tìm kiếm cho câu hỏi của khách hàng.
    
    Hội thoại trước:
    {history}
    {customer_context}

    Câu hỏi: {question}

    QUY TẮC ĐƠN GIẢN:
    
    1. ƯU TIÊN GIỮ NGUYÊN câu hỏi nếu nó đã đầy đủ thông tin
       VD: "Khóa HSK3 học những gì?" → GIỮ NGUYÊN: "Khóa HSK3 học những gì"
    
    2. CHỈ BỔ SUNG khi câu hỏi THIẾU thông tin quan trọng từ context:
       - Thiếu tên khóa học → thêm tên khóa từ hội thoại trước
       - Hỏi lịch mà có thông tin hình thức/địa điểm → thêm vào
    
    3. ⚠️ QUY TẮC QUAN TRỌNG - Khi hỏi về LỊCH KHAI GIẢNG:
       
       Nếu khách chọn ONLINE (học từ xa, trực tuyến):
       → BẮT BUỘC có: "lớp học trực tuyến" hoặc "online"
       → VD: "lịch khai giảng lớp học trực tuyến HSK3"
       
       Nếu khách chọn OFFLINE (học trực tiếp):
       → BẮT BUỘC có: THÀNH PHỐ và TÊN CƠ SỞ
       → VD: "lịch khai giảng HSK3 cơ sở Đống Đa Hà Nội"
       → VD: "lịch khai giảng HSK3 cơ sở Lê Lợi Đà Nẵng"
    
    4. KHÔNG ĐƯỢC:
       - Thêm quá nhiều từ đồng nghĩa
       - Mở rộng không cần thiết
       - Viết lại câu hỏi theo cách khác
    
    5. GIỮ NGẮN GỌN: Tối đa 10 từ, trừ khi cần thiết
    
    VÍ DỤ:
    
    Câu hỏi đầy đủ - GIỮ NGUYÊN:
    - "Khóa HSK3 học những gì?" → "Khóa HSK3 học những gì"
    - "Học phí khóa giao tiếp bao nhiêu?" → "Học phí khóa giao tiếp"
    - "Có cơ sở ở Hà Nội không?" → "Cơ sở ở Hà Nội"
    - "Đội ngũ giảng viên thế nào?" → "Đội ngũ giảng viên"
    - "Sĩ số lớp bao nhiêu?" → "Sĩ số lớp"
    - "Có cho học thử không?" → "Học thử"
    
    Câu hỏi về lịch - PHÂN BIỆT ONLINE/OFFLINE:
    - "Khi nào khai giảng?" (khách chọn ONLINE, HSK3) 
      → "lịch khai giảng lớp học trực tuyến HSK3"
    
    - "Khi nào khai giảng?" (khách chọn ONLINE, HSK4)
      → "lịch khai giảng lớp học trực tuyến HSK4"
    
    - "Lịch tháng này?" (khách chọn OFFLINE, HSK5, Hà Nội)
      → "lịch khai giảng dự kiến HSK5 cơ sở Đống Đa Hà Nội"
    
    - "Khi nào học?" (khách chọn OFFLINE, HSK3, cơ sở Mỹ Đình)
      → "lịch học HSK3 cơ sở Mỹ Đình"

    - "Có lớp nào sắp khai giảng?" (OFFLINE, TP.HCM)
      → "lịch khai giảng TP.HCM"
    
    Câu hỏi thiếu context khác - BỔ SUNG TỐI THIỂU:
    - "Học phí bao nhiêu?" (đang nói HSK4) → "HSK4 học phí"
    - "Học những gì?" (đang nói khóa giao tiếp) → "Khóa giao tiếp học gì"
    
    CHỈ TRẢ VỀ TỪ KHÓA, KHÔNG GIẢI THÍCH.
    """
    
    # Gọi model tùy theo loại (Gemini hoặc GPT)
    if hasattr(model, 'generate_content'):
        # Cả GPT và Gemini đều có generate_content, nhưng GPT là async
        if hasattr(model, 'client'):
            # GPTModel - async function
            response_text = await model.generate_content(prompt)
            return response_text.strip()
        else:
            # GeminiModel - sync function
            response = model.generate_content(prompt)
            return response.text.strip()
    else:
        # Fallback cho các model khác
        response = await model.chat.completions.create(
            model=model.model_name if hasattr(model, 'model_name') else "gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()


async def search_similar_documents(
    db_session: AsyncSession,
    query: str, 
    top_k: int,
    api_key: str = None
) -> List[Dict]:
    """
    Tìm kiếm các tài liệu tương tự dựa trên vector embedding
    
    Args:
        db_session: AsyncSession - Database session
        query: str - Câu truy vấn tìm kiếm
        top_k: int - Số lượng tài liệu tối đa trả về
        api_key: str - OpenAI API key (optional, để tạo embedding)
    
    Returns:
        List[Dict] - Danh sách các tài liệu tương tự với format:
                     [{"content": str, "similarity_score": float}, ...]
    
    Raises:
        Exception - Nếu có lỗi trong quá trình tìm kiếm
    """
    try:
        # Tạo embedding cho query với API key
        query_embedding = await get_embedding_chatgpt(query, api_key=api_key)
        
        if query_embedding is None:
            print("⚠️ Failed to create embedding for query")
            return []

        # numpy.ndarray -> list -> string (pgvector format)
        query_embedding = query_embedding.tolist()
        query_embedding = "[" + ",".join([str(x) for x in query_embedding]) + "]"

        sql = text("""
            SELECT id, chunk_text, search_vector <-> (:query_embedding)::vector AS similarity
            FROM document_chunks
            ORDER BY search_vector <-> (:query_embedding)::vector
            LIMIT :top_k
        """)

        result = await db_session.execute(
            sql, {"query_embedding": query_embedding, "top_k": top_k}
        )
        rows = result.fetchall()

        results = []
        for row in rows:
            results.append({
                "content": row.chunk_text,
                "similarity_score": float(row.similarity)
            })

        return results

    except Exception as e:
        raise Exception(f"Lỗi khi tìm kiếm: {str(e)}")


async def get_field_configs(db_session: AsyncSession) -> Tuple[Dict[str, str], Dict[str, str]]:
    """
    Lấy cấu hình fields từ bảng field_config với Redis cache
    
    Args:
        db_session: AsyncSession - Database session
    
    Returns:
        Tuple[Dict[str, str], Dict[str, str]] - (required_fields, optional_fields)
        - required_fields: Dict với các field bắt buộc {field_name: field_name}
        - optional_fields: Dict với các field tùy chọn {field_name: field_name}
    """
    cache_key = "field_configs:required_optional"
    
    # Thử lấy từ cache trước
    cached_result = cache_get(cache_key)
    if cached_result is not None:
        return cached_result.get('required_fields', {}), cached_result.get('optional_fields', {})
    
    try:
        result = await db_session.execute(
            select(FieldConfig).order_by(FieldConfig.excel_column_letter)
        )
        field_configs = result.scalars().all()
        
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
                
        return required_fields, optional_fields
    except Exception as e:
        print(f"Lỗi khi lấy field configs: {str(e)}")
        # Trả về dict rỗng nếu có lỗi
        return {}, {}


async def get_customer_infor(db_session: AsyncSession, chat_session_id: int) -> dict:
    """
    Lấy thông tin khách hàng từ database
    
    Args:
        db_session: AsyncSession - Database session
        chat_session_id: int - ID của chat session
    
    Returns:
        dict - Thông tin khách hàng dưới dạng dictionary
               Trả về {} nếu không có thông tin hoặc có lỗi
    """
    try:
        # Lấy thông tin khách hàng từ bảng customer_info
        result = await db_session.execute(
            select(CustomerInfo).filter(CustomerInfo.chat_session_id == chat_session_id)
        )
        customer_info = result.scalar_one_or_none()
        
        if customer_info and customer_info.customer_data:
            # Nếu customer_data là string JSON, parse nó
            if isinstance(customer_info.customer_data, str):
                return json.loads(customer_info.customer_data)
            # Nếu đã là dict thì return trực tiếp
            return customer_info.customer_data
        return {}
    except Exception as e:
        print(f"Lỗi khi lấy thông tin khách hàng: {str(e)}")
        return {}


async def extract_customer_info_realtime(
    model,
    db_session: AsyncSession,
    chat_session_id: int, 
    limit_messages: int
) -> Optional[str]:
    """
    Trích xuất thông tin khách hàng real-time từ lịch sử hội thoại
    Sử dụng LLM để phân tích và trích xuất thông tin theo cấu hình fields
    
    Args:
        model: LLM model (Gemini hoặc GPT) - model đã được khởi tạo
        db_session: AsyncSession - Database session
        chat_session_id: int - ID của chat session
        limit_messages: int - Số lượng tin nhắn gần đây cần phân tích
    
    Returns:
        str - JSON string chứa thông tin khách hàng đã trích xuất
              Trả về None nếu có lỗi
    """
    try:
        history = await get_latest_messages(db_session, chat_session_id, limit_messages)
        
        # Lấy cấu hình fields động
        required_fields, optional_fields = await get_field_configs(db_session)
        all_fields = {**required_fields, **optional_fields}
        
        # Nếu không có field configs, trả về JSON rỗng
        if not all_fields:
            return json.dumps({})
        
        # Nếu không có lịch sử hội thoại, trả về JSON rỗng với các fields từ config
        if not history or history.strip() == "":
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
        
        # Gọi model tùy theo loại (Gemini hoặc GPT)
        if hasattr(model, 'generate_content'):
            # Cả GPT và Gemini đều có generate_content, nhưng GPT là async
            if hasattr(model, 'client'):
                # GPTModel - async function
                response_text = await model.generate_content(prompt)
                cleaned = re.sub(r"```json|```", "", response_text).strip()
            else:
                # GeminiModel - sync function
                response = model.generate_content(prompt)
                cleaned = re.sub(r"```json|```", "", response.text).strip()
        else:
            # Fallback cho các model khác
            response = await model.chat.completions.create(
                model=model.model_name if hasattr(model, 'model_name') else "gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            cleaned = re.sub(r"```json|```", "", response.choices[0].message.content).strip()
        
        return cleaned
        
    except Exception as e:
        print(f"Lỗi khi trích xuất thông tin khách hàng: {str(e)}")
        return None


def clear_field_configs_cache() -> bool:
    """
    Xóa cache field configs khi có thay đổi cấu hình
    
    Returns:
        bool - True nếu xóa cache thành công, False nếu thất bại
    """
    cache_key = "field_configs:required_optional"
    success = cache_delete(cache_key)
    return success


async def get_model_config(db_session: AsyncSession) -> Dict[str, Any]:
    """
    Lấy cấu hình model từ database với cache
    
    Bảng LLM có cấu trúc:
    - name: Loại model ("gpt" hoặc "gemini")
    - key: API key để sử dụng model đó
    
    Args:
        db_session: AsyncSession - Database session
    
    Returns:
        Dict[str, Any] - Dictionary chứa:
            - model_type: str - "gpt" hoặc "gemini" 
            - api_key: str - API key từ cột 'key' trong database
            - model_name: str - Tên model cụ thể để khởi tạo
    """
    global _model_config_cache, _cache_timestamp
    
    current_time = time.time()
    
    # Kiểm tra cache
    if (_model_config_cache is not None and 
        _cache_timestamp is not None and 
        current_time - _cache_timestamp < _cache_ttl):
        return _model_config_cache
    
    try:
        # Lấy từ database (id=1 là config chính)
        result = await db_session.execute(select(LLM).filter(LLM.id == 1))
        llm_config = result.scalar_one_or_none()
        
        if not llm_config:
            print("⚠️ No LLM config found in database, using default Gemini")
            _model_config_cache = {
                "model_type": "gemini",
                "api_key": None,
                "model_name": "gemini-2.0-flash-001"
            }
        else:
            # Cột 'name' trong database chứa loại model: "gpt" hoặc "gemini"
            # Cột 'key' chứa API key tương ứng
            llm_name = llm_config.name.lower().strip() if llm_config.name else ""
            api_key = llm_config.key
            
            print(f"📊 Database config - name: '{llm_config.name}', key: '{api_key[:10]}...' if api_key else 'None'")
            
            # Xác định model type và model name cụ thể
            if "gpt" in llm_name or "openai" in llm_name:
                model_type = "gpt"
                # Sử dụng model name mặc định cho GPT
                model_name = "gpt-4o-mini"
                print(f"✅ Detected GPT model")
            else:
                model_type = "gemini"
                # Sử dụng model name mặc định cho Gemini
                model_name = "gemini-2.0-flash-001"
                print(f"✅ Detected Gemini model")
            
            _model_config_cache = {
                "model_type": model_type,
                "api_key": api_key,
                "model_name": model_name
            }
        
        _cache_timestamp = current_time
        return _model_config_cache
        
    except Exception as e:
        print(f"❌ Error getting model config: {e}")
        # Default fallback to Gemini
        return {
            "model_type": "gemini",
            "api_key": None,
            "model_name": "gemini-2.0-flash-001"
        }


async def initialize_model(db_session: AsyncSession) -> Any:
    """
    Khởi tạo model phù hợp (GPT hoặc Gemini) dựa trên cấu hình database
    
    Flow:
    1. Đọc bảng LLM (id=1) để lấy loại model từ cột 'name' và API key từ cột 'key'
    2. Nếu name chứa "gpt" → khởi tạo GPT với OpenAI API
    3. Nếu name chứa "gemini" → khởi tạo Gemini với Google API
    
    Args:
        db_session: AsyncSession - Database session
    
    Returns:
        Model object - GPT model hoặc Gemini model đã được khởi tạo với API key từ database
    
    Raises:
        Exception - Nếu không thể khởi tạo model hoặc thiếu API key
    """
    config = await get_model_config(db_session)
    
    # Kiểm tra API key
    if not config["api_key"]:
        raise Exception(f"⚠️ API key is missing for {config['model_type']} model in database")
    
    try:
        if config["model_type"] == "gpt":
            print(f"🤖 Initializing GPT model: {config['model_name']} with API key from database")
            from llm.gpt import initialize_gpt_model
            return await initialize_gpt_model(config["api_key"], config["model_name"])
        else:
            print(f"🤖 Initializing Gemini model: {config['model_name']} with API key from database")
            from llm.gemini import initialize_gemini_model
            return await initialize_gemini_model(config["api_key"], config["model_name"])
    except Exception as e:
        print(f"❌ Error initializing {config['model_type']} model: {e}")
        raise


def clear_model_config_cache():
    global _model_config_cache, _cache_timestamp
    _model_config_cache = None
    _cache_timestamp = None
    print("✅ Model config cache cleared")
