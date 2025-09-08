from sqlalchemy.orm import Session
from models.facebook_page import FacebookPage

def create_fanpage(db: Session, data: dict):
    fanpage = FacebookPage(**data)
    db.add(fanpage)
    db.commit()
    db.refresh(fanpage)
    return fanpage

def get_all_fanpages(db: Session):
    return db.query(FacebookPage).all()

def get_by_page_id(db: Session, page_id: str):
    return db.query(FacebookPage).filter(FacebookPage.page_id == page_id).first()

def search_fanpages(db: Session, keyword: str):
    return db.query(FacebookPage).filter(FacebookPage.page_name.ilike(f"%{keyword}%")).all()
