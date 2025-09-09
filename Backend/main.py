from fastapi import FastAPI
from config.database import create_tables
from fastapi.middleware.cors import CORSMiddleware
from models import user, company, llm, chat

# from config.sheet import get_sheet




# from routers import messenger_router
from routers import user_router
from routers import company_router
from routers import chat_router
from routers import llm_router
from routers import map_sheet
# from config.sheet import get_sheet

app = FastAPI()
create_tables()

app.include_router(user_router.router)
app.include_router(company_router.router)
app.include_router(chat_router.router)
app.include_router(llm_router.router)
app.include_router(map_sheet.router)

origins = [
    "http://localhost:5173" ,
    "http://127.0.0.1:5173" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # danh sách nguồn được phép
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, PUT, DELETE ...
    allow_headers=["*"],        # cho phép tất cả headers
)

# sheets = get_sheet("1TwzgbArCvbrXUZWXrlVfUrB2kM9xSeJyMXtN2h9kLyA")




@app.get("/")
def read_root():
    return {"message": "Hello FastAPI"}