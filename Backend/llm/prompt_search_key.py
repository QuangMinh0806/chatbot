"""
Prompt cho hàm build_search_key
Tạo từ khóa tìm kiếm tối ưu từ câu hỏi của khách hàng
"""


def get_search_key_prompt(history: str, customer_context: str, question: str) -> str:
    """
    Tạo prompt cho việc build search key
    
    Args:
        history: str - Lịch sử hội thoại
        customer_context: str - Thông tin khách hàng (nếu có)
        question: str - Câu hỏi của khách hàng
    
    Returns:
        str - Prompt đầy đủ để generate search key
    """
    return f"""
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
