# from google import genai
# from google.genai.types import EmbedContentConfig   
# import numpy as np
# from dotenv import load_dotenv
# import os
# # Khởi tạo client chỉ một lần
# load_dotenv()
# client = genai.Client(api_key="AIzaSyAwCH6cLHoqheyQqf9N94Q2ShyE1QWytMM")

# def get_embedding(text: str, dim: int = 3072) -> np.ndarray:
#     if not text or not text.strip():
#         return None
#     # Gửi yêu cầu embed nội dung
#     response = client.models.embed_content(
#         model="gemini-embedding-001",
#         contents=[text],
#         config=EmbedContentConfig(
#             output_dimensionality=dim
#         )
#     )
#     # Kết quả trả về có dạng list của ContentEmbedding
#     embed = response.embeddings[0].values
#     return np.array(embed, dtype=np.float32)
import os
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_embedding(text: str, dim: int = 3072) -> np.ndarray | None:
    if not text or not text.strip():
        return None
    
    response = genai.embed_content(
        model="gemini-embedding-001",  # ✅ đúng tên model
        content=text
    )

    embed = response["embedding"]
    return np.array(embed, dtype=np.float32)
