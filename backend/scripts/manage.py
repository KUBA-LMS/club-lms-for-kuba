"""
Management CLI for admin operations.
Requires direct server/DB access - cannot be called from the app.

Usage:
  python -m scripts.manage create-superadmin [--password <pw>]
  python -m scripts.manage promote-admin <username>
  python -m scripts.manage demote-admin <username>
  python -m scripts.manage create-club <name> [--logo <url>]
  python -m scripts.manage list-admins
"""

import asyncio
import secrets
import sys

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User


async def create_superadmin(password: str | None = None):
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.username == "superadmin")
        )
        if result.scalar_one_or_none():
            print("Superadmin account already exists.")
            await engine.dispose()
            return

        if not password:
            password = secrets.token_urlsafe(16)
            print(f"Generated password: {password}")

        user = User(
            username="superadmin",
            email="superadmin@system.local",
            hashed_password=get_password_hash(password),
            legal_name="System Administrator",
            role="superadmin",
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"Superadmin created (id: {user.id}, username: superadmin)")

    await engine.dispose()


async def promote_admin(username: str):
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if not user:
            print(f"User '{username}' not found.")
            return

        if user.role == "admin":
            print(f"User '{username}' is already an admin.")
            return

        user.role = "admin"
        await session.commit()
        print(f"User '{username}' promoted to admin.")

    await engine.dispose()


async def demote_admin(username: str):
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if not user:
            print(f"User '{username}' not found.")
            return

        if user.role != "admin":
            print(f"User '{username}' is not an admin.")
            return

        user.role = "member"
        await session.commit()
        print(f"User '{username}' demoted to member.")

    await engine.dispose()


async def list_admins():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.role == "admin")
        )
        admins = result.scalars().all()

        if not admins:
            print("No admin users found.")
            return

        print(f"Admin users ({len(admins)}):")
        for admin in admins:
            print(f"  - {admin.username} (id: {admin.id})")

    await engine.dispose()


async def create_club(name: str, logo: str | None = None):
    from app.models.club import Club

    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        existing = await session.execute(
            select(Club).where(Club.name == name)
        )
        if existing.scalar_one_or_none():
            print(f"Club '{name}' already exists.")
            return

        club = Club(name=name, logo_image=logo)
        session.add(club)
        await session.commit()
        await session.refresh(club)
        print(f"Club '{name}' created (id: {club.id})")

    await engine.dispose()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "create-superadmin":
        pw = None
        if "--password" in sys.argv:
            idx = sys.argv.index("--password")
            if idx + 1 < len(sys.argv):
                pw = sys.argv[idx + 1]
        asyncio.run(create_superadmin(pw))

    elif command == "promote-admin":
        if len(sys.argv) < 3:
            print("Usage: python -m scripts.manage promote-admin <username>")
            sys.exit(1)
        asyncio.run(promote_admin(sys.argv[2]))

    elif command == "demote-admin":
        if len(sys.argv) < 3:
            print("Usage: python -m scripts.manage demote-admin <username>")
            sys.exit(1)
        asyncio.run(demote_admin(sys.argv[2]))

    elif command == "list-admins":
        asyncio.run(list_admins())

    elif command == "create-club":
        if len(sys.argv) < 3:
            print("Usage: python -m scripts.manage create-club <name> [--logo <url>]")
            sys.exit(1)
        name = sys.argv[2]
        logo = None
        if "--logo" in sys.argv:
            idx = sys.argv.index("--logo")
            if idx + 1 < len(sys.argv):
                logo = sys.argv[idx + 1]
        asyncio.run(create_club(name, logo))

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
