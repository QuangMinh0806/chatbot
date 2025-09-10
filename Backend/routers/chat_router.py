from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
import json

router = APIRouter()


from fastapi import APIRouter, Request

from config.websocket_manager import ConnectionManager

from controllers.chat_controller import (
    create_session_controller,
    handle_send_message,
    get_history_chat_controller,
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
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data) 
            res= await handle_send_message(websocket, data)
            await websocket.send_json(res)
    except WebSocketDisconnect:
        manager.disconnect(websocket)  


@router.get("/admin/history")
def get_history_chat():
    return get_all_history_chat_controller()

@router.patch("/{id}")
async def update_config(id: int, request: Request):
    data = await request.json()
    return update_chat_session_controller(id, data)