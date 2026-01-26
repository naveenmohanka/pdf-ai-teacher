from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
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


@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    start_page: int = Query(0)
):
    with pdfplumber.open(file.file) as pdf:
        total_pages = len(pdf.pages)

        # 🔚 PDF khatam
        if start_page >= total_pages:
            return {
                "status": "done",
                "total_pages": total_pages
            }

        page = pdf.pages[start_page]
        text = page.extract_text()

        if not text or not text.strip():
            explanation = "Is page me readable text nahi mila."
        else:
            explanation = explain_like_teacher(text[:1200])  # 🔥 HARD LIMIT

    return {
        "status": "success",
        "explanation": explanation,
        "next_page": start_page + 1,
        "total_pages": total_pages
    }
