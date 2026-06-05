import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_word_info(word: str):
    prompt = f"""
    YDS ve YÖKDİL çalışan bir öğrenci için "{word}" kelimesini analiz et.

    Sadece geçerli JSON döndür. Açıklama yazma.

    Format:
    {{
      "meaning": "Türkçe anlam",
      "synonym": "İngilizce eş anlamlılar",
      "antonym": "İngilizce zıt anlamlılar",
      "example_sentence": "YDS/YÖKDİL tarzı İngilizce örnek cümle",
      "turkish_translation": "Örnek cümlenin Türkçe çevirisi"
    }}
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )

    text = response.text.strip()

    if text.startswith("```json"):
        text = text.replace("```json", "").replace("```", "").strip()

    return json.loads(text)