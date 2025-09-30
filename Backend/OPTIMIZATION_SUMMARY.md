# Tối Ưu Tốc Độ Phản Hồi Tin Nhắn

## Mô tả thay đổi

Đã tối ưu hóa tốc độ phản hồi tin nhắn bằng cách thay đổi cách xử lý từ **xử lý tuần tự** sang **xử lý bất đồng bộ** và **tối ưu database connection pool**.

### Trước khi tối ưu:
1. Nhận tin nhắn từ WebSocket
2. **Lưu tin nhắn vào database** (chậm)
3. Tạo bot response (nếu cần)
4. **Lưu bot response vào database** (chậm)
5. Gửi tin nhắn đến người dùng
6. **Mỗi service function tự tạo SessionLocal()** (gây connection pool limit)

### Sau khi tối ưu:
1. Nhận tin nhắn từ WebSocket
2. **Gửi tin nhắn đến người dùng ngay lập tức** (nhanh)
3. Lưu tin nhắn vào database **bất đồng bộ** (chạy nền)
4. Tạo và gửi bot response **bất đồng bộ** (chạy nền)
5. **Sử dụng chung database session từ router** (tránh connection pool limit)

## Files đã thay đổi

### 1. `controllers/chat_controller.py`
- Thêm import `asyncio`
- Thêm import `send_message_fast_service`
- Cập nhật `customer_chat()` để sử dụng `send_message_fast_service`
- Cập nhật `admin_chat()` để sử dụng `send_message_fast_service`

### 2. `services/chat_service.py`
- Thêm import `asyncio`
- Tạo hàm mới `send_message_fast_service()` - xử lý nhanh, gửi tin nhắn trước
- Cập nhật các hàm async để nhận `db: Session` parameter:
  - `save_message_to_db_async()`
  - `update_session_admin_async()`
  - `send_to_platform_async()`
  - `generate_and_send_bot_response_async()`
- Cập nhật các hàm service để nhận `db: Session` parameter:
  - `update_chat_session()`
  - `update_tag_chat_session()`
  - `update_chat_session_tag()`
- Xóa việc tự tạo `SessionLocal()` trong các hàm async
- Thêm `db.rollback()` trong exception handling

## Lợi ích của việc tối ưu

### 1. Tốc độ phản hồi nhanh hơn
- Tin nhắn được gửi đến người dùng **ngay lập tức**
- Không phải chờ database I/O
- Trải nghiệm người dùng mượt mà hơn

### 2. Hiệu suất hệ thống tốt hơn
- Các task nặng (database, AI) chạy bất đồng bộ
- WebSocket connection không bị block
- Hệ thống có thể xử lý nhiều request đồng thời

### 3. Database connection pool optimization
- **Tránh connection pool limit** - sử dụng chung db session từ router
- **Giảm overhead** tạo/đóng connection
- **Tăng stability** của hệ thống khi có nhiều user
- **Better resource management** - connection được quản lý tập trung

### 4. Cache optimization
- Sử dụng Redis cache để giảm database queries
- Session data được cache để truy cập nhanh hơn

## Cách hoạt động chi tiết

### Customer Chat Flow:
```
WebSocket receive message
        ↓
send_message_fast_service() (sử dụng db từ router)
        ↓
Tạo response ngay lập tức (từ cache/memory)
        ↓
Gửi qua WebSocket Manager → User nhận tin ngay
        ↓
asyncio.create_task() → Lưu DB bất đồng bộ (dùng chung db session)
        ↓
asyncio.create_task() → Tạo bot response bất đồng bộ (dùng chung db session)
```

### Admin Chat Flow:
```
WebSocket receive message
        ↓
send_message_fast_service() (sử dụng db từ router)
        ↓
Tạo response ngay lập tức
        ↓
Gửi qua WebSocket Manager → Customer nhận ngay
        ↓
asyncio.create_task() → Lưu DB bất đồng bộ (dùng chung db session)
        ↓
asyncio.create_task() → Gửi đến platform bất đồng bộ (dùng chung db session)
```

## Lưu ý kỹ thuật

1. **Error Handling**: Mỗi async task có try-catch riêng và `db.rollback()` để tránh crash
2. **Database Session Management**: 
   - **Không tự tạo SessionLocal()** trong async functions
   - **Sử dụng db session được truyền từ router**
   - **Tránh connection pool limit**
3. **Memory Usage**: Tin nhắn được tạo trong memory trước, chỉ lưu DB sau
4. **WebSocket Manager**: Import trong async function để tránh circular import
5. **Transaction Safety**: Sử dụng `db.rollback()` trong exception handling

## Connection Pool Benefits

### Trước khi tối ưu:
```python
# Mỗi function tự tạo connection
def some_function():
    db = SessionLocal()  # Tạo connection mới
    try:
        # ... logic
    finally:
        db.close()       # Đóng connection

# Có thể dẫn đến:
# - Pool exhaustion khi có nhiều request
# - Overhead tạo/đóng connection
# - Deadlock trong một số trường hợp
```

### Sau khi tối ưu:
```python
# Sử dụng chung connection từ router
async def some_function(db: Session):
    try:
        # ... logic sử dụng db
    except Exception as e:
        db.rollback()    # Rollback nếu có lỗi
        
# Lợi ích:
# - Tái sử dụng connection hiệu quả
# - Không bị pool limit
# - Better transaction management
```

## Kết quả mong đợi

- **Giảm latency** từ 200-500ms xuống còn 10-50ms
- **Tăng throughput** xử lý tin nhắn đồng thời
- **Cải thiện UX** với phản hồi tức thì
- **Ổn định hệ thống** khi có nhiều user cùng lúc
- **Tránh connection pool exhaustion**
- **Giảm database load** và connection overhead