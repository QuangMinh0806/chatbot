from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from controllers import telegram_page_controller

router = APIRouter(prefix="/telegram-pages", tags=["Telegram Pages"])


@router.get("/")
def get_all_bots(db: Session = Depends(get_db)):
    return telegram_page_controller.get_all_bots_controller(db)


@router.post("/")
async def create_bot(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return telegram_page_controller.create_bot_controller(data, db)


@router.put("/{bot_id}")
async def update_bot(bot_id: int, request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return telegram_page_controller.update_bot_controller(bot_id, data, db)


@router.delete("/{bot_id}")
def delete_bot(bot_id: int, db: Session = Depends(get_db)):
    return telegram_page_controller.delete_bot_controller(bot_id, db)
