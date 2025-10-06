import os
import base64
from datetime import datetime
from PIL import Image
import io
from dotenv import load_dotenv
import asyncio
import uuid

load_dotenv()
URL = os.getenv("URL_BE")

UPLOAD_DIR = "upload"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"jpeg", "png", "gif", "bmp", "webp"}


async def save_base64_image(base64_list):
    image_urls = []

    # ✅ Nếu FE gửi 1 ảnh dạng string → chuyển thành list
    if isinstance(base64_list, str):
        base64_list = [base64_list]

    for base64_data in base64_list:
        try:
            # 1️⃣ Loại bỏ prefix base64 nếu có (data:image/png;base64,...)
            if "," in base64_data:
                base64_data = base64_data.split(",", 1)[1]

            img_bytes = base64.b64decode(base64_data)

            # 2️⃣ Kiểm tra định dạng ảnh hợp lệ
            with Image.open(io.BytesIO(img_bytes)) as img:
                img_format = img.format.lower()
                if img_format not in ALLOWED_IMAGE_TYPES:
                    raise ValueError(f"Unsupported image type: {img_format}")

            # 3️⃣ Tạo tên file duy nhất
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
            final_path = os.path.join(UPLOAD_DIR, filename)
            temp_path = final_path + ".tmp"

            # 4️⃣ Ghi file tạm, flush và fsync để đảm bảo thực sự lưu xuống disk
            with open(temp_path, "wb") as f:
                f.write(img_bytes)
                f.flush()
                os.fsync(f.fileno())

            # 5️⃣ Đổi tên file atomically (ngay lập tức, tránh đọc file dở dang)
            os.replace(temp_path, final_path)

            # 6️⃣ Đợi OS xác nhận file có thể đọc
            for _ in range(20):  # Tăng số lần retry
                if os.path.exists(final_path) and os.path.getsize(final_path) > 0:
                    break
                await asyncio.sleep(0.05)
            else:
                raise RuntimeError(f"File not ready after save: {filename}")

            # 7️⃣ Đợi web server (nginx / static) sync watcher - QUAN TRỌNG cho Zalo
            await asyncio.sleep(0.5)  # Tăng lên 500ms để đảm bảo file thực sự accessible

            # 8️⃣ Tạo URL trả về
            image_url = f"{URL}/app/upload/{filename}"
            
            # 9️⃣ Verify URL có thể truy cập được (quan trọng cho Zalo)
            import requests
            url_accessible = False
            for attempt in range(5):  # Thử 5 lần
                try:
                    head_resp = requests.head(image_url, timeout=2)
                    if head_resp.status_code == 200:
                        url_accessible = True
                        print(f"✅ Image URL verified accessible: {image_url}")
                        break
                    else:
                        print(f"⚠️ Attempt {attempt+1}: URL returned {head_resp.status_code}")
                except Exception as verify_err:
                    print(f"⚠️ Attempt {attempt+1}: Cannot verify URL - {verify_err}")
                
                await asyncio.sleep(0.2)  # Đợi 200ms trước khi retry
            
            if not url_accessible:
                print(f"⚠️ WARNING: Image URL may not be accessible yet: {image_url}")
            
            image_urls.append(image_url)

            print(f"✅ Image saved and ready: {image_url}")

        except Exception as e:
            print(f"❌ Error saving image: {e}")
            continue

    return image_urls
