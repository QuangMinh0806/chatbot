from services.chat_service import (
    create_session_service,
    send_message_service,
    get_history_chat_service,
    get_all_history_chat_service,
    update_chat_session
)
from fastapi import WebSocket

def create_session_controller():
    chat = create_session_service()
    return {
        "id": chat
    }


async def handle_send_message(websocket: WebSocket, data : dict):
    message = send_message_service(data)
    
    # gửi realtime cho client
    return message
    
def get_history_chat_controller(chat_session_id: int):
    messages = get_history_chat_service(chat_session_id)
    return messages


def get_all_history_chat_controller():
    messages = get_all_history_chat_service()
    return messages

def update_chat_session_controller(id: int, data: dict):
    chatSession = update_chat_session(id, data)
    if not chatSession:
        return {"message": "Not Found"}
    return chatSession

