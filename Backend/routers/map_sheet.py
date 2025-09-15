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
    "config/config_sheet.json",  # file service account JSON tải từ Google Cloud
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
client = gspread.authorize(creds)

spreadsheet_id = "1eci4KfF4VNQop9j63mnaKys1N3g3gJ3bdWpsgEE4wJs"
sheet = client.open_by_key(spreadsheet_id).sheet1    

@router.post("/export")
def export_customers(db: Session = Depends(get_db)):
    customers = db.query(CustomerInfo).all()
    headers = sheet.row_values(1)  # lấy tiêu đề cột trên Google Sheets

    rows = []
    for c in customers:
        row = []
        for h in headers:
            # key trong customer_data chính là tên cột trên sheet
            value = str(c.customer_data.get(h, ""))  # lấy giá trị, nếu không có trả về ""
            row.append(value)
        rows.append(row)

    if rows:
        sheet.insert_rows(rows, row=2)  # chèn từ hàng thứ 2

    return {
        "success": True,
        "count": len(rows),
        "message": "Đã export dữ liệu sang Google Sheets"
    }

def col_name(n: int) -> str:
    name = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        name = chr(65 + r) + name
    return name

@router.get("/mapping", response_model=Dict[str, str])
def get_mapping():
    headers = sheet.row_values(1) 
    
    mapping = {}
    for i, header in enumerate(headers, start=1):  
        col = col_name(i)
        mapping[col] = header
    
    return mapping

@router.put("/mapping")
def update_mapping(new_mapping: Dict[str, str]):
    
    for col, header in new_mapping.items():
        sheet.update(f"{col}1", [[header]])
    
    return {"success": True, "message": "Mapping đã được cập nhật trên Google Sheets"}
