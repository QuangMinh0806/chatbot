from sqlalchemy.orm import Session
from models.telegram_page import TelegramBot
from config.database import SessionLocal


def get_all_bots_service(db):
    return db.query(TelegramBot).all()


def create_bot_service(data: dict, db):
    print(data)
    bot = TelegramBot(
        bot_name=data["bot_name"],
        bot_token=data["bot_token"],
        description=data.get("description"),
        is_active=data.get("is_active", True),
        company_id=1  # cố định company_id
    )
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot


def update_bot_service(bot_id: int, data: dict, db):
    bot = db.query(TelegramBot).filter(TelegramBot.id == bot_id).first()
    if not bot:
        return None

    bot.bot_name = data.get("bot_name", bot.bot_name)
    bot.bot_token = data.get("bot_token", bot.bot_token)
    bot.description = data.get("description", bot.description)
    bot.is_active = data.get("is_active", bot.is_active)
    bot.company_id = 1  # cố định company_id

    db.commit()
    db.refresh(bot)
    return bot


def delete_bot_service(bot_id: int, db):
    bot = db.query(TelegramBot).filter(TelegramBot.id == bot_id).first()
    if not bot:
        return None
    db.delete(bot)
    db.commit()
    return True
