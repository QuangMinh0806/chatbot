from config.database import SessionLocal
from models.tag import Tag

def create_tag_service(data: dict):
    db = SessionLocal()
    try:
        tag = Tag(
            name=data.get("name"),
            description=data.get("description")
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)
        return tag
    finally:
        db.close()


def update_tag_service(tag_id: int, data: dict):
    db = SessionLocal()
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            return None
        tag.name = data.get("name", tag.name)
        tag.description = data.get("description", tag.description)
        db.commit()
        db.refresh(tag)
        return tag
    finally:
        db.close()


def delete_tag_service(tag_id: int):
    db = SessionLocal()
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            return None
        db.delete(tag)
        db.commit()
        return tag
    finally:
        db.close()


def get_tag_by_id_service(tag_id: int):
    db = SessionLocal()
    try:
        return db.query(Tag).filter(Tag.id == tag_id).first()
    finally:
        db.close()


def get_all_tags_service():
    db = SessionLocal()
    try:
        return db.query(Tag).all()
    finally:
        db.close()
