from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import SessionLocal
from services.config_service import get_config_by_company, update_config

def read_config(id: int):
    config = get_config_by_company(id)
    if not config:
        return {"message": "Not Found"}
    return {
        "id": config.id,
        "status": config.status,
        "time": config.time,
        "company_id": config.company_id,
    }


def update_config_status(id: int, data: dict):
    config = update_config(id, data)
    if not config:
        return {"message": "Not Found"}
    return {
        "id": config.id,
        "status": config.status,
        "time": config.time,
        "company_id": config.company_id,
    }
