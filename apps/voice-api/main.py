"""
Kural Sevi — Voice Orchestration API
FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.twilio_router import router as twilio_router
from routers.whatsapp_router import router as whatsapp_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Kural Sevi Voice API starting up...")
    yield
    logger.info("Kural Sevi Voice API shutting down...")

app = FastAPI(
    title="Kural Sevi Voice API",
    description="AI-driven voice interview service for PM-AJAY GIA livelihood mapping",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(twilio_router)
app.include_router(whatsapp_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "kural-sevi-voice-api"}

@app.get("/")
async def root():
    return {"name": "Kural Sevi Voice API", "version": "1.0.0", "channels": ["IVR (Twilio)", "WhatsApp Business API"], "languages": ["Tamil (ta)", "Hindi (hi)", "Telugu (te)"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
