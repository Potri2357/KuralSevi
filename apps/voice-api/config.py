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
    
    # Exotel Telephony
    exotel_account_sid: str = "incogvia1"
    exotel_api_key: Optional[str] = None
    exotel_api_token: Optional[str] = None
    exotel_caller_id: str = "08047289241"
    exotel_app_id: Optional[str] = None
    exotel_trial_number: Optional[str] = None
    exotel_trial_pin: Optional[str] = None
    telephony_provider: str = "exotel"
    
    # WhatsApp (Self-Hosted Baileys Bot)
    whatsapp_bot_url: str = "http://localhost:5005"
    
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
    
    # Open-Source SMS Gateway (Android SMS Gateway / Local Hub)
    sms_gateway_url: str = "http://localhost:5005"
    android_sms_gateway_url: Optional[str] = None
    android_sms_gateway_login: Optional[str] = None
    android_sms_gateway_password: Optional[str] = None
    sms_provider: str = "open-source"
    fast2sms_api_key: Optional[str] = None
    
    # Feature flags
    enable_mock_stt: bool = False
    enable_mock_tts: bool = False
    enable_mock_llm: bool = False
    
    class Config:
        env_file = _ROOT_ENV
        case_sensitive = False
        extra = "ignore"

settings = Settings()
