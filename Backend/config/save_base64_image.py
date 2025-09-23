import os, imghdr, base64
from datetime import datetime

UPLOAD_DIR = "upload"  # chỉ lưu trong folder upload
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"jpeg", "png", "gif", "bmp", "webp"}
MAX_SIZE = 500 * 1024  # 500KB

def save_base64_image(base64_data: str) -> str:
    if "," in base64_data:
        base64_data = base64_data.split(",", 1)[1]

    img_bytes = base64.b64decode(base64_data)

    if len(img_bytes) > MAX_SIZE:
        raise ValueError("Image size exceeds 500KB")

    timestamp = datetime.now().strftime("%S%M%H%d%m%Y")
    filename = f"{timestamp}.png"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(img_bytes)

    kind = imghdr.what(file_path)
    if kind not in ALLOWED_IMAGE_TYPES:
        os.remove(file_path)
        raise ValueError("Unsupported image type")

    # Trả về URL (public link)
    return f"http://localhost:8000/upload/{filename}"
