from services.tag_service import (
    create_tag_service,
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
            "description": tag.description
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
            "description": tag.description
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
        "description": tag.description
    }


def get_all_tags_controller():
    tags = get_all_tags_service()
    return [
        {
            "id": tag.id,
            "name": tag.name,
            "description": tag.description
        }
        for tag in tags
    ]
