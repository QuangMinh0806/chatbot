from services import telegram_page_service


def get_all_bots_controller():
    return telegram_page_service.get_all_bots_service()


def create_bot_controller(data: dict):
    bot = telegram_page_service.create_bot_service(data)
    return {
        "message": "Telegram Bot created successfully",
        "bot": bot
    }


def update_bot_controller(bot_id: int, data: dict):
    bot = telegram_page_service.update_bot_service(bot_id, data)
    if not bot:
        return {"error": "Bot not found"}
    return {
        "message": "Telegram Bot updated successfully",
        "bot": bot
    }


def delete_bot_controller(bot_id: int):
    success = telegram_page_service.delete_bot_service(bot_id)
    if not success:
        return {"error": "Bot not found"}
    return {"message": "Telegram Bot deleted successfully"}
