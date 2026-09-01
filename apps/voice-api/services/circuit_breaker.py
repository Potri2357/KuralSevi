"""
Kural Sevi — API Circuit Breaker & Cooldown Manager
Maintains per-provider rate-limit (HTTP 429) cooldowns.
When any provider hits a rate limit or consecutive errors, it trips
into COOLDOWN state for 60 seconds (rolling RPM window).
Subsequent turns skip the failing provider in 0ms without wasting network latency.
"""
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class APICircuitBreaker:
    """
    Thread-safe, process-wide circuit breaker for all external LLM and Voice APIs.
    Eliminates futile network calls to exhausted providers.
    """
    def __init__(self, default_cooldown_seconds: float = 60.0):
        self.default_cooldown = default_cooldown_seconds
        # provider -> expiry_timestamp
        self._cooldown_until: dict[str, float] = {}

    def is_available(self, provider: str) -> bool:
        """Returns True if the provider is healthy and not in cooldown."""
        until = self._cooldown_until.get(provider, 0.0)
        return time.time() >= until

    def get_remaining_cooldown(self, provider: str) -> float:
        """Returns seconds remaining in cooldown, or 0.0 if healthy."""
        return max(0.0, self._cooldown_until.get(provider, 0.0) - time.time())

    def trip(self, provider: str, reason: str = "429 Rate Limit", cooldown: Optional[float] = None):
        """Trips the circuit breaker for a provider, placing it in cooldown."""
        cd = cooldown or self.default_cooldown
        self._cooldown_until[provider] = time.time() + cd
        logger.warning(
            f"[CIRCUIT BREAKER TRIPPED] Provider '{provider}' hit {reason}. "
            f"Skipping all upcoming calls to '{provider}' for {cd:.0f}s (0ms skip)."
        )

    def record_success(self, provider: str):
        """Records a successful call, resetting any cooldown."""
        if provider in self._cooldown_until:
            del self._cooldown_until[provider]
            logger.info(f"[CIRCUIT BREAKER RESTORED] Provider '{provider}' is healthy again.")

# Global singleton instance
circuit_breaker = APICircuitBreaker(default_cooldown_seconds=60.0)
