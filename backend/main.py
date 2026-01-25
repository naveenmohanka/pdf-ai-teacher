from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from openai import OpenAI

# =========================
# CONFIG
# =========================
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MAX_PAGES_PER_CALL = 1     # 🔥 ek request me sirf 1 page
MAX_CHARS = 900            # 🔥 safe token limit

# =========================
# APP INIT
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://naveenmohanka.github.io"],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running (page-wise)"}

# =========================
# AI EXPLANATION (DO NOT TOUCH STYLE)
# =========================
def explain_like_teacher(text: str) -> str:
    prompt = f"""
Tum ek real Indian teacher ho jo student ke saamne khade hoke
samjha raha hai.

IMPORTANT RULES (strict):
- Sirf Hinglish (Hindi + English mix)
- Notes / bullet / heading bilkul nahi
- Bolne jaisa natural flow
- Friendly words: dekho, samjho, arre bhai, simple si baat hai
- Short sentences
- Human tone (AI jaisa nahi)

Example:
"Dekho, Election Commission ka kaam hota hai elections conduct karwana..."

Ab ye content samjhao (spoken style me):

{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a friendly Indian teacher speaking naturally in Hinglish."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )

    return response.choices[0].message.content.strip()

# =========================
# PDF UPLOAD (PAGE-WISE)
# =========================
@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    start_page: int = Query(0)
):
    with pdfplumber.open(file.file) as pdf:
        total_pages = len(pdf.pages)

        # 🔚 agar sab pages ho gaye
        if start_page >= total_pages:
            return {
                "status": "done",
                "message": "PDF complete"
            }

        extracted_text = ""

        end_page = min(start_page + MAX_PAGES_PER_CALL, total_pages)

        for i in range(start_page, end_page):
            page_text = pdf.pages[i].extract_text()
            if page_text:
                extracted_text += page_text + "\n"

    if not extracted_text.strip():
        return {
            "status": "error",
            "explanation": "Is page se readable text nahi mila"
        }

    # 🔥 hard safety cut
    extracted_text = extracted_text[:MAX_CHARS]

    explanation = explain_like_teacher(extracted_text)

    return {
        "status": "success",
        "explanation": explanation,
        "next_page": end_page,
        "total_pages": total_pages
    }
