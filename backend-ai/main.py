from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import traceback

from routers import feedback, questions, transcribe

load_dotenv()

app = FastAPI(title="Interview Coach AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = traceback.format_exc()
    print("=" * 60)
    print("FULL ERROR:")
    print(error_detail)
    print("=" * 60)
    return JSONResponse(status_code=500, content={"detail": str(exc)})

app.include_router(feedback.router)
app.include_router(questions.router)
app.include_router(transcribe.router)

@app.get("/health")
def health():
    return {"status": "ok"}