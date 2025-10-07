from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from controllers import facebook_page_controller
import requests
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
import os

load_dotenv()  

URL = os.getenv("URL_BE")
URL_FE = os.getenv("URL")
router = APIRouter(prefix="/facebook-pages", tags=["Facebook Pages"])


@router.get("/")
def get_all_pages(db: Session = Depends(get_db)):
    return facebook_page_controller.get_all_pages_controller(db)


@router.post("/")
async def create_page(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return facebook_page_controller.create_page_controller(data, db)


@router.put("/{page_id}")
async def update_page(page_id: int, request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return facebook_page_controller.update_page_controller(page_id, data, db)


@router.delete("/{page_id}")
def delete_page(page_id: int, db: Session = Depends(get_db)):
    return facebook_page_controller.delete_page_controller(page_id, db)    


# FB_CLIENT_ID = "4238615406374117"
# FB_CLIENT_SECRET = "47d60fe20efd7ce023c35380683ba6ef"

FB_CLIENT_ID = "1658469781534458"
FB_CLIENT_SECRET = "946d796b94196a95c135cf3d6b74a185"

REDIRECT_URI = f"{URL}/facebook-pages/callback"

@router.get("/callback")
# def facebook_callback(code: str):
def facebook_callback(code: Optional[str] = None, db: Session = Depends(get_db)):
    if code is None:
        # Trường hợp Meta hoặc người khác vào link callback không có code
        return {"message": "Facebook callback endpoint - waiting for code"}
    
    # token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
    # params = {
    #     "client_id": FB_CLIENT_ID,
    #     "redirect_uri": REDIRECT_URI,
    #     "client_secret": FB_CLIENT_SECRET,
    #     "code": code
    # }

    # response = requests.get(token_url, params=params)
    # if response.status_code != 200:
    #     raise HTTPException(status_code=400, detail="Failed to get access token")

    # data = response.json()
    # access_token = data.get("access_token")

    # # 2. Lấy thông tin page
    # get_pages = "https://graph.facebook.com/me/accounts"
    # page_params = {
    #     "access_token": access_token
    # }
    # pages = requests.get(get_pages, params=page_params).json()

    # return pages
    
    facebook_page_controller.facebook_callback_controller(code, db)

    return RedirectResponse(url=f"{URL_FE}/admin/facebook_page")  