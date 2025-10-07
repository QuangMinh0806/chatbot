from services import facebook_page_service
import requests
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv
import os

load_dotenv()  

URL_BE = os.getenv("URL_BE")
FB_CLIENT_ID = "1658469781534458"
FB_CLIENT_SECRET = "946d796b94196a95c135cf3d6b74a185"

# FB_CLIENT_ID = "1130979465654370"
# FB_CLIENT_SECRET = "dda15803ebe7785219a19f1a2823d777"
REDIRECT_URI = f"{URL_BE}/facebook-pages/callback"

print("URL_BE:", REDIRECT_URI)


def get_all_pages_controller(db):
    return facebook_page_service.get_all_pages_service(db)


def create_page_controller(data: dict, db):
    page = facebook_page_service.create_page_service(data, db)
    return {
        "message": "Facebook Page created successfully",
        "page": page
    }


def update_page_controller(page_id: int, data: dict, db):
    page = facebook_page_service.update_page_service(page_id, data, db)
    if not page:
        return {"error": "Page not found"}
    return {
        "message": "Facebook Page updated successfully",
        "page": page
    }


def delete_page_controller(page_id: int, db):
    success = facebook_page_service.delete_page_service(page_id, db)
    if not success:
        return {"error": "Page not found"}
    return {"message": "Facebook Page deleted successfully"}



def facebook_callback_controller(code: str, db):
    
    token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
    params = {
        "client_id": FB_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": FB_CLIENT_SECRET,
        "code": code
    }

    response = requests.get(token_url, params=params)
    if response.status_code != 200:
        print(response)
        raise HTTPException(status_code=400, detail="Failed to get access token")

    data = response.json()
    access_token = data.get("access_token")

    # 2. Lấy thông tin page
    get_pages = "https://graph.facebook.com/me/accounts"
    page_params = {
        "access_token": access_token
    }
    pages = requests.get(get_pages, params=page_params).json()
    
    
    return facebook_page_service.facebook_callback_service(pages, db)


