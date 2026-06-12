from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from database import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)

    word = Column(String, unique=True, index=True)

    meaning = Column(String)

    synonym = Column(String)

    antonym = Column(String)

    example_sentence = Column(String)

    turkish_translation = Column(String)

    level = Column(String, default="unknown")
    
    review_count = Column(Integer, default=0)

    next_review = Column(DateTime, default=datetime.utcnow)