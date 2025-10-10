from sqlalchemy.ext.asyncio import AsyncSession
from services.llm_service import (
    create_llm_service,
    update_llm_service,
    delete_llm_service,
    get_llm_by_id_service,
    get_all_llms_service
)

async def create_llm_controller(data: dict, db: AsyncSession):
    llm_instance = await create_llm_service(data, db)
    return {
        "message": "LLM created",
        "llm": {
            "id": llm_instance.id,
            "name": llm_instance.name,
            "key": llm_instance.key,
            "prompt": llm_instance.prompt,
            "created_at": llm_instance.created_at
        }
    }

async def update_llm_controller(llm_id: int, data: dict, db: AsyncSession):
    llm_instance = await update_llm_service(llm_id, data, db)
    if not llm_instance:
        return {"message": "LLM not found"}
    return {
        "message": "LLM updated",
        "llm": {
            "id": llm_instance.id,
            "name": llm_instance.name,
            "key": llm_instance.key,
            "prompt": llm_instance.prompt,
            "created_at": llm_instance.created_at
        }
    }

async def delete_llm_controller(llm_id: int, db: AsyncSession):
    llm_instance = await delete_llm_service(llm_id, db)
    if not llm_instance:
        return {"message": "LLM not found"}
    return {"message": "LLM deleted", "llm_id": llm_instance.id}

async def get_llm_by_id_controller(llm_id: int, db: AsyncSession):
    llm_instance = await get_llm_by_id_service(llm_id, db)
    if not llm_instance:
        return {"message": "LLM not found"}
    return {
        "id": llm_instance.id,
        "name": llm_instance.name,
        "key": llm_instance.key,
        "prompt": llm_instance.prompt,
        "created_at": llm_instance.created_at,
        "system_greeting": llm_instance.system_greeting
    }

async def get_all_llms_controller(db: AsyncSession):
    llms = await get_all_llms_service(db)
    return [
        {
            "id": l.id,
            "name": l.name,
            "key": l.key,
            "prompt": l.prompt,
            "created_at": l.created_at,
            "system_greeting": l.system_greeting,
            "botName": l.botName
        }
        for l in llms
    ]