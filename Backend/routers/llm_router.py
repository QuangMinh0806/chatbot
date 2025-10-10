from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.llm_controller import (
    create_llm_controller,
    update_llm_controller,
    delete_llm_controller,
    get_llm_by_id_controller,
    get_all_llms_controller
)

router = APIRouter(prefix="/llms", tags=["LLMs"])

@router.post("/")
async def create_llm(request: Request, db: AsyncSession = Depends(get_db)):
    data = await request.json()
    return await create_llm_controller(data, db)

@router.put("/{llm_id}")
async def update_llm(llm_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    data = await request.json()
    return await update_llm_controller(llm_id, data, db)

@router.delete("/{llm_id}")
async def delete_llm(llm_id: int, db: AsyncSession = Depends(get_db)):
    return await delete_llm_controller(llm_id, db)

@router.get("/{llm_id}")
async def get_llm_by_id(llm_id: int, db: AsyncSession = Depends(get_db)):
    return await get_llm_by_id_controller(llm_id, db)

@router.get("/")
async def get_all_llms(db: AsyncSession = Depends(get_db)):
    return await get_all_llms_controller(db)