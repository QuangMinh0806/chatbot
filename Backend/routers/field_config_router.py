from fastapi import APIRouter, Request 
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
async def create_field_config(request: Request):
    data = await request.json()
    return create_field_config_controller(data)

# --- Update ---
@router.put("/{config_id}")
async def update_field_config(config_id: int, request: Request):
    data = await request.json()
    return update_field_config_controller(config_id, data)

# --- Delete ---
@router.delete("/{config_id}")
async def delete_field_config(config_id: int):
    return delete_field_config_controller(config_id)

# --- Get by ID ---
@router.get("/{config_id}")
async def get_field_config_by_id(config_id: int):
    return get_field_config_by_id_controller(config_id)

# --- Get all ---
@router.get("/")
async def get_all_field_configs():
    return get_all_field_configs_controller()
