# Chat Service Refactoring

## Cấu trúc mới

Đã tách file `chat_service.py` thành 4 modules riêng biệt để dễ quản lý:

### 1. `platform_message_service.py`
**Chức năng**: Xử lý gửi tin nhắn đến các platform (Facebook, Telegram, Zalo)

**Classes**:
- `PlatformMessageService`: Service chính để gửi tin nhắn
  - `send_facebook_message()`: Gửi tin nhắn Facebook
  - `send_telegram_message()`: Gửi tin nhắn Telegram  
  - `send_zalo_message()`: Gửi tin nhắn Zalo
  - `send_to_platform()`: Universal method để gửi đến bất kỳ platform nào

**Backward compatibility functions**:
- `send_fb()`
- `send_telegram()`
- `send_zalo()`

### 2. `session_service.py`
**Chức năng**: Quản lý chat sessions và caching

**Classes**:
- `SessionService`: Service quản lý sessions
  - `create_session()`: Tạo session mới
  - `get_or_create_session()`: Lấy hoặc tạo session
  - `get_session_by_id()`: Lấy session với caching
  - `update_session_status()`: Cập nhật trạng thái session
  - `check_can_reply()`: Kiểm tra có thể reply tự động
  - `update_session_cache()`: Quản lý Redis cache
  - `create_platform_session()`: Tạo session cho platform

**Backward compatibility functions**:
- `create_session_service()`
- `check_session_service()`

### 3. `message_service.py`
**Chức năng**: Quản lý tin nhắn và logic xử lý chat

**Classes**:
- `MessageService`: Service chính cho tin nhắn
  - `create_message()`: Tạo tin nhắn mới
  - `get_message_history()`: Lấy lịch sử tin nhắn với pagination
  - `get_all_conversations()`: Lấy tất cả cuộc hội thoại
  - `send_message_sync()`: Gửi tin nhắn đồng bộ (legacy)
  - `send_message_async()`: Gửi tin nhắn bất đồng bộ (optimized)
  - `send_platform_message()`: Xử lý tin nhắn từ platform
  - `broadcast_message()`: Gửi tin nhắn đến nhiều customers
  - `delete_messages()`: Xóa tin nhắn

**Backward compatibility functions**:
- `send_message_service()`
- `send_message_fast_service()`
- `send_message_page_service()`
- `sendMessage()`
- `get_history_chat_service()`
- `get_all_history_chat_service()`
- `delete_message()`

### 4. `chat_utils.py`  
**Chức năng**: Các utility functions cho chat

**Classes**:
- `ChatUtils`: Tổng hợp các utility functions
  - `get_all_customers()`: Lấy danh sách customers với filter
  - `update_chat_session()`: Cập nhật chat session
  - `delete_chat_sessions()`: Xóa nhiều sessions
  - `update_session_tags()`: Cập nhật tags

**Backward compatibility functions**:
- `get_all_customer_service()`
- `update_chat_session()`
- `delete_chat_session()`
- `update_tag_chat_session()`

### 5. `chat_service.py` (Updated)
**Chức năng**: Main entry point với backward compatibility

- Import và re-export tất cả functions từ các modules mới
- Maintain backward compatibility 100%
- Wrapper functions cho legacy code

## Ưu điểm của cấu trúc mới

### 🎯 **Separation of Concerns**
- Mỗi module có trách nhiệm riêng biệt
- Dễ dàng locate và fix bugs
- Tăng tính maintainability

### 🔧 **Better Error Handling**
- Centralized error handling trong từng service
- Consistent logging patterns
- Proper exception propagation

### ⚡ **Performance Improvements** 
- Better caching strategies
- Optimized async operations
- Reduced database calls

### 🧪 **Testability**
- Dễ dàng unit test từng component
- Mock dependencies đơn giản hơn
- Isolated testing environments

### 📈 **Scalability**
- Dễ dàng add tính năng mới
- Horizontal scaling possibilities
- Plugin architecture ready

## Migration Guide

### Existing Code
Không cần thay đổi gì! Tất cả existing imports vẫn hoạt động:

```python
from services.chat_service import send_message_service, get_history_chat_service
# Vẫn work như cũ
```

### New Code (Recommended)
Sử dụng services mới cho code mới:

```python
from services.message_service import MessageService
from services.session_service import SessionService
from services.platform_message_service import PlatformMessageService

# Modern approach
message_service = MessageService(db)
session_service = SessionService(db)
platform_service = PlatformMessageService(db)
```

## Next Steps

1. **Gradually migrate**: Dần dần migrate existing code sang services mới
2. **Add type hints**: Thêm comprehensive type hints
3. **Add unit tests**: Viết tests cho từng service
4. **Performance monitoring**: Monitor performance improvements
5. **Documentation**: Thêm docstrings chi tiết hơn

## File Structure

```
Backend/services/
├── chat_service.py              # Main entry (backward compatibility)
├── platform_message_service.py # Platform messaging
├── session_service.py          # Session management  
├── message_service.py          # Message processing
├── chat_utils.py               # Utility functions
└── README_chat_refactor.md     # This documentation
```