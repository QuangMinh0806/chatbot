from fastapi import APIRouter, Request, Response
from controllers import user_controller

router = APIRouter(prefix="/users", tags=["Users"])



@router.post("/login")
async def login_user(request: Request, response: Response):
    data = await request.json()
    return user_controller.login_user_controller(data, response)

@router.get("/")
def get_users():
    return user_controller.get_all_users_controller()



@router.post("/")
async def create_user(request: Request):
    data = await request.json()
    return user_controller.create_user_controller(data)

@router.put("/{user_id}")
async def update_user(user_id: int, request: Request):
    data = await request.json()
    return user_controller.update_user_controller(user_id, data)