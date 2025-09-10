from sqlalchemy.orm import Session
from models.facebook_page import FacebookPage
from config.database import SessionLocal

def get_all_pages_service():
    db = SessionLocal()
    try:
        return db.query(FacebookPage).all()
    finally:
        db.close()


def create_page_service(data: dict):
    db = SessionLocal()
    try:
        page = FacebookPage(
            page_id=data["page_id"],
            page_name=data["page_name"],
            access_token=data["access_token"],
            webhook_verify_token=data.get("webhook_verify_token"),
            is_active=data.get("is_active", True),
            auto_response_enabled=data.get("auto_response_enabled", True),
            description=data.get("description"),
            category=data.get("category"),
            avatar_url=data.get("avatar_url"),
            cover_url=data.get("cover_url"),
            company_id=1  # cố định company_id
        )
        db.add(page)
        db.commit()
        db.refresh(page)
        return page
    finally:
        db.close()


def update_page_service(page_id: int, data: dict):
    db = SessionLocal()
    try:
        page = db.query(FacebookPage).filter(FacebookPage.id == page_id).first()
        if not page:
            return None
        
        page.page_name = data.get("page_name", page.page_name)
        page.access_token = data.get("access_token", page.access_token)
        page.webhook_verify_token = data.get("webhook_verify_token", page.webhook_verify_token)
        page.is_active = data.get("is_active", page.is_active)
        page.auto_response_enabled = data.get("auto_response_enabled", page.auto_response_enabled)
        page.description = data.get("description", page.description)
        page.category = data.get("category", page.category)
        page.avatar_url = data.get("avatar_url", page.avatar_url)
        page.cover_url = data.get("cover_url", page.cover_url)
        page.company_id = 1  

        db.commit()
        db.refresh(page)
        return page
    finally:
        db.close()


def delete_page_service(page_id: int):
    db = SessionLocal()
    try:
        page = db.query(FacebookPage).filter(FacebookPage.id == page_id).first()
        if not page:
            return None
        db.delete(page)
        db.commit()
        return True
    finally:
        db.close()
