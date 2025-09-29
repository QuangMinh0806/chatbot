from models.chat import ChatSession
from config.database import SessionLocal
from models.tag import Tag

def create_tag_service(data: dict, db):
    tag = Tag(
        name=data.get("name"),
        description=data.get("description"),
        color=data.get("color")
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def update_tag_service(tag_id: int, data: dict, db):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        return None
    tag.name = data.get("name", tag.name)
    tag.description = data.get("description", tag.description)
    tag.color = data.get("color", tag.color)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag_service(tag_id: int, db):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        return None
    db.delete(tag)
    db.commit()
    return tag


def get_tag_by_id_service(tag_id: int, db):
    return db.query(Tag).filter(Tag.id == tag_id).first()


def get_all_tags_service(db):
    return db.query(Tag).all()

def get_tags_by_chat_session_service(chat_session_id: int, db):
    chat_session = db.query(ChatSession).filter(ChatSession.id == chat_session_id).first()
    if not chat_session:
        return None
    return chat_session.tags