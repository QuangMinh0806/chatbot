from typing import Optional
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, Response, HTTPException, BackgroundTasks
import json
from models.field_config import FieldConfig
from models.chat import CustomerInfo
from sqlalchemy.orm import Session
from config.database import SessionLocal, get_db
import asyncio
router = APIRouter()
from llm.llm import RAGModel
from middleware.jwt import authentication_cookie, authentication
import requests
from fastapi import APIRouter, Request

from config.websocket_manager import ConnectionManager

from controllers.chat_controller import (
    create_session_controller,
    handle_send_message,
    get_history_chat_controller,
    chat_platform,
    get_all_history_chat_controller,
    update_chat_session_controller,
    customer_chat,
    admin_chat,
    delete_chat_session_controller,
    delete_message_controller,
    check_session_controller,
    update_tag_chat_session_controller,
    get_all_customer_controller,
    sendMessage_controller,
    get_dashboard_summary_controller,
)

router = APIRouter(prefix="/chat", tags=["Chat"])

manager = ConnectionManager()

@router.post("/session")
async def create_session(request: Request, db: Session = Depends(get_db)):
    return create_session_controller(db)


@router.get("/session/{sessionId}")
async def check_session(sessionId, db: Session = Depends(get_db)):
    return check_session_controller(sessionId, db)

@router.get("/history/{chat_session_id}")
def get_history_chat(
    chat_session_id: int, 
    page: int = 1, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    return get_history_chat_controller(chat_session_id, page, limit, db)

@router.put("/alert/{session_id}")
def update_alert_status(session_id: int, alert_data: dict, db: Session = Depends(get_db)):
    """Cập nhật trạng thái alert cho chat session"""
    try:
        from models.chat import ChatSession
        
        chat_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        chat_session.alert = alert_data.get("alert", "false")
        db.commit()
        
        return {"success": True, "message": "Alert status updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating alert status: {str(e)}")

@router.websocket("/ws/customer")
async def customer_ws(websocket: WebSocket, db: Session = Depends(get_db)):
    session_id = int(websocket.query_params.get("sessionId"))
    await customer_chat(websocket, session_id, db)

@router.websocket("/ws/admin")
async def admin_ws(websocket: WebSocket, db: Session = Depends(get_db)):
    user=await authentication_cookie(websocket.cookies.get("access_token"))
    await admin_chat(websocket, user, db)

@router.get("/admin/history")
def get_history_chat(db: Session = Depends(get_db)):
    return get_all_history_chat_controller(db)

@router.get("/admin/count_by_channel")
def count_messages_by_channel(db: Session = Depends(get_db)):
    return get_dashboard_summary_controller(db)

@router.get("/admin/customers")
def get_customer_chat(
    channel: Optional[str] = Query(None, description="Lọc theo channel"),
    tag_id: Optional[int] = Query(None, description="Lọc theo tag"),
    db: Session = Depends(get_db)
):
    data = {"channel": channel, "tag_id": tag_id}
    return get_all_customer_controller(data, db)

    
# FB
@router.get("/webhook/fb") 
async def receive_message(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode and token:
        if mode == "subscribe":
            print("WEBHOOK_VERIFIED")
            return Response(content=challenge, media_type="text/plain", status_code=200)
        else:
            return Response(status_code=403)
    return Response(status_code=400)

@router.post("/webhook/fb")
async def receive_message(request: Request):
    body = await request.json()
    print("📨 Facebook webhook body:", body)
    
    
    asyncio.create_task(process_facebook_message(body))
    
    print("Đã trả về phản hồi 200 OK cho Facebook")
    
    return Response(status_code=200)

async def process_facebook_message(body: dict):
    try:
        db = SessionLocal()
        print("🔄 Bắt đầu xử lý tin nhắn Facebook...")
        await chat_platform("fb", body, db)
        db.close()
        print("✅ Hoàn thành xử lý tin nhắn Facebook")
    except Exception as e:
        print(f"❌ Lỗi xử lý tin nhắn Facebook: {e}")

# TELEGRAM_BOT
@router.post("/webhook/telegram") 
async def tele(request: Request, db: Session = Depends(get_db)): 
    data = await request.json()
    
    print(data)
    
    res = await chat_platform("tele", data, db)



ACCESS_TOKEN = "nDX-FjR182R1sdmttSOjAi_GT375iLrzcVW6PV2aD2EJxMLIp_1Z9TlgFa2fhXTHrB4vCfhV9pVjgI5Ogkad6hwk2bNKk5CAcQ0BU-__1YduaHjIhEeXECck7bkQw3y__AmJ8VMs2rE8h08od-LJAuECQ7gLbcP_xjD4DeoI7toTvG8TqFaENPha4WRBkX4VYTiJTDMb71wpvn1YexmN2UFBF1UogsLC_x544vFnOt_OxqunbPLJBiBHJsIeXbCK_yLUPggWMNdCsbmGdfDEQFB4O0JWhJfvykuP5BMiFmJvi7eQbgzTO-B31IglYZbFfjqLFxMVCNRJzZChcUiyJiYjDWZQu6XDjQbJ4kN1TNUNfdCiu-PQLAAEL0grytqKywzSQuBXUZhajt1pey9JBTUlSbQ-w4qj92zeADJP8Yu"

def send_zalo_message(user_id: str, message: str):
    url = "https://openapi.zalo.me/v3.0/oa/message/cs"
    headers = {
        "Content-Type": "application/json",
        "access_token": ACCESS_TOKEN
    }
    payload = {
        "recipient": {"user_id": "7655909298596854389"},
        "message": {"text": "Chào"}
    }
    requests.post(url, headers=headers, json=payload)
    
    print(requests.post(url, headers=headers, json=payload)) 
      
    
# ZALO
@router.post("/zalo/webhook") 
async def zalo(request: Request, db: Session = Depends(get_db)): 
    data = await request.json()
    
    asyncio.create_task(process_zalo_message(data, db))
    
    return Response(status_code=200)  
    
    

async def process_zalo_message(body: dict, db: Session):
    try:
        print("🔄 Bắt đầu xử lý tin nhắn Zalo...")
        await chat_platform("zalo", body, db)
        print("✅ Hoàn thành xử lý tin nhắn Zalo")
    except Exception as e:
        print(f"❌ Lỗi xử lý tin nhắn Zalo: {e}")


@router.patch("/tag/{id}")
async def update_config(id: int, request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return await update_tag_chat_session_controller(id, data, db)



@router.patch("/{id}")
async def update_config(id: int, request: Request, db: Session = Depends(get_db)):
    user = await authentication(request)
    data = await request.json()
    return await update_chat_session_controller(id, data, user, db)

@router.patch("/tag/{id}")
async def update_tag(id: int, request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return await update_tag_chat_session_controller(id, data, db)


@router.delete("/chat_sessions")
async def delete_chat_sessions(request: Request, db: Session = Depends(get_db)):
    body = await request.json()   # nhận JSON từ client
    ids = body.get("ids", [])     # lấy danh sách ids
    return delete_chat_session_controller(ids, db)

@router.delete("/messages/{chatId}")
async def delete_messages(chatId: int, request: Request, db: Session = Depends(get_db)):
    body = await request.json()        # lấy JSON từ body
    ids = body.get("ids", [])          # danh sách id messages
    return delete_message_controller(chatId, ids, db)

@router.post("/send_message")
async def send_message(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return await sendMessage_controller(data, db)