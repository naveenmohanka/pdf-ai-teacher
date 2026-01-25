from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from openai import OpenAI

# =========================
# CONFIG
# =========================
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# =========================
# APP INIT
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://naveenmohanka.github.io"],
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
Tum ek real Indian teacher ho jo bolke samjha raha hai.

Rules:
- Sirf Hinglish
- Notes jaise mat likhna
- Bullet / numbering nahi
- Friendly spoken tone

Text:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You explain like a real Indian teacher in Hinglish"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )

    return response.choices[0].message.content.strip()

# =========================
# PDF UPLOAD (PAGE BATCHING)
# =========================
@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    start_page: int = 0
):
    extracted_text = ""
    PAGES_PER_REQUEST = 2
    MAX_CHARS = 700

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

    chunks = [
        extracted_text[i:i + MAX_CHARS]
        for i in range(0, len(extracted_text), MAX_CHARS)
    ]

    explanations = []
    for chunk in chunks[:2]:
        explanations.append(explain_like_teacher(chunk))

    final_explanation = "\n\n".join(explanations)
    final_explanation = final_explanation[:1200]

    return {
        "status": "success",
        "explanation": final_explanation,
        "next_page": end_page
    }
