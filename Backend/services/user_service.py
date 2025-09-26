from models.chat import CustomerInfo
from models.user import User
from passlib.context import CryptContext
from config.database import SessionLocal
from datetime import datetime
 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    # Truncate password to 72 bytes to avoid bcrypt limitation
    password_bytes = password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password_truncated) 

def verify_password(plain_password, hashed_password):
    # Truncate password to 72 bytes to avoid bcrypt limitation
    password_bytes = plain_password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(password_truncated, hashed_password)

def authenticate_user(username: str, password: str):
    print("Authenticating user:", username)
    print("Password provided:", password)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user or not verify_password(password, user.password_hash):
            return None
        
        user.last_login = datetime.now()
        db.commit()
        db.refresh(user)
        return user 
    finally:
        db.close() 
        
def get_all_users_service():
    db = SessionLocal()
    users = db.query(User).all()
    return users

def create_user_service(data: dict):
    db = SessionLocal()
    try:
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
    finally:
        db.close()

def update_user_service(user_id: int, data: dict):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        if "username" in data:
            user.username = data["username"]
        if "email" in data:
            user.email = data["email"]
        if "full_name" in data:
            user.full_name = data["full_name"]
        if "password" in data:
            user.password_hash = hash_password(data["password"])
        if "role" in data:
            user.role = data["role"]
        if "company_id" in data:
            user.company_id = data["company_id"]

        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()
        
        
        
def get_all_customer_info_service():
    db = SessionLocal()
    try:
        return (
            db.query(CustomerInfo)
            .order_by(CustomerInfo.created_at.desc())  # mới nhất trước
            .all()
    )
    finally:
        db.close()