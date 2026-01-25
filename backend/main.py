from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pdfplumber
import os
import uuid
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
    allow_origins=["*"],   # 🔥 IMPORTANT
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running"}

# =========================
# AI EXPLANATION
# =========================
def explain_like_teacher(text: str) -> str:
    prompt = f"""
Tum ek friendly Indian teacher ho.

Neeche diye gaye content ko simple Hinglish me samjhao.
Bilkul aise jaise tum student se baat kar rahe ho.
Examples use karo.

Content:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Friendly Indian teacher"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    return response.choices[0].message.content.strip()

# =========================
# TEXT TO SPEECH
# =========================
async def text_to_speech(text: str, filepath: str):
    voice = "en-IN-NeerjaNeural"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)

# =========================
# PDF UPLOAD
# =========================
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    extracted_text = ""

    # 1️⃣ Extract text from PDF
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    # 2️⃣ SAFE LIMITS FOR BIG PDF
    MAX_CHARS = 700
    chunks = [
        extracted_text[i:i + MAX_CHARS]
        for i in range(0, len(extracted_text), MAX_CHARS)
    ]

    explanations = []

    for chunk in chunks[:3]:   # 🔥 max 3 chunks only
        explanations.append(explain_like_teacher(chunk))

    final_explanation = "\n\n".join(explanations)

    # 🔥 limit audio length (VERY IMPORTANT)
    final_explanation = final_explanation[:1500]

    # 3️⃣ Generate voice
    audio_file = f"audio_{uuid.uuid4()}.mp3"
    await text_to_speech(final_explanation, audio_file)

    return {
        "status": "success",
        "explanation": final_explanation,
        "audio_url": f"/audio/{audio_file}"
    }


    # ---- AUDIO ----
    audio_filename = f"{uuid.uuid4()}.mp3"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)

    await text_to_speech(final_explanation, audio_path)

    return {
        "status": "success",
        "explanation": final_explanation,
        "audio_url": f"/audio/{audio_filename}"
    }

# =========================
# AUDIO SERVE
# =========================
@app.get("/audio/{audio_file}")
def get_audio(audio_file: str):
    file_path = os.path.join(AUDIO_DIR, audio_file)
    return FileResponse(file_path, media_type="audio/mpeg")
