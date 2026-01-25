from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend is running"}

def explain_like_teacher(text: str):
    prompt = f"""
Explain the following content like a teacher.
Use very easy Hinglish (mix of Hindi + English).
Give simple meaning and a small example if possible.

Content:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a friendly teacher."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    extracted_text = ""

    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    # Sirf first part explain karte hain (demo ke liye)
    explanation = explain_like_teacher(extracted_text[:1000])

    return {
        "status": "success",
        "explanation": explanation
    }
