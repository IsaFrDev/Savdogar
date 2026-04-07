"""Helpers for WebAuthn credential id encoding (URL-safe base64 vs legacy)."""
from __future__ import annotations

import base64
from typing import Optional, Set

from django.contrib.auth import get_user_model

User = get_user_model()


def _pad_b64(s: str) -> str:
    pad = (4 - len(s) % 4) % 4
    return s + "=" * pad


def decode_credential_id_bytes(stored: str) -> bytes:
    """Decode a stored credential id whether it was saved as standard or URL-safe base64."""
    s = stored.strip().replace(" ", "")
    last_err: Exception | None = None
    for decoder in (base64.urlsafe_b64decode, base64.b64decode):
        try:
            return decoder(_pad_b64(s))
        except Exception as e:
            last_err = e
    raise ValueError(last_err or "invalid credential id")


def credential_id_match_variants(client_id: str) -> Set[str]:
    """Possible string forms in DB for the same raw credential id (legacy + new)."""
    out: Set[str] = set()
    s = (client_id or "").strip()
    if not s:
        return out
    out.add(s)
    try:
        raw = decode_credential_id_bytes(s)
        u = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
        out.add(u)
        out.add(base64.urlsafe_b64encode(raw).decode("ascii"))
        out.add(base64.b64encode(raw).decode("ascii"))
    except Exception:
        pass
    return out


def find_user_by_credential_id(client_id: str) -> Optional[User]:
    variants = credential_id_match_variants(client_id)
    if not variants:
        return None
    return User.objects.filter(face_id_credential_id__in=list(variants)).first()


def store_credential_id(raw: bytes) -> str:
    """Canonical storage: unpadded URL-safe base64."""
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
