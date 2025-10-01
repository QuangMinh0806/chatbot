from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from dotenv import load_dotenv
import os

load_dotenv()  

DATABASE_URL = os.getenv("DATABASE")
engine = create_engine(
    url = DATABASE_URL,
    pool_size=100,        # mạnh hơn
    max_overflow=100,      # cho burst
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True 
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
