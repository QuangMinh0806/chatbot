from fastapi import APIRouter, Request
from controllers.llm_controller import (
    create_llm_controller,
    update_llm_controller,
    delete_llm_controller,
    get_llm_by_id_controller,
    get_all_llms_controller
)

router = APIRouter(prefix="/llms", tags=["LLMs"])

@router.post("/")
async def create_llm(request: Request):
    data = await request.json()
    return create_llm_controller(data)

@router.put("/{llm_id}")
async def update_llm(llm_id: int, request: Request):
    data = await request.json()
    return update_llm_controller(llm_id, data)

@router.delete("/{llm_id}")
async def delete_llm(llm_id: int):
    return delete_llm_controller(llm_id)

@router.get("/{llm_id}")
async def get_llm_by_id(llm_id: int):
    return get_llm_by_id_controller(llm_id)

@router.get("/")
async def get_all_llms():
    return get_all_llms_controller()
