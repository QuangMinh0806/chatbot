from services.field_config_service import (
    create_field_config_service,
    update_field_config_service,
    delete_field_config_service,
    get_field_config_by_id_service,
    get_all_field_configs_service
)

# --- Create ---
def create_field_config_controller(data: dict):
    config = create_field_config_service(data)
    return {
        "message": "FieldConfig created",
        "field_config": {
            "id": config.id,
            "is_required": config.is_required,
            "excel_column_name": config.excel_column_name,
            "excel_column_letter": config.excel_column_letter
        }
    }

# --- Update ---
def update_field_config_controller(config_id: int, data: dict):
    config = update_field_config_service(config_id, data)
    if not config:
        return {"message": "FieldConfig not found"}
    return {
        "message": "FieldConfig updated",
        "field_config": {
            "id": config.id,
            "is_required": config.is_required,
            "excel_column_name": config.excel_column_name,
            "excel_column_letter": config.excel_column_letter
        }
    }

# --- Delete ---
def delete_field_config_controller(config_id: int):
    config = delete_field_config_service(config_id)
    if not config:
        return {"message": "FieldConfig not found"}
    return {"message": "FieldConfig deleted", "config_id": config.id}

# --- Get by ID ---
def get_field_config_by_id_controller(config_id: int):
    config = get_field_config_by_id_service(config_id)
    if not config:
        return {"message": "FieldConfig not found"}
    return {
        "id": config.id,
        "is_required": config.is_required,
        "excel_column_name": config.excel_column_name,
        "excel_column_letter": config.excel_column_letter
    }

# --- Get all ---
def get_all_field_configs_controller():
    configs = get_all_field_configs_service()
    # Convert mỗi object FieldConfig sang dict
    return [
        {
            "id": c.id,
            "is_required": c.is_required,
            "excel_column_name": c.excel_column_name,
            "excel_column_letter": c.excel_column_letter
        }
        for c in configs
    ]
