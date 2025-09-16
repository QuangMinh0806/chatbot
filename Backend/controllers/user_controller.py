from fastapi import Response
from services import user_service
from middleware.jwt import create_access_token, set_cookie, create_refresh_token

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
    print(user)
    if not user:
        return {"error": "Invalid username or password"}
    
    access_token  = create_access_token({"sub": user.username, "id": user.id, "role": user.role, "fullname" : user.full_name, "email": user.email, "password": user.password_hash })
    refresh_token   = create_refresh_token({"sub": user.username, "id": user.id, "role": user.role, "fullname" : user.full_name,  "email": user.email, "password": user.password_hash })
    
    set_cookie(response, access_token, refresh_token)
    
    return { 
        "message": "Login successful",
        "user": {
            "id": user.id, 
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "token" : access_token
        }
    }


def get_all_users_controller(user):
    print(user)
    return user_service.get_all_users_service()


def create_user_controller(data: dict):
    user = user_service.create_user_service(data)
    return {
        "message": "User created successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

def update_user_controller(user_id: int, data: dict):
    user = user_service.update_user_service(user_id, data)
    if not user:
        return {"error": "User not found"}
    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }
    
    
