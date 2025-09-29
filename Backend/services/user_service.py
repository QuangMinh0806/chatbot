from models.chat import CustomerInfo
from models.user import User
from datetime import datetime
import bcrypt
from sqlalchemy.orm import Session

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    user.last_login = datetime.now()
    db.commit()
    db.refresh(user)
    return user 

def get_all_users_service(db: Session):
    return db.query(User).all()

def create_user_service(db: Session, data: dict):
    hashed_pwd = hash_password(data["password"]) 
    user = User(
        username=data["username"],
        email=data["email"],
        full_name=data["full_name"],
        password_hash=hashed_pwd,
        role=data.get("role", "user"),
        company_id=data["company_id"]
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_service(db: Session, user_id: int, data: dict):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    if "username" in data: user.username = data["username"]
    if "email" in data: user.email = data["email"]
    if "full_name" in data: user.full_name = data["full_name"]
    if "password" in data: user.password_hash = hash_password(data["password"])
    if "role" in data: user.role = data["role"]
    if "company_id" in data: user.company_id = data["company_id"]

    db.commit()
    db.refresh(user)
    return user

def get_all_customer_info_service(db: Session):
    return db.query(CustomerInfo).order_by(CustomerInfo.created_at.desc()).all()
