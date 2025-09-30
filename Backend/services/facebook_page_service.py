from sqlalchemy.orm import Session
from models.facebook_page import FacebookPage
from config.database import SessionLocal
import json

def get_all_pages_service(db: Session):
    return db.query(FacebookPage).all()


def create_page_service(data: dict, db: Session):
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


def update_page_service(page_id: int, data: dict, db: Session):
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


def delete_page_service(page_id: int, db: Session):
    page = db.query(FacebookPage).filter(FacebookPage.id == page_id).first()
    if not page:
        return None
    db.delete(page)
    db.commit()
    return True
        
        
def facebook_callback_service(payload: dict, db: Session):
    
    print(payload)
    
    pages = payload.get("data", []) 
    print(pages)
    
    for page in pages:
        page_access_token = page.get("access_token")
        page_id = page.get("id")
        page_name = page.get("name")
        page_category = page.get("category")
        
        
        
        
        existing_page = db.query(FacebookPage).filter(FacebookPage.page_id == page_id).first()
        
        if existing_page:
            existing_page.access_token = page_access_token
            existing_page.page_name = page_name
            db.commit()
            db.refresh(existing_page)
        else:
            new_page = FacebookPage(
                page_id=page_id,
                page_name=page_name,
                access_token=page_access_token,
                category=page_category,
                company_id=1  # cố định company_id
            )
            
            db.add(new_page)
            db.commit()
            db.refresh(new_page)
            
    return db.query(FacebookPage).all()