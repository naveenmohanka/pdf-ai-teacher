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
    allow_origins=["*"],   # 🔥 debug phase
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

Neeche diye gaye content ko bilkul simple Hinglish me samjhao,
jaise tum student se directly baat kar rahe ho.

Rules:
- Hindi + English mix
- Short paragraphs
- Easy examples
- Casual teacher tone

Content:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Friendly Indian teacher explaining in Hinglish"},
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
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate="+0%",
        pitch="+0Hz"
    )
    await communicate.save(filepath)

# =========================
# PDF UPLOAD
# =========================
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    extracted_text = ""

    # 1️⃣ Extract text
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    # 2️⃣ SAFE LIMITS (BIG PDF FRIENDLY)
    MAX_CHARS = 600
    MAX_CHUNKS = 3   # 🔥 hard limit (Render safe)

    chunks = [
        extracted_text[i:i + MAX_CHARS]
        for i in range(0, len(extracted_text), MAX_CHARS)
    ]

    explanations = []

    for chunk in chunks[:MAX_CHUNKS]:
        explanations.append(explain_like_teacher(chunk))

    final_explanation = "\n\n".join(explanations)

    # 🔥 audio safe length
    final_explanation = final_explanation[:1200]

    # 3️⃣ Generate voice (CORRECT PATH)
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

    if not os.path.exists(file_path):
        return {"error": "Audio file not found"}

    return FileResponse(file_path, media_type="audio/mpeg")
