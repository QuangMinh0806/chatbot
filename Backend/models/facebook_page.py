from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text, Boolean, func
from datetime import datetime
from config.database import Base


class FacebookPage(Base):
    __tablename__ = "facebook_pages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    page_id = Column(String(50), unique=True, nullable=False, index=True, comment="Facebook Page ID")
    page_name = Column(String(255), nullable=False, comment="Tên fanpage để hiển thị")
    
     # Access Tokens
    access_token = Column(Text, nullable=False, comment="Page Access Token từ Facebook")
    webhook_verify_token = Column(String(255), nullable=True, comment="Webhook verify token (optional, có thể dùng chung)")
    
    # Status & Configuration
    is_active = Column(Boolean, default=True, nullable=False, comment="Fanpage có được kích hoạt không")
    auto_response_enabled = Column(Boolean, default=True, nullable=False, comment="Bật tự động trả lời")
    
    
    # Metadata
    description = Column(Text, nullable=True, comment="Mô tả fanpage")
    category = Column(String(100), nullable=True, comment="Danh mục fanpage")
    avatar_url = Column(String(500), nullable=True, comment="URL avatar fanpage")
    cover_url = Column(String(500), nullable=True, comment="URL ảnh bìa fanpage")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    company_id = Column(Integer, ForeignKey("company.id"), nullable=False)
