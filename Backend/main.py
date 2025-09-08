from fastapi import FastAPI
from config.database import create_tables
from fastapi.middleware.cors import CORSMiddleware
# from models import user, company, llm, chat

# from config.sheet import get_sheet




# from routers import messenger_router
from routers import user_router
from routers import company_router
from routers import chat_router


# from config.sheet import get_sheet

app = FastAPI()
# create_tables()

app.include_router(user_router.router)
app.include_router(company_router.router)
app.include_router(chat_router.router)



origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",  # ví dụ React
    "*",  # hoặc '*' để cho tất cả các nguồn (không khuyến nghị ở production)
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