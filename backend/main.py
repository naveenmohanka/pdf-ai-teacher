from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pdfplumber
import os
import uuid
import edge_tts
from openai import OpenAI

# =========================
# CONFIG
# =========================
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

AUDIO_DIR = "audio_files"
os.makedirs(AUDIO_DIR, exist_ok=True)

# =========================
# APP INIT
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://naveenmohanka.github.io"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running (text + voice)"}

# =========================
# AI EXPLANATION
# =========================
def explain_like_teacher(text: str) -> str:
    prompt = f"""
Tum ek real Indian teacher ho jo student ke saamne khade hoke
samjha raha hai.

IMPORTANT RULES (strict):
- Sirf Hinglish (Hindi + English mix)
- Pure Hindi ya pure English bilkul nahi
- Notes / bullet style nahi
- Aisa likho jaise bol rahe ho
- Short sentences
- Friendly tone: dekho, samjho, simple si baat hai

Example:
"Dekho, Election Commission ka kaam hota hai elections conduct karwana."

Ab ye content samjhao:

{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a real Indian teacher speaking naturally in Hinglish."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )

    return response.choices[0].message.content.strip()

# =========================
# TEXT TO SPEECH (OLD BEST VOICE)
# =========================
async def text_to_speech(text: str, filepath: str):
    communicate = edge_tts.Communicate(
        text=text,
        voice="en-IN-NeerjaNeural",
        rate="-5%",     # teacher-like slow
        pitch="+0Hz"
    )
    await communicate.save(filepath)

# =========================
# PDF UPLOAD
# =========================
@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    start_page: int = 0
):
    extracted_text = ""
    PAGES_PER_REQUEST = 2     # 🔥 VERY IMPORTANT
    MAX_CHARS = 800

    with pdfplumber.open(file.file) as pdf:
        end_page = min(start_page + PAGES_PER_REQUEST, len(pdf.pages))

        for i in range(start_page, end_page):
            text = pdf.pages[i].extract_text()
            if text:
                extracted_text += text + "\n"

    if not extracted_text.strip():
        return {
            "status": "done",
            "explanation": "",
            "next_page": None
        }

    # chunking
    chunks = [
        extracted_text[i:i + MAX_CHARS]
        for i in range(0, len(extracted_text), MAX_CHARS)
    ]

    explanations = []
    for chunk in chunks[:2]:   # 🔥 safe
        explanations.append(explain_like_teacher(chunk))

    final_explanation = "\n\n".join(explanations)
    final_explanation = final_explanation[:1200]

    return {
        "status": "success",
        "explanation": final_explanation,
        "next_page": end_page
    }

# =========================
# AUDIO SERVE
# =========================
@app.get("/audio/{audio_file}")
def get_audio(audio_file: str):
    file_path = os.path.join(AUDIO_DIR, audio_file)
    return FileResponse(file_path, media_type="audio/mpeg")
