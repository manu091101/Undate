"""Unit tests for the safety regex layer.

These cases are pulled from real romance-scam playbooks and Lumin's
moderation team's collected adversarial set. If you add a new attack
class, add a test here first."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from lumin_ml.safety import classify, regex_layer


class TestRegexLayer:
    def test_clean_message(self) -> None:
        r = regex_layer("I had a lovely time on Sunday — thanks for the book recommendation.")
        assert r.verdict == "allow"
        assert r.reasons == []

    def test_phone_redirect(self) -> None:
        r = regex_layer("Text me at +65 9123 4567 instead, easier.")
        assert r.verdict == "review"
        assert "phone_number_detected" in r.reasons

    def test_email_redirect(self) -> None:
        r = regex_layer("My email is alex@personal.example, message me there.")
        assert r.verdict == "review"
        assert "email_detected" in r.reasons

    def test_telegram_redirect(self) -> None:
        r = regex_layer("Find me on Telegram @alex_says")
        assert r.verdict == "review"
        assert "telegram_redirect" in r.reasons

    def test_whatsapp_redirect(self) -> None:
        r = regex_layer("Add me on Whatsapp — easier to chat")
        assert r.verdict == "review"
        assert "whatsapp_redirect" in r.reasons

    def test_romance_scam_money_request(self) -> None:
        r = regex_layer(
            "Hi love, I'm stuck overseas and need help with hospital fees, please send 500 USD."
        )
        assert r.verdict == "block"
        assert "scam_vocab" in r.reasons
        assert r.score >= 0.9

    def test_crypto_scam(self) -> None:
        r = regex_layer("Have you heard of this great investment opportunity in crypto wallet returns?")
        assert r.verdict == "block"
        assert "scam_vocab" in r.reasons

    def test_iban_detected(self) -> None:
        r = regex_layer("Transfer to GB82WEST12345698765432, urgent please.")
        assert r.verdict == "block"
        assert "iban_detected" in r.reasons


class TestAdversarialBypass:
    """Attacks from the security audit. Each PR that changes safety.py should
    leave these passing."""

    def test_unicode_homoglyph_telegram(self) -> None:
        # Cyrillic 'е' (U+0435) substituted for Latin 'e'. Visually identical.
        r = regex_layer("find me on Tеlеgram @luminbypass")
        assert r.verdict == "review"
        assert "telegram_redirect" in r.reasons

    def test_zero_width_whatsapp(self) -> None:
        # Zero-width spaces between every letter.
        r = regex_layer("W​h​a​t​s​A​p​p me later")
        assert r.verdict == "review"
        assert "whatsapp_redirect" in r.reasons

    def test_leetspeak_whatsapp(self) -> None:
        r = regex_layer("Wh4ts4pp me on +91 9876543210")
        assert r.verdict == "review"

    def test_url_shortener_redirect(self) -> None:
        r = regex_layer("here's where I really chat: bit.ly/3xY9Qa — message me there")
        assert "url_shortener" in r.reasons

    def test_character_separator(self) -> None:
        r = regex_layer("t.e.l.e.g.r.a.m @scammer")
        assert "telegram_redirect" in r.reasons


class TestClassify:
    def test_clean_passes(self) -> None:
        assert classify("Looking forward to dinner Friday.").verdict == "allow"

    def test_layered_block(self) -> None:
        # multiple signals — must escalate to block via regex layer
        r = classify("My WhatsApp is +65 9123 4567 — send 500 USDT today")
        assert r.verdict == "block"
