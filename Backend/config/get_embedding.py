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
        model="gemini-embedding-001",
        content=text
    )

    embed = response["embedding"]
    return np.array(embed, dtype=np.float32)
