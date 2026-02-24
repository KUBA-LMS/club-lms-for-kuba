from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json"


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
    """Search for places using Naver Local Search API.

    mapx/mapy from the API are WGS84 coordinates scaled by 1e7.
    """
    if not settings.NAVER_SEARCH_CLIENT_ID or not settings.NAVER_SEARCH_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Search service not configured")

    results: List[GeocodingResult] = []

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            NAVER_LOCAL_SEARCH_URL,
            params={"query": query, "display": 5},
            headers={
                "X-Naver-Client-Id": settings.NAVER_SEARCH_CLIENT_ID,
                "X-Naver-Client-Secret": settings.NAVER_SEARCH_CLIENT_SECRET,
            },
            timeout=10.0,
        )

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Place search failed")

        for item in resp.json().get("items", []):
            try:
                mapx = int(item.get("mapx", 0))
                mapy = int(item.get("mapy", 0))
            except (ValueError, TypeError):
                continue

            if mapx == 0 or mapy == 0:
                continue

            # mapx/mapy are WGS84 coordinates scaled by 1e7
            lon = mapx / 10_000_000
            lat = mapy / 10_000_000

            if not (33.0 <= lat <= 43.0 and 124.0 <= lon <= 132.0):
                continue

            title = item.get("title", "").replace("<b>", "").replace("</b>", "")

            results.append(
                GeocodingResult(
                    name=title,
                    road_address=item.get("roadAddress") or None,
                    jibun_address=item.get("address") or None,
                    latitude=round(lat, 7),
                    longitude=round(lon, 7),
                )
            )

    return GeocodingResponse(results=results)
