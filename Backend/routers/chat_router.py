from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Response
import json
from models.chat import CustomerInfo

router = APIRouter()
from llm.llm import RAGModel
from middleware.jwt import authentication

from fastapi import APIRouter, Request

from config.websocket_manager import ConnectionManager

from controllers.chat_controller import (
    create_session_controller,
    handle_send_message,
    get_history_chat_controller,
    chat_fb,
    get_all_history_chat_controller,
    update_chat_session_controller
)

router = APIRouter(prefix="/chat", tags=["Chat"])

manager = ConnectionManager()

@router.post("/session")
async def create_session(request: Request):
    return create_session_controller()

@router.get("/history/{chat_session_id}")
def get_history_chat(chat_session_id: int):
    return get_history_chat_controller(chat_session_id)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user=Depends(authentication)):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data) 
            res= await handle_send_message(data, user)
            if res == -1:
                continue
            await websocket.send_json(res)
            
             # kiểm tra nội dung reply
            bot_reply = res.get("content", "")
            if "em đã ghi nhận thông tin đăng ký" in bot_reply.lower():
                from config.database import SessionLocal
                db = SessionLocal()
                import os
                
                
                rag = RAGModel(db_session=db, gemini_api_key=os.getenv("GOOGLE_API_KEY"))
                
                value = rag.extract_with_ai(chat_session_id=1)
                
                value2 = json.loads(value)
                
                
                customer = CustomerInfo(
                    chat_session_id = res.get("chat_session_id"),
                    full_name       = value2.get("name"),
                    phone_number    = value2.get("phone")
                )
                
                db.add(customer)
                db.commit()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)  


@router.get("/admin/history")
def get_history_chat():
    return get_all_history_chat_controller()



@router.post("/webhook")
async def receive_message(request: Request):
    body = await request.json()
    data = chat_fb(body)
    



@router.get("/webhook") 
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

@router.patch("/{id}")
async def update_config(id: int, request: Request):
    data = await request.json()
    return update_chat_session_controller(id, data)