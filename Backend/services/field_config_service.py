from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.field_config import FieldConfig
from llm.llm import RAGModel

# Helper function to clear cache
def _clear_cache():
    try:
        RAGModel.clear_field_configs_cache()
    except Exception as e:
        print(f"Lỗi khi xóa cache field configs: {str(e)}")

# --- Create ---
async def create_field_config_service(data: dict, db: AsyncSession):
    field_config = FieldConfig(
        is_required=data.get("is_required", False),
        excel_column_name=data.get("excel_column_name"),
        excel_column_letter=data.get("excel_column_letter")
    )
    db.add(field_config)
    await db.commit()
    await db.refresh(field_config)
    
    _clear_cache()
    
    return field_config

# --- Update ---
async def update_field_config_service(config_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(FieldConfig).filter(FieldConfig.id == config_id))
    field_config = result.scalar_one_or_none()
    if not field_config:
        return None
    
    if "is_required" in data:
        field_config.is_required = data["is_required"]
    if "excel_column_name" in data:
        field_config.excel_column_name = data["excel_column_name"]
    if "excel_column_letter" in data:
        field_config.excel_column_letter = data["excel_column_letter"]

    await db.commit()
    await db.refresh(field_config)
    
    _clear_cache()
    
    return field_config

# --- Delete ---
async def delete_field_config_service(config_id: int, db: AsyncSession):
    result = await db.execute(select(FieldConfig).filter(FieldConfig.id == config_id))
    field_config = result.scalar_one_or_none()
    if not field_config:
        return None
    await db.delete(field_config)
    await db.commit()
    
    # Xóa cache field configs sau khi xóa
    _clear_cache()
    
    return field_config


# --- Get by ID ---
async def get_field_config_by_id_service(config_id: int, db: AsyncSession):
    result = await db.execute(select(FieldConfig).filter(FieldConfig.id == config_id))
    return result.scalar_one_or_none()

# --- Get all ---
async def get_all_field_configs_service(db: AsyncSession):
    result = await db.execute(select(FieldConfig).order_by(FieldConfig.excel_column_letter))
    return result.scalars().all()