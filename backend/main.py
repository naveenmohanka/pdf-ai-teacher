from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from fastapi.responses import FileResponse
import edge_tts
import uuid

AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

async def generate_audio(text: str) -> str:
    filename = f"{uuid.uuid4()}.mp3"
    path = os.path.join(AUDIO_DIR, filename)

    communicate = edge_tts.Communicate(
        text=text,
        voice="en-IN-NeerjaNeural",  # 🔥 best Hinglish voice
        rate="+0%",
        pitch="+0Hz"
    )
    await communicate.save(path)
    return filename

import tempfile
from pdfminer.pdfparser import PDFSyntaxError
import os

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# 🔥 CORS – FINAL, SIMPLE, WORKING
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # GitHub Pages ke liye safe
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running (page-wise)"}


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


from fastapi import UploadFile, File, Query

@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    start_page: int = Query(0)
):
    try:
        # 🔥 STEP 1: read PDF bytes
        pdf_bytes = await file.read()

        # 🔥 STEP 2: write to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        # 🔥 STEP 3: open temp PDF safely
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

        # 🔥 cleanup temp file
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
        return {
            "status": "error",
            "explanation": "PDF corrupt lag raha hai ya valid PDF nahi hai."
        }

    except Exception as e:
        return {
            "status": "error",
            "explanation": f"PDF read error: {str(e)}"
        }
@app.get("/audio/{filename}")
def serve_audio(filename: str):
    path = os.path.join(AUDIO_DIR, filename)
    return FileResponse(path, media_type="audio/mpeg")
