from services import telegram_page_service


def get_all_bots_controller(db):
    return telegram_page_service.get_all_bots_service(db)


def create_bot_controller(data: dict, db):
    bot = telegram_page_service.create_bot_service(data, db)
    return {
        "message": "Telegram Bot created successfully",
        "bot": bot
    }


def update_bot_controller(bot_id: int, data: dict, db):
    bot = telegram_page_service.update_bot_service(bot_id, data, db)
    if not bot:
        return {"error": "Bot not found"}
    return {
        "message": "Telegram Bot updated successfully",
        "bot": bot
    }


def delete_bot_controller(bot_id: int, db):
    success = telegram_page_service.delete_bot_service(bot_id, db)
    if not success:
        return {"error": "Bot not found"}
    return {"message": "Telegram Bot deleted successfully"}
