"""
Migrate existing hex/KUBA- barcodes to 12-digit numeric format.

Usage:
    cd backend && python -m scripts.migrate_barcodes
"""

import asyncio
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.ticket import Ticket


def is_hex_barcode(barcode: str) -> bool:
    stripped = barcode.removeprefix("KUBA-")
    return not stripped.isdigit()


def gen_numeric_barcode() -> str:
    return str(secrets.randbelow(10**12 - 10**11) + 10**11)


async def migrate():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(select(Ticket))
        tickets = result.scalars().all()

        # Collect current numeric barcodes to avoid collision
        existing_numeric = {t.barcode for t in tickets if t.barcode.isdigit()}

        to_migrate = [t for t in tickets if is_hex_barcode(t.barcode)]
        if not to_migrate:
            print("No hex barcodes found. Nothing to migrate.")
            return

        print(f"Found {len(to_migrate)} tickets to migrate.\n")

        for ticket in to_migrate:
            old = ticket.barcode
            new = gen_numeric_barcode()
            while new in existing_numeric:
                new = gen_numeric_barcode()
            existing_numeric.add(new)
            ticket.barcode = new
            print(f"  {old} -> {new}")

        await session.commit()
        print(f"\nMigrated {len(to_migrate)} barcodes.")


if __name__ == "__main__":
    asyncio.run(migrate())
