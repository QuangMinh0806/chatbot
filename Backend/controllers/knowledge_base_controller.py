from services import knowledge_base_service

def get_all_kb_controller():
    return knowledge_base_service.get_all_kb_service()

def create_kb_controller(data: dict):
    kb = knowledge_base_service.create_kb_service(data)
    return {
        "message": "Knowledge Base created",
        "knowledge_base": kb
    }

def update_kb_controller(kb_id: int, data: dict):
    kb = knowledge_base_service.update_kb_service(kb_id, data)
    if not kb:
        return {"error": "Knowledge Base not found"}
    return {
        "message": "Knowledge Base updated",
        "knowledge_base": kb
    }
def search_kb_controller(query: str):
    return knowledge_base_service.search_kb_service(query)