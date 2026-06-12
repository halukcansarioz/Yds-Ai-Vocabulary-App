from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import importlib
import csv
import os


try:
    fastapi = importlib.import_module("fastapi")
    cors = importlib.import_module("fastapi.middleware.cors")
    sqlalchemy_orm = importlib.import_module("sqlalchemy.orm")
except ImportError as e:
    raise ImportError("FastAPI and SQLAlchemy are required. Install them with 'pip install fastapi sqlalchemy'") from e

FastAPI = fastapi.FastAPI
Depends = fastapi.Depends
HTTPException = fastapi.HTTPException
CORSMiddleware = cors.CORSMiddleware
Session = sqlalchemy_orm.Session
from datetime import datetime, timedelta
from database import Base, engine, SessionLocal
from models import Word

Base.metadata.create_all(bind=engine)

app = FastAPI(title="YDS AI App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class WordUpdate(BaseModel):
    meaning: str
    synonym: str
    antonym: str
    example_sentence: str
    turkish_translation: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "YDS AI App çalışıyor 🚀"
    }


@app.get("/words")
def get_words(db: Session = Depends(get_db)):
    words = db.query(Word).all()
    return words


@app.post("/words/add")
def add_word(word: str, db: Session = Depends(get_db)):
    existing_word = db.query(Word).filter(Word.word == word).first()

    if existing_word:
        return {
            "message": "Bu kelime zaten kayıtlı",
            "word": existing_word
        }

    new_word = Word(
        word=word,
        meaning="Şimdilik boş",
        synonym="Şimdilik boş",
        antonym="Şimdilik boş",
        example_sentence="Şimdilik boş",
        turkish_translation="Şimdilik boş"
    )

    db.add(new_word)
    db.commit()
    db.refresh(new_word)

    return {
        "message": "Kelime başarıyla eklendi",
        "word": new_word
    }


@app.post("/words/{word_id}/review")
def review_word(word_id: int, status: str, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()

    if not word:
        return {"error": "Kelime bulunamadı"}
    
    word.review_count += 1
    
    if status == "biliyorum":
        word.next_review = datetime.utcnow() + timedelta(days=7)
        word.level = "known"

    elif status == "zorlandim":
        word.next_review = datetime.utcnow() + timedelta(days=3)
        word.level = "medium"

    elif status == "bilmiyorum":
        word.next_review = datetime.utcnow() + timedelta(days=1)
        word.level = "weak"

    else:
        return {"error": "Geçersiz durum"}

    db.commit()
    db.refresh(word)

    return {
        "message": "Kelime güncellendi",
        "word": word
    }


@app.get("/reviews/today")
def today_reviews(db: Session = Depends(get_db)):
    today = datetime.utcnow()

    words = db.query(Word).filter(
        Word.next_review <= today
    ).all()

    return words


@app.delete("/words/{word_id}")
def delete_word(word_id: int, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()

    if not word:
        return {"error": "Kelime bulunamadı"}

    deleted_word = word.word

    db.delete(word)
    db.commit()

    return {
        "message": f"{deleted_word} silindi"
    }
        
@app.put("/words/{word_id}")
def update_word(word_id: int, data: WordUpdate, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()

    if not word:
        return {"error": "Kelime bulunamadı"}

    word.meaning = data.meaning
    word.synonym = data.synonym
    word.antonym = data.antonym
    word.example_sentence = data.example_sentence
    word.turkish_translation = data.turkish_translation

    db.commit()
    db.refresh(word)

    return {
        "message": "Kelime başarıyla güncellendi",
        "word": word
    }
    
@app.get("/words/weak")
def get_weak_words(db: Session = Depends(get_db)):
    words = db.query(Word).filter(Word.level == "weak").all()
    return words

@app.post("/words/load-default")
def load_default_words(db: Session = Depends(get_db)):
    file_path = os.path.join("data", "yds_words.csv")

    if not os.path.exists(file_path):
        return {
            "error": "yds_words.csv dosyası bulunamadı"
        }

    added = 0

    with open(file_path, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            word_text = row["word"].strip().lower()

            if not word_text:
                continue

            existing = db.query(Word).filter(Word.word == word_text).first()

            if existing:
                continue

            new_word = Word(
                word=word_text,
                meaning="Şimdilik boş",
                synonym="Şimdilik boş",
                antonym="Şimdilik boş",
                example_sentence="Şimdilik boş",
                turkish_translation="Şimdilik boş"
            )

            db.add(new_word)
            added += 1

    db.commit()

    return {
        "message": f"{added} kelime CSV dosyasından eklendi"
    }
    
@app.delete("/words/{word_id}")
def delete_word(word_id: int, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()

    if not word:
        return {"error": "Kelime bulunamadı"}

    deleted_word = word.word

    db.delete(word)
    db.commit()

    return {
        "message": f"{deleted_word} silindi"
    }


@app.put("/words/{word_id}")
def update_word(word_id: int, data: WordUpdate, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()

    if not word:
        return {"error": "Kelime bulunamadı"}

    word.meaning = data.meaning
    word.synonym = data.synonym
    word.antonym = data.antonym
    word.example_sentence = data.example_sentence
    word.turkish_translation = data.turkish_translation

    db.commit()
    db.refresh(word)

    return {
        "message": "Kelime başarıyla güncellendi",
        "word": word
    }


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Word).count()
    known = db.query(Word).filter(Word.level == "known").count()
    medium = db.query(Word).filter(Word.level == "medium").count()
    weak = db.query(Word).filter(Word.level == "weak").count()

    return {
        "total": total,
        "known": known,
        "medium": medium,
        "weak": weak
    }
    
@app.get("/stats/top-reviewed")
def get_top_reviewed_words(db: Session = Depends(get_db)):
    words = (
        db.query(Word)
        .order_by(Word.review_count.desc())
        .limit(5)
        .all()
    )

    return words