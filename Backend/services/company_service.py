from sqlalchemy.orm import Session
from models.company import Company
from config.database import SessionLocal

def create_company_service(data: dict, db: Session):
    company = Company(
        name=data.get("name"),
        logo_url=data.get("logo_url"),
        contact=data.get("contact")
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def update_company_service(company_id: int, data: dict, db: Session):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        return None
    company.name = data.get("name", company.name)
    company.logo_url = data.get("logo_url", company.logo_url)
    company.contact = data.get("contact", company.contact)
    db.commit()
    db.refresh(company)
    return company


def delete_company_service(company_id: int, db: Session):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        return None
    db.delete(company)
    db.commit()
    return company


def get_company_by_id_service(company_id: int, db: Session):
    return db.query(Company).filter(Company.id == company_id).first()


def get_all_companies_service(db: Session):
    return db.query(Company).all()
