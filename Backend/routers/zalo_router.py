from fastapi import APIRouter, Request
from controllers import zalo_bot_controller

router = APIRouter(prefix="/zalo", tags=["Zalo Bots"])


@router.get("/")
def get_all_bots():
    return zalo_bot_controller.get_all_bots_controller()


@router.post("/")
async def create_bot(request: Request):
    data = await request.json()
    return zalo_bot_controller.create_bot_controller(data)


@router.put("/{bot_id}")
async def update_bot(bot_id: int, request: Request):
    data = await request.json()
    return zalo_bot_controller.update_bot_controller(bot_id, data)


@router.delete("/{bot_id}")
def delete_bot(bot_id: int):
    return zalo_bot_controller.delete_bot_controller(bot_id)
