from sqlalchemy.orm import Session
from models.field_config import FieldConfig
from config.database import SessionLocal

# --- Create ---
def create_field_config_service(data: dict):
    db = SessionLocal()
    try:
        field_config = FieldConfig(
            is_required=data.get("is_required", False),
            excel_column_name=data.get("excel_column_name"),
            excel_column_letter=data.get("excel_column_letter")
        )
        db.add(field_config)
        db.commit()
        db.refresh(field_config)
        return field_config
    finally:
        db.close()


# --- Update ---
def update_field_config_service(config_id: int, data: dict):
    db = SessionLocal()
    try:
        field_config = db.query(FieldConfig).filter(FieldConfig.id == config_id).first()
        if not field_config:
            return None

        # Cập nhật các field mới
        if "is_required" in data:
            field_config.is_required = data["is_required"]
        if "excel_column_name" in data:
            field_config.excel_column_name = data["excel_column_name"]
        if "excel_column_letter" in data:
            field_config.excel_column_letter = data["excel_column_letter"]

        db.commit()
        db.refresh(field_config)
        return field_config
    finally:
        db.close()



# --- Delete ---
def delete_field_config_service(config_id: int):
    db = SessionLocal()
    try:
        field_config = db.query(FieldConfig).filter(FieldConfig.id == config_id).first()
        if not field_config:
            return None
        db.delete(field_config)
        db.commit()
        return field_config
    finally:
        db.close()


# --- Get by ID ---
def get_field_config_by_id_service(config_id: int):
    db = SessionLocal()
    try:
        return db.query(FieldConfig).filter(FieldConfig.id == config_id).first()
    finally:
        db.close()


# --- Get all ---
def get_all_field_configs_service():
    db = SessionLocal()
    try:
        return db.query(FieldConfig).order_by(FieldConfig.excel_column_letter).all()
    finally:
        db.close()
