from fastapi import APIRouter, Query, Request, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from controllers import knowledge_base_controller
from fastapi import Query
router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])

@router.get("/")
def get_all_kb(db: Session = Depends(get_db)):
    return knowledge_base_controller.get_all_kb_controller(db)

@router.post("/")
async def create_kb(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return knowledge_base_controller.create_kb_controller(data, db)

@router.patch("/{kb_id}")
async def update_kb(kb_id: int, request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return knowledge_base_controller.update_kb_controller(kb_id, data, db)


@router.get("/search")
async def search_kb(query: str = Query(...), db: Session = Depends(get_db)):
    return knowledge_base_controller.search_kb_controller(query, db)