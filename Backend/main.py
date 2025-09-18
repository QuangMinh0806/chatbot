from fastapi import FastAPI, Request
from config.database import create_tables
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from models import user, company, llm, chat, facebook_page, field_config, telegram_page, tag
from llm.llm import RAGModel



# from routers import messenger_router
from routers import user_router
from routers import company_router
from routers import chat_router
from routers import knowledge_base_router
from routers import facebook_router
from routers import llm_router
from routers import map_sheet
from routers import field_config_router
from routers import telegram_router
from routers import tag_router
from routers import zalotest
from routers import zalo_router

app = FastAPI()
create_tables()

app.include_router(user_router.router)
app.include_router(company_router.router)
app.include_router(chat_router.router)
app.include_router(knowledge_base_router.router)
app.include_router(facebook_router.router)
app.include_router(llm_router.router)
app.include_router(map_sheet.router)
app.include_router(field_config_router.router)
app.include_router(telegram_router.router)
app.include_router(tag_router.router)
app.include_router(zalotest.router)
app.include_router(zalo_router.router)


origins = [    
    "https://chatbot.haduyson.com" 
    # ,"http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # danh sách nguồn được phép
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, PUT, DELETE ...
    allow_headers=["*"],        # cho phép tất cả headers
)


 


@app.get("/")
def read_root():
    return {"message": "Hello FastAPI"}