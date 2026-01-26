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

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running (MP3 enabled)"}


# =========================
# AI EXPLANATION (UNCHANGED STYLE)
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
async def generate_audio(text: str) -> str:
    filename = f"{uuid.uuid4()}.mp3"
    path = os.path.join(AUDIO_DIR, filename)

    communicate = edge_tts.Communicate(
        text=text,
        voice="en-IN-NeerjaNeural",   # 🔥 best Hinglish voice
        rate="+0%",
        pitch="+0Hz"
    )
    await communicate.save(path)
    return filename


# =========================
# PDF PAGE-WISE API
# =========================
@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    start_page: int = Query(0)
):
    try:
        pdf_bytes = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        with pdfplumber.open(tmp_path) as pdf:
            total_pages = len(pdf.pages)

            if start_page >= total_pages:
                os.remove(tmp_path)
                return {"status": "done", "total_pages": total_pages}

            page = pdf.pages[start_page]
            text = page.extract_text() or ""

            explanation = (
                explain_like_teacher(text[:1200])
                if text.strip()
                else "Is page me readable text nahi mila."
            )

        os.remove(tmp_path)

        audio_file = await generate_audio(explanation)

        return {
            "status": "success",
            "explanation": explanation,
            "audio_url": f"/audio/{audio_file}",
            "next_page": start_page + 1,
            "total_pages": total_pages
        }

    except PDFSyntaxError:
        return {"status": "error", "explanation": "PDF corrupt lag raha hai."}

    except Exception as e:
        return {"status": "error", "explanation": str(e)}


# =========================
# AUDIO SERVE
# =========================
@app.get("/audio/{filename}")
def serve_audio(filename: str):
    path = os.path.join(AUDIO_DIR, filename)
    return FileResponse(path, media_type="audio/mpeg")
