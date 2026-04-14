from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import re
import httpx

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_PLACES_FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,places.location"
)

HANGUL_RE = re.compile(r"[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]")


class GeocodingResult(BaseModel):
    name: Optional[str] = None
    road_address: Optional[str] = None
    jibun_address: Optional[str] = None
    latitude: float
    longitude: float


class GeocodingResponse(BaseModel):
    results: List[GeocodingResult]


def _detect_language_code(query: str) -> str:
    return "ko" if HANGUL_RE.search(query) else "en"


@router.get("/search", response_model=GeocodingResponse)
async def search_place(
    query: str = Query(..., min_length=1, max_length=200),
    current_user: User = Depends(get_current_user),
):
    """Search for places using Google Places API (New) Text Search."""
    if not settings.GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
    }
    body = {
        "textQuery": query,
        "languageCode": _detect_language_code(query),
        "maxResultCount": 10,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(GOOGLE_PLACES_TEXT_SEARCH_URL, json=body, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Google Places API error: {resp.status_code} {resp.text[:200]}",
        )

    results: List[GeocodingResult] = []
    seen_coords: set = set()

    for place in resp.json().get("places", []):
        location = place.get("location") or {}
        try:
            lat = float(location["latitude"])
            lng = float(location["longitude"])
        except (KeyError, ValueError, TypeError):
            continue

        coord_key = (round(lat, 5), round(lng, 5))
        if coord_key in seen_coords:
            continue
        seen_coords.add(coord_key)

        display_name = place.get("displayName") or {}
        results.append(
            GeocodingResult(
                name=display_name.get("text"),
                road_address=place.get("formattedAddress"),
                jibun_address=None,
                latitude=round(lat, 7),
                longitude=round(lng, 7),
            )
        )

    return GeocodingResponse(results=results)
