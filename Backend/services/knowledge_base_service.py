from sqlalchemy.orm import Session
from models.knowledge_base import KnowledgeBase, DocumentChunk
from config.generate_embedding import generate_embedding


# Hàm chunk văn bản thành từng đoạn
def chunk_text(text: str, chunk_size: int = 200) -> list[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
    return chunks


def create_knowledge_base(db: Session, data: dict):
    # Tạo KnowledgeBase
    kb = KnowledgeBase(
        title=data["title"],
        content=data["content"],
        source=data.get("source", "manual"),
        category=data.get("category", "general"),
        is_active=data.get("is_active", True),
    )
    db.add(kb)
    db.commit()
    db.refresh(kb)

    # Chunk content và tạo DocumentChunk
    chunks = chunk_text(kb.content)
    for chunk in chunks:
        vector = generate_embedding(chunk)
        db.add(DocumentChunk(chunk_text=chunk, knowledge_base_id=kb.id, embedding=vector))
    db.commit()

    return kb


def update_knowledge_base(db: Session, kb_id: int, data: dict):
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        return None

    # Update fields
    kb.title = data.get("title", kb.title)
    kb.content = data.get("content", kb.content)
    kb.source = data.get("source", kb.source)
    kb.category = data.get("category", kb.category)
    kb.is_active = data.get("is_active", kb.is_active)

    db.commit()
    db.refresh(kb)

    # Xóa DocumentChunk cũ
    db.query(DocumentChunk).filter(DocumentChunk.knowledge_base_id == kb.id).delete()
    db.commit()

    # Chunk lại content và thêm DocumentChunk mới
    chunks = chunk_text(kb.content)
    for chunk in chunks:
        vector = generate_embedding(chunk)
        
        db.add(DocumentChunk(chunk_text=chunk, knowledge_base_id=kb.id, embedding=vector))
    db.commit()

    return kb


def get_all_knowledge_bases(db: Session):
    return db.query(KnowledgeBase).all()


def get_knowledge_base_by_id(db: Session, kb_id: int):
    return db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
