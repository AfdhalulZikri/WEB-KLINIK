import re
from datetime import datetime, time
from typing import Optional

HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
STATUS = ["Menunggu", "Dikonfirmasi", "Selesai", "Dibatalkan"]

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def valid_email(value: str) -> bool:
    return bool(_EMAIL_RE.match(value or ""))


def parse_time(value: str) -> Optional[time]:
    """Ubah 'HH:MM' (atau 'HH:MM:SS') menjadi objek time. None jika tidak valid."""
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime((value or "").strip(), fmt).time()
        except ValueError:
            continue
    return None


def hhmm(t: Optional[time]) -> Optional[str]:
    return t.strftime("%H:%M") if t else None
