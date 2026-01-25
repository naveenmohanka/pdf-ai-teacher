
➡️ **Commit new file** click karo

---

# 🟢 STEP 2: Backend files upload karo

## 2️⃣ `backend/main.py`

- **Add file → Create new file**
- File name: `backend/main.py`

### Paste this 👇

```python
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "PDF AI Teacher backend running"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    text = ""
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"

    return {
        "message": "PDF processed successfully",
        "preview": text[:1500]
    }
