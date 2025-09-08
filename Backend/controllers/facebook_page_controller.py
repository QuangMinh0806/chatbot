from sqlalchemy.orm import Session
from services import facebook_page_service

def create_fanpage_controller(db: Session, data: dict):
    return facebook_page_service.create_fanpage(db, data)

def get_all_fanpages_controller(db: Session):
    return facebook_page_service.get_all_fanpages(db)

def get_by_page_id_controller(db: Session, page_id: str):
    return facebook_page_service.get_by_page_id(db, page_id)

def search_fanpages_controller(db: Session, keyword: str):
    return facebook_page_service.search_fanpages(db, keyword)
