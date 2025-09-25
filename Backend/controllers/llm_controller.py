from services.llm_service import (
    create_llm_service,
    update_llm_service,
    delete_llm_service,
    get_llm_by_id_service,
    get_all_llms_service
)

def create_llm_controller(data: dict):
    llm_instance = create_llm_service(data)
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

def update_llm_controller(llm_id: int, data: dict):
    llm_instance = update_llm_service(llm_id, data)
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

def delete_llm_controller(llm_id: int):
    llm_instance = delete_llm_service(llm_id)
    if not llm_instance:
        return {"message": "LLM not found"}
    return {"message": "LLM deleted", "llm_id": llm_instance.id}

def get_llm_by_id_controller(llm_id: int):
    llm_instance = get_llm_by_id_service(llm_id)
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

def get_all_llms_controller():
    llms = get_all_llms_service()
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
