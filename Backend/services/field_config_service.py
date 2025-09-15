from sqlalchemy.orm import Session
from models.field_config import FieldConfig
from config.database import SessionLocal

# --- Create ---
def create_field_config_service(data: dict):
    db = SessionLocal()
    try:
        field_config = FieldConfig(
            thongtinbatbuoc=data.get("thongtinbatbuoc", {}),
            thongtintuychon=data.get("thongtintuychon", {})
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

        # Xoá hết và gán lại với dữ liệu mới
        batbuoc = data.get("thongtinbatbuoc")
        if batbuoc and isinstance(batbuoc, dict):
            field_config.thongtinbatbuoc = batbuoc  # gán trực tiếp

        tuychon = data.get("thongtintuychon")
        if tuychon and isinstance(tuychon, dict):
            field_config.thongtintuychon = tuychon  # gán trực tiếp

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
        return db.query(FieldConfig).all()
    finally:
        db.close()
