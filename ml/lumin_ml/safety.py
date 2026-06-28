"""Safety classifiers for content moderation.

Production stack (online inference):
  1. Llama-Guard-3-1B (distilled) — harassment, sexual content, self-harm.
  2. Custom RoBERTa fine-tune — romance scam / off-platform redirect.
  3. Regex deny-list — phone, email, Telegram handle, IBAN, wire instructions.

The training surface lives here; production deploys go to Bedrock or a
Triton GPU pool depending on cost band.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Literal

SafetyVerdict = Literal["allow", "review", "block"]


@dataclass(frozen=True)
class SafetyResult:
    verdict: SafetyVerdict
    reasons: list[str]
    score: float  # 0=safe, 1=unsafe


# ─── Normalization layer (run before all regex) ─────────────────────────────
# Strips zero-width chars + bidi controls, NFKC-normalizes homoglyphs,
# canonicalizes leetspeak digits to letters in alphabetic contexts.
_ZERO_WIDTH = re.compile(r"[​-‏‪-‮⁠﻿]")
_CHAR_SEPARATORS = re.compile(r"(?<=\w)[\s\.\-_]+(?=\w)")  # "T e l e g r a m" → "Telegram"
_LEET_MAP = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a"})


def normalize(text: str) -> str:
    """Idempotent canonical form for regex matching."""
    text = _ZERO_WIDTH.sub("", text)
    text = unicodedata.normalize("NFKC", text)
    text = _CHAR_SEPARATORS.sub("", text)
    return text


def _leet_variant(text: str) -> str:
    """Translate likely-leetspeak digits back to letters. Lossy; only for matching."""
    return text.translate(_LEET_MAP)


# ─── Pattern bank ───────────────────────────────────────────────────────────
_PHONE = re.compile(r"\+?\d[\d \-().]{7,}")
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_TELEGRAM = re.compile(r"(?i)(?:t\.me/|telegram[^\w]{0,3}@?[a-z0-9_]{4,32}|@[a-z0-9_]{4,32}.*?telegram)")
_WHATSAPP = re.compile(r"(?i)(whatsapp|wa\.me/|wa\.link/|chat\.whatsapp)")
_IBAN = re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b")
_SHORTENER = re.compile(
    r"(?i)\b(?:bit\.ly|tinyurl\.com|t\.co|lnkd\.in|goo\.gl|is\.gd|buff\.ly|ow\.ly|"
    r"shorturl\.at|cutt\.ly|rebrand\.ly|qr\.io)/[A-Za-z0-9_-]{3,}"
)
_SCAM_VOCAB = re.compile(
    r"(?i)\b(send|wire|transfer|gift card|bitcoin|crypto wallet|usdt|investment opportunity|"
    r"emergency|hospital fees|customs|stuck overseas|loan|urgent help)\b"
)


def regex_layer(text: str) -> SafetyResult:
    """Run normalize → pattern bank. Also tries a leet-translated variant so
    'T3l3gr4m' and 'Wh4ts4pp' don't slip through."""
    canonical = normalize(text)
    canonical_leet = _leet_variant(canonical)

    reasons: list[str] = []
    if _PHONE.search(canonical):
        reasons.append("phone_number_detected")
    if _EMAIL.search(canonical):
        reasons.append("email_detected")
    if _TELEGRAM.search(canonical) or _TELEGRAM.search(canonical_leet):
        reasons.append("telegram_redirect")
    if _WHATSAPP.search(canonical) or _WHATSAPP.search(canonical_leet):
        reasons.append("whatsapp_redirect")
    if _IBAN.search(canonical):
        reasons.append("iban_detected")
    if _SCAM_VOCAB.search(canonical):
        reasons.append("scam_vocab")
    if _SHORTENER.search(canonical):
        reasons.append("url_shortener")

    if not reasons:
        return SafetyResult(verdict="allow", reasons=[], score=0.0)

    high_severity = {"iban_detected", "scam_vocab"}
    severity = 0.95 if any(r in reasons for r in high_severity) else 0.6
    verdict: SafetyVerdict = "block" if severity > 0.9 else "review"
    return SafetyResult(verdict=verdict, reasons=reasons, score=severity)


def classify(text: str) -> SafetyResult:
    """Front door. ML layers (Llama-Guard-3, scam RoBERTa) are chained here
    when the artifacts exist; today only the regex layer runs."""
    r1 = regex_layer(text)
    if r1.verdict == "block":
        return r1
    return r1
