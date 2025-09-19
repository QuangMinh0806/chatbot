import os
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv
from openai import OpenAI
import numpy as np

# Load biến môi trường
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_embedding_gemini(text: str) -> np.ndarray | None:
    if not text or not text.strip():
        return None
    
    response = genai.embed_content(
        model="gemini-embedding-001",
        content=text
    )

    embed = response["embedding"]
    return np.array(embed, dtype=np.float32)






def get_embedding_chatgpt(text: str) -> np.ndarray | None:
    if not text or not text.strip():
        return None
    
    client = OpenAI(api_key=os.getenv("GPT_KEY"))
    
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=text
    )

    return np.array(response.data[0].embedding)