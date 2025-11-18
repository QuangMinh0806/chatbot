from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Xử lý HTTPException và trả về response thống nhất
    """
    logger.error(f"HTTPException: {exc.status_code} - {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url)
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """
    Xử lý các exception chung và trả về response thống nhất
    """
    logger.error(f"Unhandled exception: {type(exc).__name__} - {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
            "status_code": 500,
            "path": str(request.url)
        }
    )