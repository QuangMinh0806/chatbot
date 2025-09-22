from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Response
import json
from models.field_config import FieldConfig
from models.chat import CustomerInfo
from fastapi.responses import FileResponse
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
    delete_message_controller
)

router = APIRouter(prefix="/chat", tags=["Chat"])

manager = ConnectionManager()

@router.post("/session")
async def create_session(request: Request):
    return create_session_controller()


@router.get("/session/{sessionId}")
async def check_session(sessionId):
    return check_session_controller(sessionId)

@router.get("/history/{chat_session_id}")
def get_history_chat(chat_session_id: int):
    return get_history_chat_controller(chat_session_id)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    user=await authentication_cookie(websocket.cookies.get("access_token"))
    
    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data)
            await manager.broadcast(data) 
            
            res= await handle_send_message(websocket, data, user)
            
            print(res)
            if res == -1:
                continue
             
            
             # kiểm tra nội dung reply
            bot_reply = res.get("content", "")
            # await websocket.send_json(res)
            await manager.broadcast(res)
            if "em đã ghi nhận thông tin đăng ký" in bot_reply.lower():
                from config.database import SessionLocal
                db = SessionLocal()
                import os
                
                rag = RAGModel(db_session=db, gemini_api_key=os.getenv("GOOGLE_API_KEY"))
                
                value = rag.extract_with_ai(chat_session_id=1)
                
                value2 = json.loads(value)
                field_config = db.query(FieldConfig).filter(FieldConfig.id == 3).first()
                customer_data = {}

                for key, field_name in field_config.thongtinbatbuoc.items():
                    customer_data[field_name] = value2.get(key)

                for key, field_name in field_config.thongtintuychon.items():
                    if key in value2:
                        customer_data[field_name] = value2.get(key)


                customer = CustomerInfo(
                    chat_session_id = res.get("chat_session_id"),
                    customer_data=customer_data
                )
                 
                db.add(customer)
                db.commit()
            
    except WebSocketDisconnect:
        manager.disconnect(res.get("chat_session_id"), websocket)  


@router.websocket("/ws/customer")
async def customer_ws(websocket: WebSocket):
    session_id = int(websocket.query_params.get("sessionId"))
    await customer_chat(websocket, session_id)

@router.websocket("/ws/admin")
async def admin_ws(websocket: WebSocket):
    user=await authentication_cookie(websocket.cookies.get("access_token"))
    await admin_chat(websocket, user)

@router.get("/admin/history")
def get_history_chat():
    return get_all_history_chat_controller()




    
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
    print(body)
    data = await chat_platform("fb", body)
    

# TELEGRAM_BOT
@router.post("/webhook/telegram") 
async def tele(request: Request): 
    data = await request.json()
    
    print(data)
    
    res = await chat_platform("tele", data)



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
async def zalo(request: Request): 
    data = await request.json()
    
    print(data)
    
    res = await chat_platform("zalo", data)
    
    # event_name = data.get("event_name")
    # if event_name == "user_send_text":
    #     user_id = data["sender"]["id"]
    #     text = data["message"]["text"]
        
    #     print(user_id)
    #     print(text)

    #     reply = f"Bạn vừa gửi: {text}"
    #     send_zalo_message(user_id, reply)
    
    
        





@router.patch("/{id}")
async def update_config(id: int, request: Request):
    user = await authentication(request)
    data = await request.json()
    return update_chat_session_controller(id, data, user)

@router.delete("/chat_sessions")
async def delete_chat_sessions(request: Request):
    body = await request.json()   # nhận JSON từ client
    ids = body.get("ids", [])     # lấy danh sách ids
    return delete_chat_session_controller(ids)

@router.delete("/messages/{chatId}")
async def delete_messages(chatId: int, request: Request):
    body = await request.json()        # lấy JSON từ body
    ids = body.get("ids", [])          # danh sách id messages
    return delete_message_controller(chatId, ids)