from datetime import datetime
from fastapi import FastAPI
from config.database import SessionLocal, create_tables
from fastapi.middleware.cors import CORSMiddleware
from models import user, company, llm, chat, facebook_page, field_config, telegram_page, tag
# from config.sheet import get_sheet
from llm.llm import RAGModel


# get_sheet("1TwzgbArCvbrXUZWXrlVfUrB2kM9xSeJyMXtN2h9kLyA", 1)

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
# from config.sheet import get_sheet

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
origins = [    "http://localhost:5173",
    # "https://chatbot.haduyson.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # danh sách nguồn được phép
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, PUT, DELETE ...
    allow_headers=["*"],        # cho phép tất cả headers
)

# from config.sheet import get_sheet
# sheets = get_sheet("1TwzgbArCvbrXUZWXrlVfUrB2kM9xSeJyMXtN2h9kLyA", 1)
db = SessionLocal()
import os
rag = RAGModel(db_session=db, gemini_api_key=os.getenv("GOOGLE_API_KEY"))
rag.extract_with_ai(1)
@app.get("/")
def read_root():
    return {"message": "Hello FastAPI"}