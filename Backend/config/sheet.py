import gspread
from google.oauth2.service_account import Credentials
from config.get_embedding import get_embedding_gemini
from models.knowledge_base import DocumentChunk
from config.database import SessionLocal
from sqlalchemy.orm import Session
import json
import logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List, Dict, Any
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_chunking_performance(chunks: List[str]) -> Dict[str, Any]:
    """
    Phân tích hiệu suất chunking để tối ưu
    """
    if not chunks:
        return {"status": "empty"}
    
    stats = {
        "total_chunks": len(chunks),
        "avg_length": sum(len(chunk) for chunk in chunks) / len(chunks),
        "min_length": min(len(chunk) for chunk in chunks),
        "max_length": max(len(chunk) for chunk in chunks),
        "size_distribution": {
            "small": len([c for c in chunks if len(c) < 500]),
            "medium": len([c for c in chunks if 500 <= len(c) <= 1200]),
            "large": len([c for c in chunks if len(c) > 1200])
        }
    }
    
    # Đánh giá chất lượng
    quality_score = 0
    if stats["avg_length"] > 300:  # Không quá nhỏ
        quality_score += 25
    if stats["max_length"] < 2000:  # Không quá lớn
        quality_score += 25
    if stats["size_distribution"]["medium"] > stats["total_chunks"] * 0.6:  # Chủ yếu medium size
        quality_score += 25
    if len(set(len(chunk) for chunk in chunks)) > 3:  # Đa dạng về kích thước
        quality_score += 25
    
    stats["quality_score"] = quality_score
    stats["recommendation"] = "Good" if quality_score >= 75 else "Needs optimization" if quality_score >= 50 else "Poor"
    
    return stats

def insert_chunks(chunks_data: List[Dict[str, Any]]) -> bool:
    """
    Chèn chunks vào database với batch processing để tối ưu performance
    """
    if not chunks_data:
        logger.warning("Không có dữ liệu chunk để chèn")
        return False
        
    session: Session = SessionLocal()
    try:
        # Tạo tất cả chunks trong một lần
        chunk_objects = []
        for d in chunks_data:
            if not d.get('chunk_text'):
                logger.warning(f"Bỏ qua chunk rỗng: {d}")
                continue
                
            chunk = DocumentChunk(
                chunk_text=str(d['chunk_text']),
                search_vector=d.get('search_vector'), 
                knowledge_base_id=d['knowledge_base_id']
            )
            chunk_objects.append(chunk)
        
        # Batch insert - hiệu quả hơn nhiều
        if chunk_objects:
            session.add_all(chunk_objects)
            session.commit()
            logger.info(f"Đã chèn thành công {len(chunk_objects)} chunks")
            return True
        else:
            logger.warning("Không có chunk hợp lệ để chèn")
            return False
            
    except Exception as e:
        logger.error(f"Lỗi khi chèn chunks: {str(e)}")
        session.rollback()
        return False
    finally:
        session.close()


def process_sheet_data_optimized(records: List[Dict], sheet_name: str) -> str:
    """
    Xử lý dữ liệu từ một sheet thành text có cấu trúc tối ưu cho chunking
    """
    if not records:
        return ""
    
    # Tạo header rõ ràng hơn
    content = f"THÔNG TIN TỪ SHEET: {sheet_name.upper()}\n"
    content += "=" * (len(content) - 1) + "\n\n"
    
    # Nhóm dữ liệu theo logical sections nếu có thể
    sections = {}
    
    for i, row in enumerate(records, 1):
        # Lọc ra các field có giá trị
        valid_fields = {k: str(v).strip() for k, v in row.items() 
                       if v not in ("", None, 0) and str(v).strip()}
        
        if valid_fields:
            # Tạo section key dựa trên một số field quan trọng
            section_key = "DỮ_LIỆU_CHUNG"
            
            # Nếu có field đặc biệt, tạo section riêng
            for key in valid_fields.keys():
                if any(keyword in key.lower() for keyword in ['category', 'type', 'nhóm', 'loại', 'phân_loại']):
                    section_key = f"NHÓM_{valid_fields[key][:20].upper()}"
                    break
            
            if section_key not in sections:
                sections[section_key] = []
            
            # Format entry tốt hơn
            entry = f"[Mục {i}]\n"
            for key, value in valid_fields.items():
                # Làm sạch và format key-value
                clean_key = key.replace('_', ' ').title()
                entry += f"  • {clean_key}: {value}\n"
            
            sections[section_key].append(entry)
    
    # Combine sections với separator rõ ràng
    final_content = content
    for section_name, entries in sections.items():
        if entries:
            final_content += f"\n--- {section_name} ---\n\n"
            final_content += "\n".join(entries)
            final_content += "\n"
    
    return final_content

def adaptive_chunk_size(content_length: int) -> tuple[int, int]:
    """
    Điều chỉnh chunk size dựa trên độ dài nội dung
    """
    if content_length < 5000:
        return 800, 100   # Nội dung ngắn - chunk nhỏ
    elif content_length < 20000:
        return 1200, 150  # Nội dung trung bình
    else:
        return 1500, 200  # Nội dung dài - chunk lớn hơn

def chunk_text_smart(text: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> List[str]:
    """
    Chia text thành các chunks thông minh với ngữ nghĩa tốt hơn
    """
    if not text or len(text.strip()) == 0:
        return []
    
    # Sử dụng RecursiveCharacterTextSplitter cho kết quả tốt hơn
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=[
            "\n\n",  # Ưu tiên tách theo đoạn văn
            "\n",    # Sau đó tách theo dòng
            ". ",    # Tách theo câu
            "! ",
            "? ",
            "; ",
            ", ",    # Cuối cùng tách theo dấu phẩy
            " ",     # Và khoảng trắng
            ""       # Ký tự đơn lẻ nếu cần thiết
        ]
    )
    
    chunks = text_splitter.split_text(text)
    
    # Filter out empty or very short chunks
    valid_chunks = [chunk.strip() for chunk in chunks if len(chunk.strip()) > 50]
    
    return valid_chunks

def chunk_by_sheet_adaptive(sheet_contents: Dict[str, Dict]) -> List[Dict[str, Any]]:
    """
    Chia chunks theo từng sheet với adaptive sizing và preserve context tốt hơn
    """
    all_chunks = []
    
    for sheet_name, sheet_info in sheet_contents.items():
        content = sheet_info['content']
        chunk_size = sheet_info['chunk_size']
        chunk_overlap = sheet_info['chunk_overlap']
        
        if not content.strip():
            continue
            
        chunks = chunk_text_smart(content, chunk_size, chunk_overlap)
        
        for i, chunk in enumerate(chunks):
            chunk_info = {
                "text": chunk,
                "sheet_name": sheet_name,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "chunk_size_used": chunk_size
            }
            all_chunks.append(chunk_info)
    
    return all_chunks

def get_sheet(sheet_id: str, id: int) -> Dict[str, Any]:
    """
    Lấy dữ liệu từ Google Sheet và xử lý thành chunks
    """
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
    ]
    
    result = {
        "success": False,
        "message": "",
        "chunks_created": 0,
        "sheets_processed": 0
    }
    
    session: Session = SessionLocal()
    try:
        # Kiểm tra file credentials
        credentials_path = 'config/config_sheet.json'
        try:
            creds = Credentials.from_service_account_file(credentials_path, scopes=scopes)
        except FileNotFoundError:
            result["message"] = f"Không tìm thấy file credentials: {credentials_path}"
            return result
        except Exception as e:
            result["message"] = f"Lỗi đọc credentials: {str(e)}"
            return result
        
        # Xóa dữ liệu cũ cho knowledge_base_id này
        deleted_count = session.query(DocumentChunk).filter(
            DocumentChunk.knowledge_base_id == id
        ).delete()
        session.commit()
        logger.info(f"Đã xóa {deleted_count} chunks cũ cho knowledge_base_id={id}")
        
        # Kết nối Google Sheets
        client = gspread.authorize(creds)
        try:
            workbook = client.open_by_key(sheet_id)
        except gspread.SpreadsheetNotFound:
            result["message"] = f"Không tìm thấy Google Sheet với ID: {sheet_id}"
            return result
        except Exception as e:
            result["message"] = f"Lỗi truy cập Google Sheet: {str(e)}"
            return result
        
        worksheets = workbook.worksheets()
        all_content = ""
        
        # Xử lý từng sheet riêng biệt để preserve context
        sheet_contents = {}
        for sheet in worksheets:
            try:
                records = sheet.get_all_records()
                sheet_content = process_sheet_data_optimized(records, sheet.title)
                if sheet_content:
                    # Điều chỉnh chunk size dựa trên nội dung
                    chunk_size, chunk_overlap = adaptive_chunk_size(len(sheet_content))
                    sheet_contents[sheet.title] = {
                        'content': sheet_content,
                        'chunk_size': chunk_size,
                        'chunk_overlap': chunk_overlap
                    }
                    result["sheets_processed"] += 1
                    logger.info(f"Đã xử lý sheet: {sheet.title} ({len(records)} hàng, chunk_size: {chunk_size})")
            except Exception as e:
                logger.error(f"Lỗi xử lý sheet {sheet.title}: {str(e)}")
                continue
        
        if not sheet_contents:
            result["message"] = "Không có dữ liệu hợp lệ trong Google Sheet"
            return result
        
        # Chia thành chunks với context tốt hơn
        start_time = time.time()
        chunk_infos = chunk_by_sheet_adaptive(sheet_contents)
        if not chunk_infos:
            result["message"] = "Không thể tạo chunks từ dữ liệu"
            return result
        
        # Phân tích chất lượng chunking
        all_chunk_texts = [info["text"] for info in chunk_infos]
        chunking_stats = analyze_chunking_performance(all_chunk_texts)
        logger.info(f"Chunking analysis: {chunking_stats}")
        
        # Tạo embeddings và lưu chunks với parallel processing
        chunks_data = []
        embedding_start = time.time()
        for i, chunk_info in enumerate(chunk_infos):
            try:
                vector = get_embedding_gemini(chunk_info["text"])
                if vector is not None:
                    chunks_data.append({
                        "chunk_text": chunk_info["text"],
                        "search_vector": vector.tolist(),
                        "knowledge_base_id": id
                    })
                    if (i + 1) % 10 == 0:  # Log every 10 chunks
                        logger.info(f"Tiến độ embedding: {i+1}/{len(chunk_infos)} "
                                  f"(Sheet: {chunk_info['sheet_name']}, Size: {chunk_info['chunk_size_used']})")
                else:
                    logger.warning(f"Không thể tạo embedding cho chunk {i+1} (Sheet: {chunk_info['sheet_name']})")
            except Exception as e:
                logger.error(f"Lỗi tạo embedding cho chunk {i+1}: {str(e)}")
                continue
        
        embedding_time = time.time() - embedding_start
        logger.info(f"Thời gian tạo embedding: {embedding_time:.2f}s cho {len(chunks_data)} chunks")
        
        # Lưu chunks vào database
        if chunks_data:
            success = insert_chunks(chunks_data)
            if success:
                result["success"] = True
                result["chunks_created"] = len(chunks_data)
                result["message"] = f"Đã xử lý thành công {result['sheets_processed']} sheets và tạo {result['chunks_created']} chunks"
            else:
                result["message"] = "Lỗi khi lưu chunks vào database"
        else:
            result["message"] = "Không thể tạo embeddings cho bất kỳ chunk nào"
            
    except Exception as e:
        logger.error(f"Lỗi không mong muốn: {str(e)}")
        result["message"] = f"Lỗi hệ thống: {str(e)}"
        session.rollback()
    finally:
        session.close()
    
    return result