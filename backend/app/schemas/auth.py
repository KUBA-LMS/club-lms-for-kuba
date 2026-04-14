import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from app.schemas.user import UserResponse


# Password policy enforced on every server-side password entry point:
# * at least 8 characters
# * at least one letter AND one digit
# * at least one non-alphanumeric character
# * not one of a small denylist of trivially weak passwords
_WEAK_PASSWORDS = {
    "password", "password1", "12345678", "qwerty123", "iloveyou",
    "admin123", "letmein1", "welcome1", "abcd1234",
}
_HAS_LETTER = re.compile(r"[A-Za-z]")
_HAS_DIGIT = re.compile(r"\d")
_HAS_SYMBOL = re.compile(r"[^A-Za-z0-9]")


def _validate_password_strength(value: str) -> str:
    if value is None or len(value) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if len(value) > 128:
        raise ValueError("Password must be at most 128 characters long")
    if not _HAS_LETTER.search(value):
        raise ValueError("Password must contain at least one letter")
    if not _HAS_DIGIT.search(value):
        raise ValueError("Password must contain at least one digit")
    if not _HAS_SYMBOL.search(value):
        raise ValueError("Password must contain at least one symbol (e.g. ! # $ % @)")
    if value.lower() in _WEAK_PASSWORDS:
        raise ValueError("Password is too common. Please choose a stronger one")
    return value


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordForgotRequest(BaseModel):
    email: EmailStr


class PasswordResetRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    _check_new_password = field_validator("new_password")(_validate_password_strength)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)

    _check_new_password = field_validator("new_password")(_validate_password_strength)


class MessageResponse(BaseModel):
    message: str
