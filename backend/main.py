from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "PDF AI Teacher backend is running"}
