from fastapi import APIRouter, Request
from controllers import knowledge_base_controller

router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])

@router.get("/")
def get_all_kb():
    return knowledge_base_controller.get_all_kb_controller()

@router.post("/")
async def create_kb(request: Request):
    data = await request.json()
    return knowledge_base_controller.create_kb_controller(data)

@router.patch("/{kb_id}")
async def update_kb(kb_id: int, request: Request):
    data = await request.json()
    return knowledge_base_controller.update_kb_controller(kb_id, data)
