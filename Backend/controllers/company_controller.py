from services.company_service import (
    create_company_service,
    update_company_service,
    delete_company_service,
    get_company_by_id_service,
    get_all_companies_service
)

def create_company_controller(data: dict, db):
    company = create_company_service(data, db)
    return {
        "message": "Company created",
        "company": {
            "id": company.id,
            "name": company.name,
            "logo_url": company.logo_url,
            "contact": company.contact,
            "created_at": company.created_at
        }
    }

def update_company_controller(company_id: int, data: dict, db):
    company = update_company_service(company_id, data, db)
    if not company:
        return {"message": "Company not found"}
    return {
        "message": "Company updated",
        "company": {
            "id": company.id,
            "name": company.name,
            "logo_url": company.logo_url,
            "contact": company.contact,
            "created_at": company.created_at
        }
    }

def delete_company_controller(company_id: int, db):
    company = delete_company_service(company_id, db)
    if not company:
        return {"message": "Company not found"}
    return {"message": "Company deleted", "company_id": company.id}

def get_company_by_id_controller(company_id: int, db):
    company = get_company_by_id_service(company_id, db)
    if not company:
        return {"message": "Company not found"}
    return {
        "id": company.id,
        "name": company.name,
        "logo_url": company.logo_url,
        "contact": company.contact,
        "created_at": company.created_at
    }

def get_all_companies_controller(db):
    companies = get_all_companies_service(db)
    return [
        {
            "id": c.id,
            "name": c.name,
            "logo_url": c.logo_url,
            "contact": c.contact,
            "created_at": c.created_at
        }
        for c in companies
    ]
    
