"""
Kural Sevi — Voice API Configuration
All settings loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional

from pathlib import Path

_ROOT_ENV = str(Path(__file__).resolve().parent.parent.parent / ".env")

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    
    # Google AI
    google_ai_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    
    # Sarvam AI
    sarvam_api_key: str
    sarvam_stt_url: str = "https://api.sarvam.ai/speech-to-text"
    sarvam_tts_url: str = "https://api.sarvam.ai/text-to-speech"
    
    # Twilio
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_phone_number: str
    twilio_whatsapp_number: str = "whatsapp:+14155238886"
    
    # WhatsApp
    whatsapp_api_token: str = "your-whatsapp-token"
    whatsapp_phone_number_id: str = "your-phone-number-id"
    whatsapp_webhook_verify_token: str = "your-verify-token"
    
    # Application
    app_url: str = "http://localhost:3000"
    voice_api_url: str = "http://localhost:8000"
    officer_sla_days: int = 3
    consent_hmac_secret: str = "5464573cffb4fba56d24ecb7adb35bfdbfea904dc52e5fb07aa5c9a470070b8e"
    
    # Groq Fallback
    groq_api_key: Optional[str] = None
    groq_model: str = "qwen/qwen3.8-27b"
    
    # OpenRouter Fallback
    openrouter_api_key: Optional[str] = None
    openrouter_model: str = "meta-llama/llama-3.3-70b-instruct"
    
    # Feature flags
    enable_mock_stt: bool = False
    enable_mock_tts: bool = False
    enable_mock_llm: bool = False
    
    class Config:
        env_file = _ROOT_ENV
        case_sensitive = False
        extra = "ignore"

settings = Settings()
