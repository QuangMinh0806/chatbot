from sqlalchemy.orm import Session
from models.user import User
from passlib.context import CryptContext
from config.database import SessionLocal
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(username: str, password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        # if not user or not verify_password(user.password_hash, password):
        #     return None
        
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()
        
def get_all_users_service():
    db = SessionLocal()
    users = db.query(User).all()
    return users