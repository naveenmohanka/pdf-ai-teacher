from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pdfplumber
import tempfile
from pdfminer.pdfparser import PDFSyntaxError
import os
import uuid
import edge_tts
from openai import OpenAI

# =========================
# CONFIG
# =========================
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

VOICE_MAP = {
    "female": "en-IN-NeerjaNeural",
    "male": "en-IN-PrabhatNeural"
}

AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# =========================
# APP
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running (MP3 + gender + page-wise)"}

# =========================
# AI EXPLANATION (STYLE LOCKED 🔒)
# =========================
def explain_like_teacher(text: str) -> str:
    prompt = f"""
Tum ek real Indian teacher ho jo student ke saamne baithkar
naturally Hinglish me samjha raha hai.

Rules:
- Sirf Hinglish (no pure Hindi / no pure English)
- Bolne jaisa flow, notes jaisa nahi
- Friendly tone: dekho, samjho, simple si baat hai
- Bullet / numbering bilkul nahi

Content:
{text}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You speak like a friendly Indian teacher in Hinglish"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )
    return response.choices[0].message.content.strip()

# =========================
# MP3 GENERATION
# =========================
async def generate_audio(text: str, gender: str) -> str:
    voice = VOICE_MAP.get(gender, VOICE_MAP["female"])
    filename = f"{uuid.uuid4()}.mp3"
    path = os.path.join(AUDIO_DIR, filename)

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate="+0%",
        pitch="+0Hz"
    )
    await communicate.save(path)
    return filename

# =========================
# PAGE-WISE PDF API
# =========================
@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    start_page: int = Query(0)
):
    try:
        # STEP 1: read bytes
        pdf_bytes = await file.read()

        # STEP 2: temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        # STEP 3: read pdf
        with pdfplumber.open(tmp_path) as pdf:
            total_pages = len(pdf.pages)

            if start_page >= total_pages:
                os.remove(tmp_path)
                return {
                    "status": "done",
                    "total_pages": total_pages
                }

            page = pdf.pages[start_page]
            text = page.extract_text() or ""

            explanation = (
                explain_like_teacher(text[:1200])
                if text.strip()
                else "Is page me readable text nahi mila."
            )

        os.remove(tmp_path)

        # 🔊 AUDIO (OPTIONAL, SAFE)
        try:
            audio_file = await generate_audio(explanation)
            audio_url = f"/audio/{audio_file}"
        except Exception:
            audio_url = None   # 🔥 VERY IMPORTANT

        return {
            "status": "success",
            "explanation": explanation,
            "audio_url": audio_url,
            "next_page": start_page + 1,
            "total_pages": total_pages
        }

    except PDFSyntaxError:
        return {
            "status": "error",
            "explanation": "PDF corrupt lag raha hai ya valid PDF nahi hai."
        }

    except Exception as e:
        return {
            "status": "error",
            "explanation": f"PDF read error: {str(e)}"
        }


# =========================
# AUDIO SERVE
# =========================
@app.get("/audio/{filename}")
def serve_audio(filename: str):
    path = os.path.join(AUDIO_DIR, filename)
    return FileResponse(path, media_type="audio/mpeg")
