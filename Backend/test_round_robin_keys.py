"""
🧪 TEST ROUND-ROBIN API KEYS
==============================
Test hiệu suất hệ thống với 20 người dùng nhắn tin đồng thời.
Kiểm tra:
- Thời gian nhắn tin
- Thời gian bot trả lời
- Thời gian đợi (response time)
- Key đang được sử dụng cho mỗi session
- Phân tải đều giữa các keys

Author: GitHub Copilot
Date: 2025-10-21
"""

import asyncio
import websockets
import json
from datetime import datetime
from typing import List, Dict
import statistics
import aiohttp
import redis.asyncio as aioredis

# ================== CẤU HÌNH ==================
WEBSOCKET_URL = "ws://localhost:8000/chat/ws/customer"
NUM_USERS = 30  # Số lượng người dùng (chạy tuần tự)
TEST_MESSAGE = "Xin chào, tôi muốn tư vấn về sản phẩm của bạn"
BACKEND_URL = "http://localhost:8000"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
SEQUENTIAL_MODE = True  # True = tuần tự (user1 xong mới đến user2), False = song song

# Global tracking
session_to_key_map = {}  # Map session_id -> key_name


class ChatTester:
    """Class để test một người dùng chat"""
    
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.session_id = None
        self.send_time = None
        self.receive_time = None
        self.bot_response = None
        self.key_used = None
        self.wait_time_seconds = None
        
    async def create_session(self) -> int:
        """Tạo chat session mới qua HTTP API"""
        try:
            url_channel = f"test_user_{self.user_id}"
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BACKEND_URL}/chat/session",
                    json={"url_channel": url_channel}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        # API trả về {'id': 123} nên cần extract id
                        if isinstance(result, dict) and 'id' in result:
                            self.session_id = result['id']
                        else:
                            self.session_id = result
                        print(f"✅ User {self.user_id}: Created session {self.session_id}")
                        return self.session_id
                    else:
                        error_text = await response.text()
                        print(f"❌ User {self.user_id}: HTTP {response.status}: {error_text}")
                        raise Exception(f"Failed to create session: {response.status}")
        except Exception as e:
            print(f"❌ User {self.user_id}: Error creating session: {e}")
            raise
    
    async def send_and_receive_message(self):
        """Gửi tin nhắn và nhận phản hồi từ bot qua WebSocket"""
        try:
            # Tạo session trước
            await self.create_session()
            
            # Kết nối WebSocket
            uri = f"{WEBSOCKET_URL}?sessionId={self.session_id}"
            
            async with websockets.connect(uri) as websocket:
                # Ghi nhận thời gian gửi
                self.send_time = datetime.now()
                
                # Gửi tin nhắn
                message_data = {
                    "chat_session_id": self.session_id,
                    "sender_type": "customer",
                    "content": TEST_MESSAGE,
                    "image": []
                }
                
                await websocket.send(json.dumps(message_data))
                print(f"📤 User {self.user_id} (Session {self.session_id}): Sent at {self.send_time.strftime('%H:%M:%S.%f')[:-3]}")
                
                # Nhận phản hồi từ server
                # Đầu tiên nhận echo message của user
                user_echo = await websocket.recv()
                user_echo_data = json.loads(user_echo)
                print(f"📨 User {self.user_id}: Received user echo")
                
                # Sau đó nhận bot response
                bot_response = await asyncio.wait_for(websocket.recv(), timeout=120.0)
                self.receive_time = datetime.now()
                bot_data = json.loads(bot_response)
                
                # Tính thời gian đợi
                self.wait_time_seconds = (self.receive_time - self.send_time).total_seconds()
                self.bot_response = bot_data.get("content", "")[:100] + "..." if len(bot_data.get("content", "")) > 100 else bot_data.get("content", "")
                
                # Lấy key được sử dụng từ Redis
                await self.get_key_used()
                
                print(f"📥 User {self.user_id} (Session {self.session_id}): Received bot response at {self.receive_time.strftime('%H:%M:%S.%f')[:-3]}")
                print(f"⏱️  User {self.user_id}: Wait time = {self.wait_time_seconds:.2f}s, Key = {self.key_used}")
                
        except asyncio.TimeoutError:
            print(f"❌ User {self.user_id} (Session {self.session_id}): Timeout waiting for bot response")
            self.receive_time = datetime.now()
            self.wait_time_seconds = (self.receive_time - self.send_time).total_seconds()
            self.bot_response = "TIMEOUT"
            await self.get_key_used()
        except Exception as e:
            print(f"❌ User {self.user_id} (Session {self.session_id}): Error: {e}")
            import traceback
            traceback.print_exc()
    
    async def get_key_used(self):
        """Lấy thông tin key được sử dụng cho session này từ database"""
        try:
            # Gọi API để query database và lấy key đã dùng
            # Vì key được chọn dựa trên counter toàn cục, ta cần query
            async with aiohttp.ClientSession() as session:
                # Query database để lấy danh sách keys và counter
                redis = await aioredis.from_url(f"redis://{REDIS_HOST}:{REDIS_PORT}")
                
                # Lấy danh sách keys
                keys_cache = await redis.get("llm_keys:llm_id_1")
                
                if keys_cache:
                    try:
                        # Redis có thể lưu dưới dạng pickle hoặc JSON
                        import pickle
                        keys_list = pickle.loads(keys_cache)
                    except:
                        try:
                            keys_list = json.loads(keys_cache.decode() if isinstance(keys_cache, bytes) else keys_cache)
                        except:
                            self.key_used = "Parse error"
                            await redis.close()
                            return
                    
                    # Lấy counter hiện tại  
                    counter_raw = await redis.get("llm_key_global_counter:llm_1")
                    
                    if counter_raw and len(keys_list) > 0:
                        # Counter hiện tại đã được tăng sau mỗi lần sử dụng
                        # Mỗi request tạo ít nhất 2 lần gọi (extract info + generate response)
                        # Nên ta lưu counter trước khi request
                        current_counter = int(counter_raw)
                        
                        # Lưu vào map để tính sau
                        if self.session_id not in session_to_key_map:
                            # Ước tính key dựa trên counter
                            # Do có nhiều request đồng thời, counter sẽ tăng nhanh
                            # Ta chỉ có thể ước tính gần đúng
                            estimated_index = (current_counter - 1) % len(keys_list)
                            key_info = keys_list[estimated_index]
                            self.key_used = key_info['name']
                            session_to_key_map[self.session_id] = self.key_used
                        else:
                            self.key_used = session_to_key_map[self.session_id]
                    else:
                        self.key_used = "No counter"
                else:
                    self.key_used = "No cache"
                
                await redis.close()
                
        except Exception as e:
            self.key_used = f"Error: {str(e)[:20]}"
            import traceback
            traceback.print_exc()
    
    def get_result(self) -> Dict:
        """Trả về kết quả test"""
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "send_time": self.send_time.strftime('%H:%M:%S.%f')[:-3] if self.send_time else None,
            "receive_time": self.receive_time.strftime('%H:%M:%S.%f')[:-3] if self.receive_time else None,
            "wait_time_seconds": round(self.wait_time_seconds, 2) if self.wait_time_seconds else None,
            "bot_response": self.bot_response,
            "key_used": self.key_used
        }


async def get_key_usage_from_logs():
    """
    Parse logs để lấy thông tin key được sử dụng cho mỗi session.
    Trong môi trường thực tế, có thể lưu vào Redis hoặc database.
    """
    # TODO: Implement log parsing hoặc query từ Redis
    # Format log: 🔑 Global Round-Robin: Session 123 → Key 'API_KEY_2' (counter=5, index=0/4)
    return {}


async def run_concurrent_test():
    """Chạy test với nhiều người dùng - tuần tự hoặc song song tùy config"""
    
    print("=" * 80)
    print("🚀 BẮT ĐẦU TEST ROUND-ROBIN API KEYS")
    print("=" * 80)
    print(f"📊 Số lượng người dùng: {NUM_USERS}")
    print(f"💬 Tin nhắn test: {TEST_MESSAGE}")
    print(f"🌐 WebSocket URL: {WEBSOCKET_URL}")
    print(f"🔄 Chế độ: {'TUẦN TỰ (Sequential)' if SEQUENTIAL_MODE else 'SONG SONG (Concurrent)'}")
    print("=" * 80)
    print()
    
    # Tạo danh sách testers
    testers = [ChatTester(user_id=i+1) for i in range(NUM_USERS)]
    
    start_time = datetime.now()
    
    if SEQUENTIAL_MODE:
        # Chạy TUẦN TỰ - user1 xong rồi mới đến user2
        print("🔄 Chạy tuần tự: User 1 → User 2 → ... → User N")
        print()
        
        for i, tester in enumerate(testers, 1):
            print(f"--- Đang chạy User {i}/{NUM_USERS} ---")
            await tester.send_and_receive_message()
            print()
    else:
        # Chạy SONG SONG (code cũ)
        print("🔄 Gửi tin nhắn song song...")
        print()
        
        tasks = [tester.send_and_receive_message() for tester in testers]
        await asyncio.gather(*tasks)
    
    end_time = datetime.now()
    total_time = (end_time - start_time).total_seconds()
    
    # Thu thập kết quả
    results = [tester.get_result() for tester in testers]
    
    # In báo cáo
    print()
    print("=" * 80)
    print("📊 KẾT QUẢ TEST")
    print("=" * 80)
    print()
    
    # Bảng chi tiết
    print("📋 BẢNG CHI TIẾT:")
    print("-" * 120)
    print(f"{'User':<6} {'Session':<10} {'Thời gian gửi':<15} {'Thời gian nhận':<15} {'Đợi (s)':<10} {'Key sử dụng':<15}")
    print("-" * 120)
    
    for result in results:
        user_id = result['user_id'] if result['user_id'] is not None else 'N/A'
        session_id = result['session_id'] if result['session_id'] is not None else 'N/A'
        send_time = result['send_time'] if result['send_time'] is not None else 'N/A'
        receive_time = result['receive_time'] if result['receive_time'] is not None else 'N/A'
        wait_time = result['wait_time_seconds'] if result['wait_time_seconds'] is not None else 'N/A'
        key_used = result['key_used'] if result['key_used'] is not None else 'N/A'
        
        print(f"{str(user_id):<6} "
              f"{str(session_id):<10} "
              f"{str(send_time):<15} "
              f"{str(receive_time):<15} "
              f"{str(wait_time):<10} "
              f"{str(key_used):<15}")
    
    print("-" * 120)
    print()
    
    # Thống kê
    wait_times = [r['wait_time_seconds'] for r in results if r['wait_time_seconds'] is not None]
    successful_responses = len([r for r in results if r['bot_response'] and r['bot_response'] != 'TIMEOUT'])
    
    print("📈 THỐNG KÊ:")
    print(f"  ✅ Tổng số request: {NUM_USERS}")
    print(f"  ✅ Thành công: {successful_responses}/{NUM_USERS} ({successful_responses/NUM_USERS*100:.1f}%)")
    print(f"  ❌ Thất bại: {NUM_USERS - successful_responses}")
    print(f"  ⏱️  Tổng thời gian test: {total_time:.2f}s")
    print()
    
    if wait_times:
        print("⏱️  THỜI GIAN ĐỢI:")
        print(f"  - Trung bình: {statistics.mean(wait_times):.2f}s")
        print(f"  - Nhanh nhất: {min(wait_times):.2f}s")
        print(f"  - Chậm nhất: {max(wait_times):.2f}s")
        print(f"  - Độ lệch chuẩn: {statistics.stdev(wait_times):.2f}s" if len(wait_times) > 1 else "  - Độ lệch chuẩn: N/A")
    print()
    
    # Key usage distribution
    print("🔑 PHÂN BỐ KEY SỬ DỤNG:")
    key_counts = {}
    for result in results:
        key = result['key_used'] or 'Unknown'
        key_counts[key] = key_counts.get(key, 0) + 1
    
    if key_counts.get('Unknown') == NUM_USERS:
        print("  ⚠️  Không thể xác định key từ logs. Vui lòng kiểm tra server logs để xem phân bố key.")
        print("  💡 Tìm dòng log có format: '🔑 Global Round-Robin: Session X → Key ...'")
    else:
        for key, count in sorted(key_counts.items()):
            print(f"  - {key}: {count} requests ({count/NUM_USERS*100:.1f}%)")
    
    print()
    print("=" * 80)
    print("✅ TEST HOÀN TẤT!")
    print("=" * 80)
    
    # Lưu kết quả ra file JSON
    output_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "test_info": {
                "num_users": NUM_USERS,
                "test_message": TEST_MESSAGE,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "total_time_seconds": total_time
            },
            "results": results,
            "statistics": {
                "successful": successful_responses,
                "failed": NUM_USERS - successful_responses,
                "avg_wait_time": statistics.mean(wait_times) if wait_times else None,
                "min_wait_time": min(wait_times) if wait_times else None,
                "max_wait_time": max(wait_times) if wait_times else None,
                "std_wait_time": statistics.stdev(wait_times) if len(wait_times) > 1 else None
            }
        }, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Kết quả đã được lưu vào: {output_file}")
    print()


def main():
    """Main function"""
    try:
        asyncio.run(run_concurrent_test())
    except KeyboardInterrupt:
        print("\n⚠️  Test bị hủy bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi khi chạy test: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║         🧪 TEST ROUND-ROBIN API KEYS                        ║
    ║                                                              ║
    ║  Mục đích: Test hiệu suất hệ thống với 30 users tuần tự     ║
    ║  Kiểm tra: Thời gian response, phân tải key                 ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    print("⚙️  YÊU CẦU:")
    print("  1. Backend server đang chạy ở http://localhost:8000")
    print("  2. Redis đang chạy")
    print("  3. Có 5 API keys trong bảng llm_key")
    print()
    print("� Bắt đầu test...")
    print()
    
    main()
