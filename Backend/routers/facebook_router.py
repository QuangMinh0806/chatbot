from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from config.database import get_db
from controllers import facebook_page_controller

router = APIRouter(prefix="/fanpages", tags=["facebook_pages"])

@router.post("/")
def create_fanpage(data: dict, db: Session = Depends(get_db)):
    return facebook_page_controller.create_fanpage_controller(db, data)

@router.get("/")
def get_all_fanpages(db: Session = Depends(get_db)):
    return facebook_page_controller.get_all_fanpages_controller(db)

@router.get("/by_page_id/{page_id}")
def get_by_page_id(page_id: str, db: Session = Depends(get_db)):
    fanpage = facebook_page_controller.get_by_page_id_controller(db, page_id)
    if not fanpage:
        raise HTTPException(status_code=404, detail="Fanpage not found")
    return fanpage

@router.get("/search/")
def search_fanpages(keyword: str = Query(..., description="Search by fanpage name"), db: Session = Depends(get_db)):
    return facebook_page_controller.search_fanpages_controller(db, keyword)
