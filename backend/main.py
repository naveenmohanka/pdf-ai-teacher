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
    from fastapi.responses import Response

@app.options("/{path:path}")
async def options_handler(path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "https://naveenmohanka.github.io",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )

    allow_origins=[
        "https://naveenmohanka.github.io"
    ],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend running (text only)"}

# =========================
# AI EXPLANATION
# =========================
def explain_like_teacher(text: str) -> str:
    prompt = f"""
Tum ek real Indian teacher ho jo student ke saamne khade hoke
samjha raha hai.

IMPORTANT RULES (strict):
- Sirf Hinglish (Hindi + English mix) use karo
- Pure Hindi ya pure English bilkul mat likhna
- Bullet points, numbering, headings mat banana
- Aisa likho jaise bol rahe ho, notes jaise nahi
- Short sentences
- Friendly tone: "dekho", "samjho", "maan lo", "simple si baat hai"

Example style:
"Dekho, Election Commission ka kaam hota hai elections conduct karwana.
Iske liye voter ID use hota hai, jisme tumhari details hoti hain."

Ab ye content samjhao (spoken style me):

{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You explain like a real Indian teacher speaking to a student in Hinglish."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )

    return response.choices[0].message.content.strip()


# =========================
# PDF UPLOAD
# =========================
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    extracted_text = ""
    MAX_PAGES = 6        # 🔥 PDF page limit (very important)
    MAX_CHARS = 600     # 🔥 per chunk safe size

    # 1️⃣ Extract LIMITED pages only
    with pdfplumber.open(file.file) as pdf:
        for i, page in enumerate(pdf.pages):
            if i >= MAX_PAGES:
                break
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    if not extracted_text.strip():
        return {
            "status": "error",
            "explanation": "PDF se text read nahi ho pa raha",
            "audio_url": None
        }

    # 2️⃣ Chunking
    chunks = [
        extracted_text[i:i + MAX_CHARS]
        for i in range(0, len(extracted_text), MAX_CHARS)
    ]

    explanations = []

    # 🔥 max 3 chunks only
    for chunk in chunks[:3]:
        explanations.append(explain_like_teacher(chunk))

    final_explanation = "\n\n".join(explanations)

    # 🔥 HARD LIMIT for safety
    final_explanation = final_explanation[:1200]

    return {
        "status": "success",
        "explanation": final_explanation
    }
