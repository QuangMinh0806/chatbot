from services import facebook_page_service

def get_all_pages_controller():
    return facebook_page_service.get_all_pages_service()


def create_page_controller(data: dict):
    page = facebook_page_service.create_page_service(data)
    return {
        "message": "Facebook Page created successfully",
        "page": page
    }


def update_page_controller(page_id: int, data: dict):
    page = facebook_page_service.update_page_service(page_id, data)
    if not page:
        return {"error": "Page not found"}
    return {
        "message": "Facebook Page updated successfully",
        "page": page
    }


def delete_page_controller(page_id: int):
    success = facebook_page_service.delete_page_service(page_id)
    if not success:
        return {"error": "Page not found"}
    return {"message": "Facebook Page deleted successfully"}

