from fastapi import APIRouter, HTTPException, Request
from controllers.config_controller import (
    read_config,
    update_config_status
)


router = APIRouter(prefix="/config", tags=["Config"])

@router.get("/{id}")
async def read_config(id: int):
    return read_config(id)


@router.put("/{id}")
async def update_config(id: int, request: Request):
    data = await request.json()
    return update_config_status(id, data)
