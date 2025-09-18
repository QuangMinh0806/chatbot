import gspread
from google.oauth2.service_account import Credentials
from config.get_embedding import get_embedding
from models.knowledge_base import DocumentChunk
from config.database import SessionLocal
from sqlalchemy.orm import Session
import json
# gsread

# def insert_chunks(chunks_data: list):
#     session: Session = SessionLocal()
#     chunks = []
#     for d in chunks_data:
#         chunk = DocumentChunk(
#             chunk_text=str(d['chunk_text']),
#             question=str(d['question']),
#             search_vector=d.get('search_vector'),  # đảm bảo dùng get để tránh lỗi key
#             knowledge_base_id=d['knowledge_base_id']
#         )
#         chunks.append(chunk)  # append đúng đối tượng

#     # session.bulk_save_objects(chunks)
#     session.add_all(chunks)
#     session.commit()
#     session.close()
def insert_chunks(chunks_data: list):
    session: Session = SessionLocal()
    try:
        

        # Chèn từng record một
        for d in chunks_data:
            chunk = DocumentChunk(
                chunk_text=str(d['chunk_text']),
                question=str(d['question']),
                search_vector=d.get('search_vector'), 
                knowledge_base_id=d['knowledge_base_id']
            )
            session.add(chunk)
            session.commit()  # commit ngay sau mỗi record
    except Exception as e:
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
    worksheet = workbook.worksheets()
    
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
            # Cột A luôn là câu hỏi
            question = row[headers[0]]

            print(question)
            # Các cột còn lại là dữ liệu trả lời
            answer_data = {h: row[h] for h in headers[1:]}

            # Tạo vector từ câu hỏi
            vector = get_embedding(str(question))
            
            insert_chunks([{
                "chunk_text": json.dumps(answer_data, ensure_ascii=False), 
                "search_vector": vector.tolist(),
                "knowledge_base_id": id,
                "question": question
            }])