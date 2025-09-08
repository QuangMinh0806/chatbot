from fastapi import Response
from services import user_service
from middleware.jwt import create_access_token, set_cookie

# def register_user_controller(data: dict):
#     user = user_service.create_user(data)
#     return {
#         "message": "User created",
#         "user": {
#             "id": user.id,
#             "username": user.username,
#             "email": user.email,
#             "full_name": user.full_name,
#             "role": user.role
#         }
#     }

def login_user_controller(data: dict, response: Response):
    user = user_service.authenticate_user(data["username"], data["password"])
    if not user:
        return {"error": "Invalid username or password"}

    token = create_access_token({"sub": user.username, "id": user.id, "role": user.role})
    set_cookie(response, token)
    
    return { 
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "token" : token
        }
    }


def get_all_users_controller():
    return user_service.get_all_users_service()