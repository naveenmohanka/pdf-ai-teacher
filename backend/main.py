from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber

app = FastAPI()

# CORS (taaki future frontend connect ho sake)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend is running"}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    extracted_text = ""

    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    return {
        "status": "success",
        "preview": extracted_text[:1500]
    }

Add PDF upload and text extraction
