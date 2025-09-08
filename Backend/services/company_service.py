from sqlalchemy.orm import Session
from models.company import Company
from config.database import SessionLocal

def create_company_service(data: dict):
    db = SessionLocal()
    try:
        company = Company(
            name=data.get("name"),
            description=data.get("description")
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
    finally:
        db.close()


def update_company_service(company_id: int, data: dict):
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return None
        company.name = data.get("name", company.name)
        company.description = data.get("description", company.description)
        db.commit()
        db.refresh(company)
        return company
    finally:
        db.close()


def delete_company_service(company_id: int):
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return None
        db.delete(company)
        db.commit()
        return company
    finally:
        db.close()


def get_company_by_id_service(company_id: int):
    db = SessionLocal()
    try:
        return db.query(Company).filter(Company.id == company_id).first()
    finally:
        db.close()


def get_all_companies_service():
    db = SessionLocal()
    try:
        return db.query(Company).all()
    finally:
        db.close()
