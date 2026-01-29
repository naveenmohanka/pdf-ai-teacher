from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import tempfile
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# CORS (GitHub Pages safe)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "PDF AI Teacher running (page-wise, text only)"}


def explain_like_teacher(text: str) -> str:
    prompt = f"""
Tum ek real Indian teacher ho jo naturally Hinglish me
student ko samjha raha hai.

Rules:
- Sirf Hinglish
- Bolne jaisa flow
- Friendly words: dekho, samjho, simple si baat hai
- Bullet / numbering mat use karo

Content:
{text}
"""
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a friendly Indian teacher."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )
    return res.choices[0].message.content.strip()


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

        return {
            "status": "success",
            "explanation": explanation,
            "next_page": start_page + 1,
            "total_pages": total_pages
        }

   except Exception as e:
    if "insufficient_quota" in str(e):
        return {
            "status": "error",
            "explanation": "⚠️ AI quota khatam ho gaya hai. Please billing enable karo."
        }
    return {"status": "error", "explanation": str(e)}
