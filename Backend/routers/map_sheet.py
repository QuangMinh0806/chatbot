from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Optional

from requests import Session
from config.database import get_db
from models.chat import CustomerInfo
import gspread
from google.oauth2.service_account import Credentials

router = APIRouter(prefix="/sheets", tags=["Google Sheets"])

# --- Google Sheets setup ---
creds = Credentials.from_service_account_file(
    "/app/config_sheet.json",  # file service account JSON tải từ Google Cloud
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
client = gspread.authorize(creds)

spreadsheet_id = "1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs"
sheet = client.open_by_key(spreadsheet_id).sheet1    

@router.post("/export")
def export_customers(db: Session = Depends(get_db)):
    try:
        from services.field_config_service import get_all_field_configs_service
        
        customers = db.query(CustomerInfo).all()
        
        # Lấy cấu hình cột từ field_config thay vì từ Google Sheets
        field_configs = get_all_field_configs_service(db)
        field_configs.sort(key=lambda x: x.excel_column_letter)  # Sắp xếp theo column letter
        
        if not field_configs:
            return {
                "success": False,
                "count": 0,
                "message": "Chưa có cấu hình cột nào. Hãy thêm cấu hình cột trước khi export."
            }
        
        # Tạo headers cho Google Sheets từ field_config
        headers = [config.excel_column_name for config in field_configs]
        
        # Cập nhật headers lên Google Sheets trước khi export data
        sheet.clear()  # Xóa toàn bộ sheet
        sheet.insert_row(headers, 1)  # Insert header row
        
        rows = []
        
        for customer in customers:
            row = []
            for config in field_configs:
                # Lấy value từ customer_data JSON dựa trên excel_column_name
                value = ""
                if customer.customer_data and isinstance(customer.customer_data, dict):
                    value = str(customer.customer_data.get(config.excel_column_name, ""))
                row.append(value)
            rows.append(row)

        # Chèn dữ liệu nếu có
        if rows:
            sheet.insert_rows(rows, row=2)  # chèn từ hàng thứ 2

        # URL của Google Sheets
        sheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"

        return {
            "success": True,
            "count": len(rows),
            "message": f"Đã export {len(rows)} bản ghi với {len(headers)} cột sang Google Sheets",
            "url": sheet_url,
            "headers": headers
        }
    
    except Exception as e:
        return {
            "success": False,
            "count": 0,
            "message": f"Lỗi khi export: {str(e)}"
        }

def col_name(n: int) -> str:
    name = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        name = chr(65 + r) + name
    return name

@router.get("/mapping", response_model=Dict[str, str])
def get_mapping(db: Session = Depends(get_db)):
    try:
        from services.field_config_service import get_all_field_configs_service
        
        # Lấy mapping từ field_config thay vì từ Google Sheets
        field_configs = get_all_field_configs_service(db)
        
        mapping = {}
        for config in field_configs:
            mapping[config.excel_column_letter] = config.excel_column_name
        
        return mapping
    except Exception as e:
        print(f"Error getting mapping: {e}")
        return {}

@router.put("/mapping")
def update_mapping(new_mapping: Dict[str, str]):
    
    for col, header in new_mapping.items():
        sheet.update(f"{col}1", [[header]])
    
    return {"success": True, "message": "Mapping đã được cập nhật trên Google Sheets"}

@router.post("/test-export")
def test_export_with_sample_data(db: Session = Depends(get_db)):
    """Test export với dữ liệu mẫu"""
    try:
        from services.field_config_service import get_all_field_configs_service
        
        # Lấy cấu hình cột từ field_config
        field_configs = get_all_field_configs_service(db)
        field_configs.sort(key=lambda x: x.excel_column_letter)
        
        if not field_configs:
            return {
                "success": False,
                "message": "Chưa có cấu hình cột nào. Hãy thêm cấu hình cột trước khi test."
            }
        
        # Tạo headers cho Google Sheets
        headers = [config.excel_column_name for config in field_configs]
        
        # Tạo dữ liệu mẫu
        sample_data = []
        for i in range(3):  # Tạo 3 dòng mẫu
            row = []
            for config in field_configs:
                value = f"Mẫu {config.excel_column_name} {i+1}"
                row.append(value)
            sample_data.append(row)
        
        # Clear sheet và insert headers + data
        sheet.clear()
        sheet.insert_row(headers, 1)
        if sample_data:
            sheet.insert_rows(sample_data, row=2)
        
        sheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"
        
        return {
            "success": True,
            "count": len(sample_data),
            "message": f"Đã tạo {len(sample_data)} dòng dữ liệu mẫu với {len(headers)} cột",
            "url": sheet_url,
            "headers": headers,
            "sample_data": sample_data
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Lỗi khi test export: {str(e)}"
        }
