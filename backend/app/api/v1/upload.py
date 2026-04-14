import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = Path("static/uploads")
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MIN_FILE_SIZE = 32  # Reject absurdly tiny files that cannot be real images.

# Magic-byte signatures for the file types we accept.
# https://en.wikipedia.org/wiki/List_of_file_signatures
_JPEG = b"\xff\xd8\xff"
_PNG = b"\x89PNG\r\n\x1a\n"
_GIF87 = b"GIF87a"
_GIF89 = b"GIF89a"
_WEBP_RIFF = b"RIFF"
_WEBP_WEBP = b"WEBP"


def _sniff_image_ext(content: bytes) -> str | None:
    """Return canonical extension by inspecting real file bytes. None if unknown."""
    if content.startswith(_JPEG):
        return "jpg"
    if content.startswith(_PNG):
        return "png"
    if content.startswith(_GIF87) or content.startswith(_GIF89):
        return "gif"
    if content[:4] == _WEBP_RIFF and content[8:12] == _WEBP_WEBP:
        return "webp"
    return None


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image file and return its public URL.

    Trusts neither the client-provided ``content-type`` nor the filename extension:
    the real file signature is verified via magic bytes, and the stored file is
    saved with a server-chosen extension matching that signature.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WebP, and GIF images are supported",
        )

    content = await file.read()
    if len(content) < MIN_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image file is too small or empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image size must be under 5MB")

    real_ext = _sniff_image_ext(content)
    if real_ext is None:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid JPEG, PNG, WebP, or GIF image",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{real_ext}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(content)

    return {"url": f"/static/uploads/{unique_name}"}
