"""
🧪 Test script để kiểm tra xem nhiều users có bị chặn nhau không

Chạy script này để test:
1. User A và B gửi tin nhắn đồng thời
2. Đo thời gian response
3. Kiểm tra có blocking không

Usage:
    python test_concurrent_users.py
"""

import asyncio
import aiohttp
import time
from datetime import datetime

# ===== CẤU HÌNH =====
BASE_URL = "http://localhost:8000"  # Thay đổi nếu server chạy port khác
WS_URL = "ws://localhost:8000"


async def create_session(session_name: str) -> int:
    """Tạo chat session mới"""
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{BASE_URL}/chat/session") as resp:
            data = await resp.json()
            session_id = data.get("id")
            print(f"✅ [{session_name}] Created session ID: {session_id}")
            return session_id


async def send_message_via_websocket(user_name: str, session_id: int, message: str, delay: float = 0):
    """
    Gửi tin nhắn qua WebSocket và đo thời gian response
    
    Args:
        user_name: Tên user (A, B, C...)
        session_id: ID của chat session
        message: Nội dung tin nhắn
        delay: Độ trễ trước khi gửi (giây)
    """
    await asyncio.sleep(delay)
    
    start_time = time.time()
    print(f"⏰ [{user_name}] {datetime.now().strftime('%H:%M:%S.%f')[:-3]} - Bắt đầu gửi: '{message}'")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(f"{WS_URL}/chat/ws/customer?sessionId={session_id}") as ws:
                
                # Gửi tin nhắn
                send_time = time.time()
                await ws.send_json({
                    "chat_session_id": session_id,
                    "sender_type": "customer",
                    "content": message
                })
                
                # Đợi echo message (customer message)
                echo_received = False
                bot_received = False
                echo_time = None
                bot_time = None
                
                # Timeout sau 15 giây
                timeout = 15
                start_wait = time.time()
                
                while time.time() - start_wait < timeout:
                    try:
                        msg = await asyncio.wait_for(ws.receive_json(), timeout=1.0)
                        
                        if not echo_received:
                            echo_time = time.time()
                            echo_elapsed = (echo_time - send_time) * 1000
                            print(f"📩 [{user_name}] {datetime.now().strftime('%H:%M:%S.%f')[:-3]} - Nhận echo ({echo_elapsed:.0f}ms): '{msg.get('content', '')[:50]}'")
                            echo_received = True
                        
                        # Check nếu là bot response
                        if msg.get('sender_type') == 'bot':
                            bot_time = time.time()
                            bot_elapsed = (bot_time - send_time) * 1000
                            print(f"🤖 [{user_name}] {datetime.now().strftime('%H:%M:%S.%f')[:-3]} - Nhận bot ({bot_elapsed:.0f}ms): '{msg.get('content', '')[:50]}'")
                            bot_received = True
                            break
                            
                    except asyncio.TimeoutError:
                        if echo_received:
                            # Đã nhận echo, đang đợi bot
                            continue
                        else:
                            break
                
                end_time = time.time()
                total_elapsed = (end_time - start_time) * 1000
                
                if not echo_received:
                    print(f"❌ [{user_name}] TIMEOUT - Không nhận được echo sau {timeout}s")
                elif not bot_received:
                    print(f"⚠️ [{user_name}] Chỉ nhận echo, chưa có bot response sau {timeout}s")
                else:
                    print(f"✅ [{user_name}] Hoàn tất trong {total_elapsed:.0f}ms")
                
                return {
                    "user": user_name,
                    "echo_time": echo_time,
                    "bot_time": bot_time,
                    "total_time": total_elapsed,
                    "success": bot_received
                }
                
    except Exception as e:
        print(f"❌ [{user_name}] Lỗi: {e}")
        return {
            "user": user_name,
            "error": str(e),
            "success": False
        }


async def test_concurrent_users(num_users: int = 10):
    """
    Test chính: Nhiều users gửi tin nhắn đồng thời
    
    Args:
        num_users: Số lượng users để test (mặc định 10)
    """
    print("\n" + "="*70)
    print(f"🧪 TEST: {num_users} USERS GỬI TIN NHẮN ĐỒNG THỜI")
    print("="*70 + "\n")
    
    # Bước 1: Tạo sessions
    print(f"📝 Bước 1: Tạo {num_users} chat sessions...\n")
    sessions = []
    user_names = []
    
    for i in range(num_users):
        user_name = f"User {i+1}"
        session_id = await create_session(user_name)
        sessions.append(session_id)
        user_names.append(user_name)
        await asyncio.sleep(0.1)  # Tránh quá tải server khi tạo session
    
    print("\n" + "-"*70 + "\n")
    
    # Bước 2: Gửi tin nhắn với delay ngẫu nhiên
    print(f"🚀 Bước 2: {num_users} users gửi tin nhắn đồng thời (với delay ngẫu nhiên):\n")
    
    tasks = []
    for i in range(num_users):
        user_name = user_names[i]
        session_id = sessions[i]
        message = f"Xin chào, tôi là {user_name}"
        delay = i * 0.5  # Delay 0s, 0.5s, 1s, 1.5s, ...
        
        print(f"   - {user_name}: delay {delay}s")
        tasks.append(
            send_message_via_websocket(user_name, session_id, message, delay=delay)
        )
    
    print()
    
    # Đo thời gian xử lý
    start_time = time.time()
    results = await asyncio.gather(*tasks)
    total_time = (time.time() - start_time) * 1000
    
    # Bước 3: Phân tích kết quả
    print("\n" + "-"*70)
    print("\n📊 KẾT QUẢ PHÂN TÍCH:\n")
    
    success_count = sum(1 for r in results if r.get("success"))
    echo_times = [r["total_time"] for r in results if r.get("success")]
    
    for result in results:
        if result.get("success"):
            user = result["user"]
            total = result["total_time"]
            print(f"✅ {user}: Hoàn thành trong {total:.0f}ms")
        else:
            user = result["user"]
            print(f"❌ {user}: Thất bại - {result.get('error', 'Unknown')}")
    
    print("\n" + "-"*70)
    print(f"\n📈 THỐNG KÊ:")
    print(f"   - Tổng thời gian: {total_time:.0f}ms")
    print(f"   - Users thành công: {success_count}/{num_users}")
    
    if echo_times:
        avg_time = sum(echo_times) / len(echo_times)
        min_time = min(echo_times)
        max_time = max(echo_times)
        print(f"   - Thời gian trung bình: {avg_time:.0f}ms")
        print(f"   - Nhanh nhất: {min_time:.0f}ms")
        print(f"   - Chậm nhất: {max_time:.0f}ms")
    
    print("\n" + "-"*70)
    
    if success_count == num_users:
        print(f"\n🎉 PASS: Tất cả {num_users} users xử lý SONG SONG thành công!")
        print("✅ Không có blocking giữa các users")
    elif success_count >= num_users * 0.8:
        print(f"\n⚠️ PARTIAL: {success_count}/{num_users} users thành công ({success_count*100//num_users}%)")
        print("⚠️ Có thể có vấn đề về blocking hoặc timeout")
    else:
        print(f"\n❌ FAIL: Chỉ {success_count}/{num_users} users hoàn thành")
        print("❌ Có vấn đề nghiêm trọng với server")
    
    print("\n" + "="*70 + "\n")


async def test_sequential_vs_concurrent():
    """
    So sánh thời gian xử lý tuần tự vs đồng thời
    """
    print("\n" + "="*70)
    print("🧪 TEST: SO SÁNH XỬ LÝ TUẦN TỰ VS ĐỒNG THỜI")
    print("="*70 + "\n")
    
    # Tạo sessions
    session_a = await create_session("User A")
    session_b = await create_session("User B")
    
    # Test 1: Tuần tự
    print("\n📝 Test 1: Xử lý TUẦN TỰ (User A → User B)\n")
    start_sequential = time.time()
    
    await send_message_via_websocket("User A", session_a, "Test tuần tự - A")
    await send_message_via_websocket("User B", session_b, "Test tuần tự - B")
    
    time_sequential = (time.time() - start_sequential) * 1000
    print(f"\n⏱️ Tổng thời gian tuần tự: {time_sequential:.0f}ms\n")
    
    await asyncio.sleep(2)  # Đợi bot xử lý xong
    
    # Test 2: Đồng thời
    print("-"*70)
    print("\n📝 Test 2: Xử lý ĐỒNG THỜI (User A || User B)\n")
    start_concurrent = time.time()
    
    await asyncio.gather(
        send_message_via_websocket("User A", session_a, "Test đồng thời - A"),
        send_message_via_websocket("User B", session_b, "Test đồng thời - B"),
    )
    
    time_concurrent = (time.time() - start_concurrent) * 1000
    print(f"\n⏱️ Tổng thời gian đồng thời: {time_concurrent:.0f}ms\n")
    
    # So sánh
    print("-"*70)
    print("\n📊 SO SÁNH:\n")
    print(f"Tuần tự:   {time_sequential:.0f}ms")
    print(f"Đồng thời: {time_concurrent:.0f}ms")
    
    if time_concurrent < time_sequential * 0.7:
        improvement = ((time_sequential - time_concurrent) / time_sequential) * 100
        print(f"\n✅ Cải thiện: {improvement:.0f}% nhanh hơn khi xử lý đồng thời!")
        print("✅ Users KHÔNG bị chặn nhau")
    else:
        print("\n⚠️ Thời gian đồng thời không cải thiện nhiều")
        print("⚠️ Có thể có blocking trong code")
    
    print("\n" + "="*70 + "\n")


async def test_admin_blocks_bot():
    """
    Test admin nhắn → bot phải im lặng 1 giờ
    """
    print("\n" + "="*70)
    print("🧪 TEST: ADMIN NHẮN → BOT IM LẶNG 1 GIỜ")
    print("="*70 + "\n")
    
    # Tạo session
    session_id = await create_session("Customer")
    
    # Bước 1: Customer gửi tin nhắn
    print("📝 Bước 1: Customer gửi tin nhắn...\n")
    await send_message_via_websocket("Customer", session_id, "Xin chào")
    
    await asyncio.sleep(4)  # Đợi bot reply
    
    # Bước 2: Admin nhắn (cần implement - hiện tại skip)
    print("\n📝 Bước 2: Admin nhắn tin (cần admin WebSocket - skip trong test này)...\n")
    print("⚠️ Để test admin, cần có admin token và admin WebSocket")
    print("⚠️ Bạn có thể test thủ công bằng cách:")
    print("   1. Login admin vào web")
    print("   2. Admin gửi tin nhắn")
    print("   3. Customer gửi tin nhắn tiếp")
    print("   4. Kiểm tra bot có reply không\n")
    
    print("="*70 + "\n")


async def main():
    """Main function - chạy tất cả tests"""
    print("\n" + "🎯 " + "="*66 + " 🎯")
    print("  CHATBOT CONCURRENT USERS TEST SUITE")
    print("🎯 " + "="*66 + " 🎯\n")
    
    try:
        # Test 1: Concurrent users với 10 người
        await test_concurrent_users(num_users=10)
        
        await asyncio.sleep(2)
        
        # Test 2: Sequential vs Concurrent
        await test_sequential_vs_concurrent()
        
        await asyncio.sleep(2)
        
        # Test 3: Admin blocks bot
        await test_admin_blocks_bot()
        
    except Exception as e:
        print(f"\n❌ Lỗi chung: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n🚀 Khởi động test suite...\n")
    print("⚙️ Đảm bảo server đang chạy tại http://localhost:8000\n")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️ Test bị dừng bởi user (Ctrl+C)")
    
    print("\n✨ Test suite hoàn tất!\n")
