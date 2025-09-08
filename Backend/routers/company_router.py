from fastapi import APIRouter, Request
from controllers.company_controller import (
    create_company_controller,
    update_company_controller,
    delete_company_controller,
    get_company_by_id_controller,
    get_all_companies_controller
)

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("/")
async def create_company(request: Request):
    data = await request.json()
    return create_company_controller(data)

@router.put("/{company_id}")
async def update_company(company_id: int, request: Request):
    data = await request.json()
    return update_company_controller(company_id, data)

@router.delete("/{company_id}")
async def delete_company(company_id: int):
    return delete_company_controller(company_id)

@router.get("/{company_id}")
async def get_company_by_id(company_id: int):
    return get_company_by_id_controller(company_id)

@router.get("/")
async def get_all_companies():
    return get_all_companies_controller()
