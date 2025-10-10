from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.llm import LLM

async def create_llm_service(data: dict, db: AsyncSession):
    llm_instance = LLM(
        name=data.get("name"),
        key=data.get("key"),
        prompt=data.get("prompt"),
    )
    db.add(llm_instance)
    await db.commit()
    await db.refresh(llm_instance)
    return llm_instance


async def update_llm_service(llm_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(LLM).filter(LLM.id == llm_id))
    llm_instance = result.scalar_one_or_none()
    if not llm_instance:
        return None
    llm_instance.name = data.get('name', llm_instance.name)
    llm_instance.key = data.get('key', llm_instance.key)
    llm_instance.prompt = data.get('prompt', llm_instance.prompt)
    llm_instance.system_greeting = data.get('system_greeting', llm_instance.system_greeting)
    llm_instance.botName = data.get('botName', llm_instance.botName)
    await db.commit()
    await db.refresh(llm_instance)
    return llm_instance


async def delete_llm_service(llm_id: int, db: AsyncSession):
    result = await db.execute(select(LLM).filter(LLM.id == llm_id))
    llm_instance = result.scalar_one_or_none()
    if not llm_instance:
        return None
    await db.delete(llm_instance)
    await db.commit()
    return llm_instance


async def get_llm_by_id_service(llm_id: int, db: AsyncSession):
    result = await db.execute(select(LLM).filter(LLM.id == llm_id))
    llm = result.scalar_one_or_none()
    print("results ", llm)
    if llm:
        print("Found LLM:", llm.id)   # in ra id trong DB
    else:
        print("No LLM found with id:", llm_id)
    return llm


async def get_all_llms_service(db: AsyncSession):
    result = await db.execute(select(LLM))
    return result.scalars().all()