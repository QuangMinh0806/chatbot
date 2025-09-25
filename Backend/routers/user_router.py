from fastapi import APIRouter, HTTPException, Request, Response, Depends
from controllers import user_controller
from middleware.jwt import authentication
from middleware.jwt import decode_token
router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_me(request: Request):
    access_token = request.cookies.get("access_token")  # lấy từ cookie
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    print(payload)
    return {
        "id": payload.get("id"),
        "username": payload.get("sub"),
        "role": payload.get("role"),
        "full_name": payload.get("fullname"),
        "email": payload.get("email"),
        "password_hash": payload.get("password"),
        access_token: access_token
    }
@router.post("/login")
async def login_user(request: Request, response: Response):
    print("aaaaaa")
    data = await request.json()
    return user_controller.login_user_controller(data, response)

@router.get("/")
def get_users(user=Depends(authentication)):
    return user_controller.get_all_users_controller(user)

@router.post("/logout")
def logout_user(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@router.post("/")
async def create_user(request: Request):
    data = await request.json()
    return user_controller.create_user_controller(data)

@router.put("/{user_id}")
async def update_user(user_id: int, request: Request):
    data = await request.json()
    return user_controller.update_user_controller(user_id, data)






@router.get("/customers")
def get_customers():
    return user_controller.get_all_customer_info_controller()