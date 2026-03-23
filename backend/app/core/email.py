import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _send_smtp(to_email: str, subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())


async def send_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return
    await asyncio.to_thread(_send_smtp, to_email, subject, html_body)


async def send_password_reset_email(to_email: str, reset_token: str) -> None:
    reset_url = f"{settings.FRONTEND_BASE_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>비밀번호 재설정</h2>
      <p>아래 버튼을 눌러 비밀번호를 재설정하세요. 링크는 30분간 유효합니다.</p>
      <a href="{reset_url}"
         style="display:inline-block;padding:12px 24px;background:#000;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:bold;">
        비밀번호 재설정
      </a>
      <p style="margin-top:24px;color:#8e8e93;font-size:12px;">
        본인이 요청하지 않았다면 이 메일을 무시하세요.
      </p>
    </div>
    """
    await send_email(to_email, "[ClubX] 비밀번호 재설정 안내", html)
