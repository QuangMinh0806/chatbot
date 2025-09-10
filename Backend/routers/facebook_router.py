from fastapi import APIRouter, Request
from controllers import facebook_page_controller

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



