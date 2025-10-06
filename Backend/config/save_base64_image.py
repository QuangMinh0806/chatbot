import os
import base64
from datetime import datetime
from PIL import Image
import io
from dotenv import load_dotenv
import asyncio

load_dotenv()
URL = os.getenv("URL_BE")

UPLOAD_DIR = "upload"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"jpeg", "png", "gif", "bmp", "webp"}
MAX_SIZE = 500 * 1024  # 500KB


async def save_base64_image(base64_list):
    image_urls = []

    for base64_data in base64_list:
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]

        img_bytes = base64.b64decode(base64_data)

        if len(img_bytes) > MAX_SIZE:
            raise ValueError("Image size exceeds 500KB")

        # Validate image format BEFORE saving
        try:
            with Image.open(io.BytesIO(img_bytes)) as img:
                img_format = img.format.lower()
                if img_format not in ALLOWED_IMAGE_TYPES:
                    raise ValueError("Unsupported image type")
        except Exception as e:
            raise ValueError("Invalid image data") from e

        # Generate file name
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        filename = f"{timestamp}.png"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Write file safely (sync write)
        with open(file_path, "wb") as f:
            f.write(img_bytes)
            f.flush()
            os.fsync(f.fileno())  # 🧱 đảm bảo ghi thực tế vào disk

        # ✅ Chờ file thật sự tồn tại trên hệ thống
        for _ in range(10):
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                break
            await asyncio.sleep(0.1)  # đợi tối đa 1s
        else:
            raise RuntimeError("File not ready after write")

        image_urls.append(f"{URL}/app/upload/{filename}")

    return image_urls
