import gspread
from google.oauth2.service_account import Credentials
from config.get_embedding import get_embedding
from models.knowledge_base import DocumentChunk
from config.database import SessionLocal
from sqlalchemy.orm import Session
import json
# gsread

def insert_chunks(chunks_data: list):
    session: Session = SessionLocal()
    chunks = []
    for d in chunks_data:
        chunk = DocumentChunk(
            chunk_text=str(d['chunk_text']), 
            search_vector=d.get('search_vector'),  # đảm bảo dùng get để tránh lỗi key
            knowledge_base_id=d['knowledge_base_id']
        )
        chunks.append(chunk)  # append đúng đối tượng

    # session.bulk_save_objects(chunks)
    session.add_all(chunks)
    session.commit()
    session.close()
def get_sheet(sheet_id : str):
    
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
    ]


    creds = Credentials.from_service_account_file('config/config_sheet.json', scopes=scopes)
    client = gspread.authorize(creds)


    workbook = client.open_by_key(sheet_id)



    worksheet  = workbook.worksheets()
    
    data_insert = []
    
    for sheet in worksheet:
        sheet_name = sheet.title
        records = sheet.get_all_records()  
        # Lấy tên cột
        headers = list(records[0].keys())

        # Biến nhớ giá trị trước đó cho từng cột
        last_values = {h: None for h in headers}

        fixed_records = []
        for row in records:
            new_row = {}
            for h in headers:
                if row[h] in ("", None):   # nếu ô rỗng (do merge)
                    new_row[h] = last_values[h]
                else:
                    new_row[h] = row[h]
                    last_values[h] = row[h]
            fixed_records.append(new_row)

        # In ra kết quả đã xử lý
        for row in fixed_records:
            print(row)
            vector = get_embedding(str(row))
            
            data_insert.append({
                "chunk_text": json.dumps(row, ensure_ascii=False),  # chuyển dict thành JSON string
                "search_vector": vector.tolist(),
                "knowledge_base_id": 1
            })
    
    
    
    insert_chunks(data_insert)