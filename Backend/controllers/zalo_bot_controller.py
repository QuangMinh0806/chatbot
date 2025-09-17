from services import zalo_bot_service


def get_all_bots_controller():
    return zalo_bot_service.get_all_bots_service()


def create_bot_controller(data: dict):
    bot = zalo_bot_service.create_bot_service(data)
    return {
        "message": "Zalo Bot created successfully",
        "bot": bot
    }


def update_bot_controller(bot_id: int, data: dict):
    bot = zalo_bot_service.update_bot_service(bot_id, data)
    if not bot:
        return {"error": "Bot not found"}
    return {
        "message": "Zalo Bot updated successfully",
        "bot": bot
    }


def delete_bot_controller(bot_id: int):
    success = zalo_bot_service.delete_bot_service(bot_id)
    if not success:
        return {"error": "Bot not found"}
    return {"message": "Zalo Bot deleted successfully"}
