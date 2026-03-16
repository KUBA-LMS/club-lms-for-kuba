from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx

from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


class GeocodingResult(BaseModel):
    name: Optional[str] = None
    road_address: Optional[str] = None
    jibun_address: Optional[str] = None
    latitude: float
    longitude: float


class GeocodingResponse(BaseModel):
    results: List[GeocodingResult]


@router.get("/search", response_model=GeocodingResponse)
async def search_place(
    query: str = Query(..., min_length=1, max_length=200),
    current_user: User = Depends(get_current_user),
):
    """Search for places using OpenStreetMap Nominatim (English results)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "json",
                "countrycodes": "kr",
                "limit": 8,
                "addressdetails": 1,
            },
            headers={
                "Accept-Language": "en",
                "User-Agent": "KUBA-LMS/1.0 (club-lms)",
            },
            timeout=10.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Place search failed")

    results: List[GeocodingResult] = []

    for item in resp.json():
        try:
            lat = float(item["lat"])
            lon = float(item["lon"])
        except (KeyError, ValueError, TypeError):
            continue

        if not (33.0 <= lat <= 43.0 and 124.0 <= lon <= 132.0):
            continue

        addr = item.get("address", {})
        display_name: str = item.get("display_name", "")

        # Extract a clean short name from address components
        name = None
        for key in ("amenity", "building", "tourism", "shop", "office", "university", "school", "leisure"):
            if addr.get(key):
                name = addr[key]
                break
        if not name:
            name = display_name.split(",")[0].strip()

        # Build road address: house_number + road + city
        road_parts = []
        if addr.get("house_number"):
            road_parts.append(addr["house_number"])
        if addr.get("road"):
            road_parts.append(addr["road"])
        city = addr.get("city") or addr.get("county") or addr.get("state_district") or ""
        if city:
            road_parts.append(city)
        road_address = ", ".join(road_parts) if road_parts else None

        results.append(
            GeocodingResult(
                name=name,
                road_address=road_address,
                jibun_address=display_name,
                latitude=round(lat, 7),
                longitude=round(lon, 7),
            )
        )

    return GeocodingResponse(results=results)
