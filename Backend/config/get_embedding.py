from sentence_transformers import SentenceTransformer
import numpy as np

# Load model toàn cục (chỉ load 1 lần cho nhanh)
embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def get_embedding(text: str) -> np.ndarray:
    
    if not text or not text.strip():
        return None
    embedding = embedding_model.encode(text, convert_to_numpy=True)
    return embedding


# print(get_embedding("hello"))