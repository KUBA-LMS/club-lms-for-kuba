from fastapi import Request, HTTPException, status

from app.core.config import settings


def _get_whitelisted_ips() -> set[str]:
    raw = settings.ADMIN_IP_WHITELIST
    if not raw:
        return set()
    return {ip.strip() for ip in raw.split(",") if ip.strip()}


def check_ip_whitelist(request: Request) -> None:
    allowed = _get_whitelisted_ips()
    if not allowed:
        return

    client_ip = request.client.host if request.client else "unknown"

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    if client_ip not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: IP not whitelisted",
        )
