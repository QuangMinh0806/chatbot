from services.tag_service import (
    create_tag_service,
    get_tags_by_chat_session_service,
    update_tag_service,
    delete_tag_service,
    get_tag_by_id_service,
    get_all_tags_service,
)

def create_tag_controller(data: dict):
    tag = create_tag_service(data)
    return {
        "message": "Tag created",
        "tag": {
            "id": tag.id,
            "name": tag.name,
            "description": tag.description,
            "color": tag.color
        }
    }


def update_tag_controller(tag_id: int, data: dict):
    tag = update_tag_service(tag_id, data)
    if not tag:
        return {"message": "Tag not found"}
    return {
        "message": "Tag updated",
        "tag": {
            "id": tag.id,
            "name": tag.name,
            "description": tag.description,
            "color": tag.color
        }
    }


def delete_tag_controller(tag_id: int):
    tag = delete_tag_service(tag_id)
    if not tag:
        return {"message": "Tag not found"}
    return {"message": "Tag deleted", "tag_id": tag.id}


def get_tag_by_id_controller(tag_id: int):
    tag = get_tag_by_id_service(tag_id)
    if not tag:
        return {"message": "Tag not found"}
    return {
        "id": tag.id,
        "name": tag.name,
        "description": tag.description,
        "color": tag.color
    }


def get_all_tags_controller():
    tags = get_all_tags_service()
    return [
        {
            "id": tag.id,
            "name": tag.name,
            "description": tag.description,
            "color": tag.color
        }
        for tag in tags
    ]

def get_tags_by_chat_session_controller(chat_session_id: int):
    tags = get_tags_by_chat_session_service(chat_session_id)
    if tags is None:
        return {"message": "Chat session not found"}
    return [
        {
            "id": tag.id,
            "name": tag.name,
            "description": tag.description,
            "color": tag.color
        }
        for tag in tags
    ]