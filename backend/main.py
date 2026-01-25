from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
import uuid
import asyncio
from openai import OpenAI
import edge_tts
from fastapi.responses import FileResponse

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
    return {"message": "PDF AI Teacher backend running with voice"}

def explain_like_teacher(text: str):
    prompt = f"""
Explain the following content like a teacher.
Use very easy Hinglish (Hindi + English mix).
Explain slowly and clearly.

Content:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a friendly teacher who explains slowly."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


async def text_to_speech(text: str, filename: str):
    voice = "en-IN-NeerjaNeural"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filename)


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    extracted_text = ""

    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    explanation = explain_like_teacher(extracted_text[:1000])

    audio_file = f"audio_{uuid.uuid4()}.mp3"
    await text_to_speech(explanation, audio_file)

    return {
        "status": "success",
        "explanation": explanation,
        "audio_url": f"/audio/{audio_file}"
    }


@app.get("/audio/{audio_file}")
def get_audio(audio_file: str):
    return FileResponse(audio_file, media_type="audio/mpeg")
