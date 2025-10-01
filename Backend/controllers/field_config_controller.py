from services.field_config_service import (
    create_field_config_service,
    update_field_config_service,
    delete_field_config_service,
    get_field_config_by_id_service,
    get_all_field_configs_service
)
import gspread
from google.oauth2.service_account import Credentials

# Google Sheets setup
def get_sheet():
    try:
        creds = Credentials.from_service_account_file(
            "config/config_sheet.json",
            scopes=["https://www.googleapis.com/auth/spreadsheets"]
        )
        client = gspread.authorize(creds)
        spreadsheet_id = "1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs"
        return client.open_by_key(spreadsheet_id).sheet1
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None

def sync_headers_to_sheet(db):
    """Đồng bộ headers từ field_config lên Google Sheets"""
    try:
        sheet = get_sheet()
        if not sheet:
            return False
            
        # Lấy tất cả field configs và sắp xếp theo column letter
        configs = get_all_field_configs_service(db)
        configs.sort(key=lambda x: x.excel_column_letter)
        
        # Tạo header row từ field configs
        header_row = [config.excel_column_name for config in configs]
            
        # Clear toàn bộ sheet và insert header mới
        if header_row:
            sheet.clear()  # Xóa toàn bộ sheet
            sheet.insert_row(header_row, 1)  # Insert header row
        
        return True
    except Exception as e:
        print(f"Error syncing headers to sheet: {e}")
        return False

# --- Create ---
def create_field_config_controller(data: dict, db):
    config = create_field_config_service(data, db)
    
    # Tự động sync headers lên Google Sheets
    sync_success = sync_headers_to_sheet(db)
    
    return {
        "message": "FieldConfig created" + (" and synced to Google Sheets" if sync_success else " (sync to Google Sheets failed)"),
        "field_config": {
            "id": config.id,
            "is_required": config.is_required,
            "excel_column_name": config.excel_column_name,
            "excel_column_letter": config.excel_column_letter
        },
        "sheet_synced": sync_success
    }

# --- Update ---
def update_field_config_controller(config_id: int, data: dict, db):
    config = update_field_config_service(config_id, data, db)
    if not config:
        return {"message": "FieldConfig not found"}
    
    # Tự động sync headers lên Google Sheets
    sync_success = sync_headers_to_sheet(db)
    
    return {
        "message": "FieldConfig updated" + (" and synced to Google Sheets" if sync_success else " (sync to Google Sheets failed)"),
        "field_config": {
            "id": config.id,
            "is_required": config.is_required,
            "excel_column_name": config.excel_column_name,
            "excel_column_letter": config.excel_column_letter
        },
        "sheet_synced": sync_success
    }

# --- Delete ---
def delete_field_config_controller(config_id: int, db):
    config = delete_field_config_service(config_id, db)
    if not config:
        return {"message": "FieldConfig not found"}
    
    # Tự động sync headers lên Google Sheets
    sync_success = sync_headers_to_sheet(db)
    
    return {
        "message": "FieldConfig deleted" + (" and synced to Google Sheets" if sync_success else " (sync to Google Sheets failed)"),
        "config_id": config.id,
        "sheet_synced": sync_success
    }

# --- Get by ID ---
def get_field_config_by_id_controller(config_id: int, db):
    config = get_field_config_by_id_service(config_id, db)
    if not config:
        return {"message": "FieldConfig not found"}
    return {
        "id": config.id,
        "is_required": config.is_required,
        "excel_column_name": config.excel_column_name,
        "excel_column_letter": config.excel_column_letter
    }

# --- Get all ---
def get_all_field_configs_controller(db):
    configs = get_all_field_configs_service(db)
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
