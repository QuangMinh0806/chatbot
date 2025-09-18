import os
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv
import openai
import numpy as np

# Load biến môi trường
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_embedding_gemini(text: str, dim: int = 3072) -> np.ndarray | None:
    if not text or not text.strip():
        return None
    
    response = genai.embed_content(
        model="gemini-embedding-001",
        content=text
    )

    embed = response["embedding"]
    return np.array(embed, dtype=np.float32)






def get_embedding_chatgpt(text: str, dim: int = 3072) -> np.ndarray | None:
    if not text or not text.strip():
        return None
    
    
    api_key="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"
    
    try:
        response = openai.embeddings.create(
            input=text,
            model="text-embedding-3-large",
            api_key=api_key
        )
        embedding = response['data'][0]['embedding']
        return np.array(embedding)
    except Exception as e:
        print(f"Error while generating embedding: {e}")
        return None