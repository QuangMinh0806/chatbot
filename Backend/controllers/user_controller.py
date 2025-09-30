from fastapi import Response
from sqlalchemy.orm import Session
from services import user_service
from middleware.jwt import create_access_token, set_cookie, create_refresh_token

def login_user_controller(data: dict, response: Response, db: Session):
    user = user_service.authenticate_user(db, data["username"], data["password"])
    if not user:
        return {"error": "Invalid username or password"}
    
    access_token = create_access_token({
        "sub": user.username,
        "id": user.id,
        "role": user.role,
        "fullname": user.full_name,
        "email": user.email
    })
    refresh_token = create_refresh_token({
        "sub": user.username,
        "id": user.id,
        "role": user.role,
        "fullname": user.full_name,
        "email": user.email
    })
    
    set_cookie(response, access_token, refresh_token)
    
    return { 
        "message": "Login successful",
        "user": {
            "id": user.id, 
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "token": access_token
        }
    }

def get_all_users_controller(user, db: Session):
    return user_service.get_all_users_service(db)

def create_user_controller(data: dict, db: Session):
    user = user_service.create_user_service(db, data)
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

def update_user_controller(user_id: int, data: dict, db: Session):
    user = user_service.update_user_service(db, user_id, data)
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

def get_all_customer_info_controller(db: Session):
    return user_service.get_all_customer_info_service(db)
