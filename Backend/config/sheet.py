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
    creds = Credentials.from_service_account_file('/app/config_sheet.json', scopes=scopes)
    client = gspread.authorize(creds)

    workbook = client.open_by_key(sheet_id)
    worksheet = workbook.worksheets()
    
    all_data = []



    for sheet in worksheet:

        records = sheet.get_all_records()

        for row in records:
            row_str = ",".join(
                [f"\"{k}\":\"{v}\"" for k, v in row.items() if v not in ("", None)]
            )

            if row_str: 
                all_data.append(row_str + ",") 

        
    result = "{ " + "".join(all_data) + " }"
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = splitter.split_text(result)
    
    for chunk in chunks:
        vector = get_embedding_gemini(str(chunk ))
        
        insert_chunks([{
            "chunk_text": chunk, 
            "search_vector": vector.tolist(),
            "knowledge_base_id": id
        }])



    
        
        
    