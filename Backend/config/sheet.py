import gspread
from google.oauth2.service_account import Credentials
from config.get_embedding import get_embedding_gemini
from models.knowledge_base import DocumentChunk
from config.database import SessionLocal
from sqlalchemy.orm import Session
import json
from langchain.text_splitter import RecursiveCharacterTextSplitter


def insert_chunks(chunks_data: list):
    session: Session = SessionLocal()
    try:
        

        # Chèn từng record một
        for d in chunks_data:
            chunk = DocumentChunk(
                chunk_text=str(d['chunk_text']),
                search_vector=d.get('search_vector'), 
                knowledge_base_id=d['knowledge_base_id']
            )
            session.add(chunk)
            session.commit()  # commit ngay sau mỗi record
    except Exception as e:
        print(e)
        session.rollback()
    finally:
        session.close()


    

def get_sheet(sheet_id: str, id: int):
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
    ]
    session: Session = SessionLocal()
    # Xóa tất cả dữ liệu cũ
    session.query(DocumentChunk).delete()
    session.commit()  # commit để xác nhận bảng trống
    creds = Credentials.from_service_account_file('config/config_sheet.json', scopes=scopes)
    client = gspread.authorize(creds)

    workbook = client.open_by_key(sheet_id)
    worksheets = workbook.worksheets()

    all_chunks = []

    for sheet in worksheets:
        records = sheet.get_all_records()
        
        for row in records:
            # Biến row thành JSON string
            row_str = "{ " + ",".join(
                [f"\"{k}\":\"{v}\"" for k, v in row.items() if v not in ("", None)]
            ) + " }"

            # Nếu hàng quá dài, mới chunk, không cần overlap nhiều
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,   # nhỏ hơn chunk size trước
                chunk_overlap=0   # tránh trộn hàng khác
            )
            row_chunks = splitter.split_text(row_str)
            all_chunks.extend(row_chunks)

    # Tạo vector và lưu
    for chunk in all_chunks:
        vector = get_embedding_gemini(chunk)
        insert_chunks([{
            "chunk_text": chunk,
            "search_vector": vector.tolist(),
            "knowledge_base_id": id
        }])
    
        
        
    