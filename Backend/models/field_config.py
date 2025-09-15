from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text
from datetime import datetime
from config.database import Base


class FieldConfig(Base):
    __tablename__ = "field_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    thongtinbatbuoc = Column(JSON, nullable=True, default={})
    thongtintuychon = Column(JSON, nullable=True, default={})

    def __repr__(self):
        return f"<FieldConfig(id={self.id}, batbuoc={self.thongtinbatbuoc}, tuychon={self.thongtintuychon})>"

