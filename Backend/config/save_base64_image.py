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
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex}.png"
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
            for _ in range(10):
                if os.path.exists(final_path) and os.path.getsize(final_path) > 0:
                    break
                await asyncio.sleep(0.05)
            else:
                raise RuntimeError(f"File not ready after save: {filename}")

            # 7️⃣ Đợi web server (nginx / static) sync watcher
            await asyncio.sleep(0.3)  # 300ms là đủ trong hầu hết trường hợp

            # 8️⃣ Tạo URL trả về
            image_url = f"{URL}/app/upload/{filename}"
            image_urls.append(image_url)

            print(f"✅ Image saved and ready: {image_url}")

        except Exception as e:
            print(f"❌ Error saving image: {e}")
            continue

    return image_urls
