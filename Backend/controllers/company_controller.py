from services.company_service import (
    create_company_service,
    update_company_service,
    delete_company_service,
    get_company_by_id_service,
    get_all_companies_service
)

def create_company_controller(data: dict):
    company = create_company_service(data)
    return {
        "message": "Company created",
        "company": {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "created_at": company.created_at
        }
    }

def update_company_controller(company_id: int, data: dict):
    company = update_company_service(company_id, data)
    if not company:
        return {"message": "Company not found"}
    return {
        "message": "Company updated",
        "company": {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "created_at": company.created_at
        }
    }

def delete_company_controller(company_id: int):
    company = delete_company_service(company_id)
    if not company:
        return {"message": "Company not found"}
    return {"message": "Company deleted", "company_id": company.id}

def get_company_by_id_controller(company_id: int):
    company = get_company_by_id_service(company_id)
    if not company:
        return {"message": "Company not found"}
    return {
        "id": company.id,
        "name": company.name,
        "description": company.description,
        "created_at": company.created_at
    }

def get_all_companies_controller():
    companies = get_all_companies_service()
    # return [
    #     {
    #         "id": c.id,
    #         "name": c.name,
    #         "description": c.description,
    #         "created_at": c.created_at
    #     }
    #     for c in companies
    # ]
    return companies
    
