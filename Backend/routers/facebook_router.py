from fastapi import APIRouter, Request, HTTPException
from controllers import facebook_page_controller
import requests
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/facebook-pages", tags=["Facebook Pages"])


@router.get("/")
def get_all_pages():
    return facebook_page_controller.get_all_pages_controller()


@router.post("/")
async def create_page(request: Request):
    data = await request.json()
    return facebook_page_controller.create_page_controller(data)


@router.put("/{page_id}")
async def update_page(page_id: int, request: Request):
    data = await request.json()
    return facebook_page_controller.update_page_controller(page_id, data)


@router.delete("/{page_id}")
def delete_page(page_id: int):
    return facebook_page_controller.delete_page_controller(page_id)    



FB_CLIENT_ID = "1130979465654370"
FB_CLIENT_SECRET = "dda15803ebe7785219a19f1a2823d777"
REDIRECT_URI = "http://localhost:8000/facebook-pages/callback"

@router.get("/callback")
def facebook_callback(code: str):
    
    
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
    
    facebook_page_controller.facebook_callback_controller(code)

    return RedirectResponse(url="http://localhost:5173/admin/facebook_page")  