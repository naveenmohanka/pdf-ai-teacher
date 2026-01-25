from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pdfplumber
import os
import uuid
import asyncio
from openai import OpenAI
import edge_tts

# =========================
# CONFIG
# =========================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

AUDIO_DIR = "audio_files"
os.makedirs(AUDIO_DIR, exist_ok=True)

# =========================
# APP INIT
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://naveenmohanka.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running with Hinglish voice"}

# =========================
# AI EXPLANATION
# =========================
def explain_like_teacher(text: str) -> str:
    prompt = f"""
Tum ek friendly Indian teacher ho.

Task:
Neeche diye gaye PDF content ko
bilkul simple Hinglish me samjhao,
jaise tum student se directly baat kar rahe ho.

Rules:
- Hindi + English mix (Hinglish)
- Bahut formal mat banna
- Short paragraphs
- Examples use karo
- Aisa lagna chahiye jaise real teacher samjha raha ho

Content:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a friendly Indian teacher who explains concepts casually in Hinglish."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    return response.choices[0].message.content.strip()

# =========================
# TEXT TO SPEECH
# =========================
async def text_to_speech(text: str, filename: str):
    voice = "en-IN-NeerjaNeural"
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate="+0%",
        pitch="+0Hz"
    )
    await communicate.save(filename)


# =========================
# PDF UPLOAD
# =========================
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    extracted_text = ""

    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    # ---- SAFE CHUNKING LOGIC ----
    MAX_CHARS = 700
    chunks = [
        extracted_text[i:i + MAX_CHARS]
        for i in range(0, len(extracted_text), MAX_CHARS)
    ]

    explanations = []

    # max 5 chunks = backend safe + fast
    for chunk in chunks[:5]:
        try:
            exp = explain_like_teacher(chunk)
            explanations.append(exp)
        except Exception as e:
            print("AI error:", e)

    final_explanation = "\n\n".join(explanations)

    # ---- VOICE ----
    audio_file = f"audio_{uuid.uuid4()}.mp3"
    await text_to_speech(final_explanation, audio_file)

    return {
        "status": "success",
        "explanation": final_explanation,
        "audio_url": f"/audio/{audio_file}"
    }


    # Limit text for speed (Render friendly)
    explanation = explain_like_teacher(extracted_text[:1200])

    audio_filename = f"{uuid.uuid4()}.mp3"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)

    await text_to_speech(explanation, audio_path)

    return {
        "status": "success",
        "explanation": explanation,
        "audio_file": audio_filename
    }

# =========================
# AUDIO SERVE
# =========================
@app.get("/audio/{audio_file}")
def get_audio(audio_file: str):
    file_path = os.path.join(AUDIO_DIR, audio_file)

    if not os.path.exists(file_path):
        return {"error": "Audio file not found"}

    return FileResponse(file_path, media_type="audio/mpeg")
