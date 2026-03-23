from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"
KAKAO_ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json"


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
    """Search for places using Kakao Local API (keyword + address)."""
    if not settings.KAKAO_REST_API_KEY:
        raise HTTPException(status_code=500, detail="Kakao API key not configured")

    headers = {"Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"}
    results: List[GeocodingResult] = []
    seen_coords: set = set()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1) Keyword search (place names, buildings, etc.)
        keyword_resp = await client.get(
            KAKAO_KEYWORD_URL,
            params={"query": query, "size": 10},
            headers=headers,
        )

        if keyword_resp.status_code == 200:
            for doc in keyword_resp.json().get("documents", []):
                try:
                    lat = float(doc["y"])
                    lng = float(doc["x"])
                except (KeyError, ValueError, TypeError):
                    continue

                coord_key = (round(lat, 5), round(lng, 5))
                if coord_key in seen_coords:
                    continue
                seen_coords.add(coord_key)

                results.append(
                    GeocodingResult(
                        name=doc.get("place_name"),
                        road_address=doc.get("road_address_name") or None,
                        jibun_address=doc.get("address_name") or None,
                        latitude=round(lat, 7),
                        longitude=round(lng, 7),
                    )
                )

        # 2) Address search (road/jibun addresses)
        if len(results) < 5:
            addr_resp = await client.get(
                KAKAO_ADDRESS_URL,
                params={"query": query, "size": 5},
                headers=headers,
            )

            if addr_resp.status_code == 200:
                for doc in addr_resp.json().get("documents", []):
                    try:
                        lat = float(doc["y"])
                        lng = float(doc["x"])
                    except (KeyError, ValueError, TypeError):
                        continue

                    coord_key = (round(lat, 5), round(lng, 5))
                    if coord_key in seen_coords:
                        continue
                    seen_coords.add(coord_key)

                    road = doc.get("road_address")
                    jibun = doc.get("address")

                    results.append(
                        GeocodingResult(
                            name=doc.get("address_name"),
                            road_address=road.get("address_name") if road else None,
                            jibun_address=jibun.get("address_name") if jibun else None,
                            latitude=round(lat, 7),
                            longitude=round(lng, 7),
                        )
                    )

    return GeocodingResponse(results=results[:10])
