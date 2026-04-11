import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter()


class TranscribeResponse(BaseModel):
    text: str


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    provider = os.getenv("LLM_PROVIDER", "mock")

    if provider == "mock":
        # Return a mock transcription — no API key needed
        return TranscribeResponse(
            text="This is a mock transcription of your voice answer. "
                 "In production, this will be replaced with real Whisper transcription. "
                 "You can still type your answer manually in the text box."
        )

    try:
        from openai import OpenAI
        import tempfile

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        audio_bytes = await audio.read()

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text",
            )
        os.unlink(tmp_path)
        return TranscribeResponse(text=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))