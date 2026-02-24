"""
Backfill missing event coordinates using Naver Geocoding API.
Uses the same geocoding mechanism as the event creation flow.

Usage:
    python -m scripts.backfill_event_coords
"""

import asyncio
import random
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.base import Base
from app.models.event import Event

NAVER_GEOCODE_URL = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode"

# Korea University Anam Campus center
KU_LAT = 37.5895
KU_LNG = 127.0323


async def geocode_address(client: httpx.AsyncClient, query: str) -> tuple[float, float] | None:
    """Call Naver Geocoding API - same as /geocoding/search endpoint."""
    headers = {
        "X-NCP-APIGW-API-KEY-ID": settings.NAVER_MAP_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": settings.NAVER_MAP_CLIENT_SECRET,
    }

    try:
        resp = await client.get(
            NAVER_GEOCODE_URL,
            params={"query": query},
            headers=headers,
            timeout=10.0,
        )
        if resp.status_code != 200:
            return None

        data = resp.json()
        addresses = data.get("addresses", [])
        if not addresses:
            return None

        first = addresses[0]
        lat = float(first.get("y", 0))
        lng = float(first.get("x", 0))
        if lat == 0 or lng == 0:
            return None
        return (lat, lng)
    except Exception as e:
        print(f"  Geocoding error: {e}")
        return None


def random_ku_coords() -> tuple[float, float]:
    """Random point within ~300m of Korea University campus center."""
    lat = KU_LAT + random.uniform(-0.002, 0.002)
    lng = KU_LNG + random.uniform(-0.002, 0.002)
    return (round(lat, 7), round(lng, 7))


async def backfill():
    if not settings.NAVER_MAP_CLIENT_ID or not settings.NAVER_MAP_CLIENT_SECRET:
        print("WARNING: Naver Map keys not configured. Using random KU coordinates for all events.")

    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(Event).where(
                (Event.latitude.is_(None)) | (Event.longitude.is_(None))
            )
        )
        events = result.scalars().all()

        if not events:
            print("No events with missing coordinates. Nothing to backfill.")
            return

        print(f"Found {len(events)} events without coordinates.\n")

        updated = 0
        async with httpx.AsyncClient() as client:
            for event in events:
                location = event.event_location or ""
                print(f"[{event.title}] location: \"{location}\"")

                coords = None
                if location and settings.NAVER_MAP_CLIENT_ID:
                    coords = await geocode_address(client, location)
                    if coords:
                        print(f"  -> Geocoded: {coords[0]}, {coords[1]}")

                if not coords:
                    coords = random_ku_coords()
                    print(f"  -> Fallback (random KU area): {coords[0]}, {coords[1]}")

                event.latitude = Decimal(str(coords[0]))
                event.longitude = Decimal(str(coords[1]))
                updated += 1

                # Small delay to avoid API rate limiting
                await asyncio.sleep(0.3)

        await session.commit()
        print(f"\nUpdated {updated} events with coordinates.")


if __name__ == "__main__":
    asyncio.run(backfill())
