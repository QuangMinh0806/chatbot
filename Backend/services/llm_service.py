from sqlalchemy.orm import Session
from models.llm import LLM

def create_llm_service(data: dict, db: Session):
    llm_instance = LLM(
        name=data.get("name"),
        key=data.get("key"),
        prompt=data.get("prompt"),
    )
    db.add(llm_instance)
    db.commit()
    db.refresh(llm_instance)
    return llm_instance


def update_llm_service(llm_id: int, data: dict, db: Session):
    llm_instance = db.query(LLM).filter(LLM.id == llm_id).first()
    if not llm_instance:
        return None
    llm_instance.name = data.get('name', llm_instance.name)
    llm_instance.key = data.get('key', llm_instance.key)
    llm_instance.prompt = data.get('prompt', llm_instance.prompt)
    llm_instance.system_greeting = data.get('system_greeting', llm_instance.system_greeting)
    llm_instance.botName = data.get('botName', llm_instance.botName)
    db.commit()
    db.refresh(llm_instance)
    return llm_instance


def delete_llm_service(llm_id: int, db: Session):
    llm_instance = db.query(LLM).filter(LLM.id == llm_id).first()
    if not llm_instance:
        return None
    db.delete(llm_instance)
    db.commit()
    return llm_instance


def get_llm_by_id_service(llm_id: int, db: Session):
    result = db.query(LLM).filter(LLM.id == llm_id).first()
    print("results ", result)
    if result:
        print("Found LLM:", result.id)   # in ra id trong DB
    else:
        print("No LLM found with id:", llm_id)
    return result


def get_all_llms_service(db: Session):
    return db.query(LLM).all()
