from sqlalchemy.orm import Session
from models import Company, Config
from datetime import datetime

def get_config_by_company(db: Session, company_id: int):
    return db.query(Config).filter(Config.company_id == company_id).first()


def update_config(db: Session, company_id: int, new_status: str):
    config = db.query(Config).filter(Config.company_id == company_id).first()
    if not config:
        return None

    config.status = new_status
    config.time = datetime.utcnow()

    db.commit()
    db.refresh(config)
    return config
