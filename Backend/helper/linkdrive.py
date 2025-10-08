import re

def normalize_drive_links(links):
    """
    Chuyển tất cả link Google Drive sang dạng thumbnail hiển thị được.
    Ví dụ:
    - https://drive.google.com/file/d/<id>/view
    - https://drive.usercontent.google.com/download?id=<id>&export=view
    -> https://drive.google.com/thumbnail?id=<id>&sz=w1000
    """
    normalized = []
    for link in links:
        if not isinstance(link, str):
            continue

        file_id = None

        # /file/d/.../view
        match1 = re.search(r"/d/([^/]+)/", link)
        if match1:
            file_id = match1.group(1)

        # ?id=...
        match2 = re.search(r"[?&]id=([^&]+)", link)
        if match2:
            file_id = match2.group(1)

        # Nếu tìm thấy ID thì chuyển sang link thumbnail
        if file_id:
            normalized.append(f"https://drive.google.com/thumbnail?id={file_id}&sz=w1000")
        else:
            # Nếu không phải link Drive thì giữ nguyên
            normalized.append(link)

    return normalized