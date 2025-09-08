from fastapi import APIRouter, WebSocket, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from controllers import messenger_controller

router = APIRouter(prefix="/messenger", tags=["messenger"])

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int, db: Session = Depends(get_db)):
    await messenger_controller.handle_chat(websocket, conversation_id, db)
