from fastapi import APIRouter, Request
from controllers.tag_controller import (
    create_tag_controller,
    get_tags_by_chat_session_controller,
    update_tag_controller,
    delete_tag_controller,
    get_tag_by_id_controller,
    get_all_tags_controller,
)

router = APIRouter(prefix="/tags", tags=["Tags"])

@router.post("/")
async def create_tag(request: Request):
    data = await request.json()
    return create_tag_controller(data)

@router.put("/{tag_id}")
async def update_tag(tag_id: int, request: Request):
    data = await request.json()
    return update_tag_controller(tag_id, data)

@router.delete("/{tag_id}")
async def delete_tag(tag_id: int):
    return delete_tag_controller(tag_id)

@router.get("/{tag_id}")
async def get_tag_by_id(tag_id: int):
    return get_tag_by_id_controller(tag_id)

@router.get("/")
async def get_all_tags():
    return get_all_tags_controller()

@router.get("/chat_session/{chat_session_id}")
async def get_tags_by_chat_session(chat_session_id: int):
    return get_tags_by_chat_session_controller(chat_session_id)