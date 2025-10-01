from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from controllers.field_config_controller import (
    create_field_config_controller,
    update_field_config_controller,
    delete_field_config_controller,
    get_field_config_by_id_controller,
    get_all_field_configs_controller
)

router = APIRouter(prefix="/field-configs", tags=["FieldConfigs"])

# --- Create ---
@router.post("/")
async def create_field_config(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return create_field_config_controller(data, db)

# --- Update ---
@router.put("/{config_id}")
async def update_field_config(config_id: int, request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return update_field_config_controller(config_id, data, db)

# --- Delete ---
@router.delete("/{config_id}")
async def delete_field_config(config_id: int, db: Session = Depends(get_db)):
    return delete_field_config_controller(config_id, db)

# --- Get by ID ---
@router.get("/{config_id}")
async def get_field_config_by_id(config_id: int, db: Session = Depends(get_db)):
    return get_field_config_by_id_controller(config_id, db)

# --- Get all ---
@router.get("/")
async def get_all_field_configs(db: Session = Depends(get_db)):
    return get_all_field_configs_controller(db)

# --- Sync to Google Sheets ---
@router.post("/sync-to-sheet")
async def sync_field_configs_to_sheet(db: Session = Depends(get_db)):
    from controllers.field_config_controller import sync_headers_to_sheet
    
    success = sync_headers_to_sheet(db)
    if success:
        return {"message": "Headers synced to Google Sheets successfully", "success": True}
    else:
        return {"message": "Failed to sync headers to Google Sheets", "success": False}
