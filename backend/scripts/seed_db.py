"""
Database seed script for development/testing.
Creates admin user, clubs, and (in DEV_MODE) test users, mock events,
registrations, and tickets covering all UserRegistrationStatus cases.
"""

import asyncio
import secrets
import uuid
from datetime import datetime, timedelta
from decimal import Decimal as D

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User
from app.models.club import Club
from app.models.event import Event
from app.models.registration import Registration
from app.models.ticket import Ticket
from app.models.chat import Chat, ChatMember, Message


# --- Fixed UUIDs ---

# Core (always seeded)
ADMIN_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
KUBA_CLUB_ID = uuid.UUID("00000000-0000-0000-0000-000000000101")
KUBA_GROUP_8_CLUB_ID = uuid.UUID("00000000-0000-0000-0000-000000000102")

# DEV_MODE only
TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")

# Event UUIDs - one per UserRegistrationStatus case
EVENT_REGISTERED_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
EVENT_OPEN_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
EVENT_REQUESTED_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
EVENT_CLOSED_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
EVENT_UPCOMING_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")

# Registration UUIDs for test user
TEST_REG_REGISTERED_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-111111111111")
TEST_REG_REQUESTED_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-333333333333")

# Registration & Ticket UUIDs for dev user (hn11sm)
DEV_REG_REGISTERED_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-111111111111")
DEV_REG_REQUESTED_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-333333333333")
DEV_TICKET_REGISTERED_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-111111111111")

# Chat UUIDs (DEV_MODE only)
CHAT_DM_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-000000000001")
CHAT_GROUP_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-000000000002")


async def seed_database():
    """Seed the database with initial data."""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(User).where(User.id == ADMIN_USER_ID))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")

        # ---- Always seeded: admin user & clubs ----

        admin_user = User(
            id=ADMIN_USER_ID,
            username="admin",
            email="admin@kuba.kr",
            hashed_password=get_password_hash("admin123!"),
            legal_name="Admin User",
            student_id="2023000000",
            role="admin",
            is_active=True,
        )
        session.add(admin_user)
        print("Created admin user (username: admin, password: admin123!)")

        kuba_club = Club(
            id=KUBA_CLUB_ID,
            name="45th_KUBA",
            description="Korea University Business Administration student club",
            university="Korea University",
        )
        session.add(kuba_club)

        kuba_group_8 = Club(
            id=KUBA_GROUP_8_CLUB_ID,
            name="45th_KUBA_Group_8",
            description="KUBA Group 8 subgroup",
            university="Korea University",
        )
        session.add(kuba_group_8)
        print("Created clubs: 45th_KUBA, 45th_KUBA_Group_8")

        await session.flush()

        # ---- DEV_MODE only: test data ----

        if not settings.DEV_MODE:
            await session.commit()
            print("DEV_MODE is off. Skipping test data.")
            print("Database seeding completed successfully!")
            return

        print("DEV_MODE is on. Creating test data...")

        now = datetime.utcnow()

        # -- Users --

        test_user = User(
            id=TEST_USER_ID,
            username="testuser",
            email="test@kuba.kr",
            hashed_password=get_password_hash("test1234!"),
            legal_name="Test User",
            student_id="2023000001",
            role="member",
            is_active=True,
        )
        session.add(test_user)
        print("Created test user (username: testuser, password: test1234!)")

        dev_user = User(
            id=DEV_USER_ID,
            username="hn11sm",
            email="hn11sm@korea.ac.kr",
            hashed_password=get_password_hash("2004710jim!"),
            legal_name="Sungmin Lee",
            student_id="2023320132",
            nationality="Korean",
            gender="male",
            role="member",
            is_active=True,
        )
        session.add(dev_user)
        print("Created dev user (username: hn11sm, password: 2004710jim!)")

        await session.flush()

        # -- Events: one per UserRegistrationStatus case --
        # Statuses are computed from the dev user's perspective:
        #   registered = confirmed registration exists
        #   open       = registration period active, no registration
        #   requested  = pending registration exists
        #   closed     = registration period ended, no registration
        #   upcoming   = registration period hasn't started

        # 1) REGISTERED: registration closed, dev user confirmed + has ticket
        event_registered = Event(
            id=EVENT_REGISTERED_ID,
            title="KUBA 45th Orientation",
            description="Welcome to KUBA! This is the orientation event for new members.",
            event_type="official",
            cost_type="free",
            registration_start=now - timedelta(days=10),
            registration_end=now - timedelta(days=3),
            event_date=now + timedelta(days=5),
            event_location="Korea University, Anam Campus, Business Building",
            latitude=D("37.5908"),
            longitude=D("127.0324"),
            max_slots=100,
            current_slots=52,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_registered)

        # 2) OPEN: registration active, dev user has no registration
        event_open = Event(
            id=EVENT_OPEN_ID,
            title="KUBA 45th Orientation After Party",
            description="After party for the orientation event. Food and drinks provided!",
            event_type="private",
            cost_type="free",
            registration_start=now - timedelta(days=5),
            registration_end=now + timedelta(days=5),
            event_date=now + timedelta(days=7),
            event_location="Anam Station Area, TBD",
            latitude=D("37.5863"),
            longitude=D("127.0293"),
            max_slots=50,
            current_slots=20,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_GROUP_8_CLUB_ID,
        )
        session.add(event_open)

        # 3) REQUESTED: registration active, dev user has pending registration
        event_requested = Event(
            id=EVENT_REQUESTED_ID,
            title="KUBA 45th Cheering Orientation",
            description="Learn the cheering songs and chants for Korea University!",
            event_type="official",
            cost_type="free",
            registration_start=now - timedelta(days=3),
            registration_end=now + timedelta(days=2),
            event_date=now + timedelta(days=10),
            event_location="Korea University Stadium",
            latitude=D("37.5875"),
            longitude=D("127.0352"),
            max_slots=200,
            current_slots=150,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_requested)

        # 4) CLOSED: registration ended, dev user has no registration
        event_closed = Event(
            id=EVENT_CLOSED_ID,
            title="KUBA Club Party",
            description="End of semester celebration party!",
            event_type="official",
            cost_type="prepaid",
            cost_amount=D("30000"),
            registration_start=now - timedelta(days=30),
            registration_end=now - timedelta(days=10),
            event_date=now + timedelta(days=30),
            event_location="Hongdae Area, TBD",
            latitude=D("37.5921"),
            longitude=D("127.0302"),
            max_slots=80,
            current_slots=80,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_closed)

        # 5) UPCOMING: registration hasn't started yet
        event_upcoming = Event(
            id=EVENT_UPCOMING_ID,
            title="KUBA Group 8 lunch gathering",
            description="Casual lunch gathering for Group 8 members",
            event_type="private",
            cost_type="one_n",
            registration_start=now + timedelta(days=30),
            registration_end=now + timedelta(days=55),
            event_date=now + timedelta(days=60),
            event_location="Near Anam Station",
            latitude=D("37.5855"),
            longitude=D("127.0285"),
            max_slots=15,
            current_slots=0,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_upcoming)
        print("Created 5 test events (registered/open/requested/closed/upcoming)")

        await session.flush()

        # -- Registrations for test user --

        test_reg_registered = Registration(
            id=TEST_REG_REGISTERED_ID,
            user_id=TEST_USER_ID,
            event_id=EVENT_REGISTERED_ID,
            status="confirmed",
            payment_status="completed",
        )
        session.add(test_reg_registered)

        test_reg_requested = Registration(
            id=TEST_REG_REQUESTED_ID,
            user_id=TEST_USER_ID,
            event_id=EVENT_REQUESTED_ID,
            status="pending",
            payment_status="pending",
        )
        session.add(test_reg_requested)
        print("Created registrations for test user")

        # -- Registrations for dev user (hn11sm) --

        # Event 1 (registered): confirmed + ticket
        dev_reg_registered = Registration(
            id=DEV_REG_REGISTERED_ID,
            user_id=DEV_USER_ID,
            event_id=EVENT_REGISTERED_ID,
            status="confirmed",
            payment_status="completed",
        )
        session.add(dev_reg_registered)

        # Event 3 (requested): pending, no ticket
        dev_reg_requested = Registration(
            id=DEV_REG_REQUESTED_ID,
            user_id=DEV_USER_ID,
            event_id=EVENT_REQUESTED_ID,
            status="pending",
            payment_status="pending",
        )
        session.add(dev_reg_requested)

        await session.flush()

        # -- Ticket for dev user's confirmed registration (OnePass) --

        dev_ticket = Ticket(
            id=DEV_TICKET_REGISTERED_ID,
            barcode=secrets.token_hex(16).upper(),
            is_used=False,
            registration_id=DEV_REG_REGISTERED_ID,
        )
        session.add(dev_ticket)
        print("Created registrations and ticket for dev user (hn11sm)")

        # -- Chat seed data --

        dm_chat = Chat(id=CHAT_DM_ID, type="direct")
        session.add(dm_chat)
        session.add(ChatMember(chat_id=CHAT_DM_ID, user_id=DEV_USER_ID, joined_at=now))
        session.add(ChatMember(chat_id=CHAT_DM_ID, user_id=TEST_USER_ID, joined_at=now))

        group_chat = Chat(id=CHAT_GROUP_ID, type="group", name="KUBA Group 8")
        session.add(group_chat)
        session.add(ChatMember(chat_id=CHAT_GROUP_ID, user_id=DEV_USER_ID, joined_at=now))
        session.add(ChatMember(chat_id=CHAT_GROUP_ID, user_id=TEST_USER_ID, joined_at=now))
        session.add(ChatMember(chat_id=CHAT_GROUP_ID, user_id=ADMIN_USER_ID, joined_at=now))

        await session.flush()

        dm_messages = [
            (TEST_USER_ID, "Hey! Are you going to the orientation?"),
            (DEV_USER_ID, "Yes! Already registered"),
            (TEST_USER_ID, "Great, see you there!"),
        ]
        for i, (sender_id, content) in enumerate(dm_messages):
            session.add(Message(
                chat_id=CHAT_DM_ID,
                sender_id=sender_id,
                content=content,
                type="text",
                created_at=now - timedelta(hours=3 - i),
            ))

        group_messages = [
            (ADMIN_USER_ID, "Welcome to KUBA Group 8 chat!"),
            (TEST_USER_ID, "Thanks for adding me"),
            (DEV_USER_ID, "Looking forward to the semester"),
        ]
        for i, (sender_id, content) in enumerate(group_messages):
            session.add(Message(
                chat_id=CHAT_GROUP_ID,
                sender_id=sender_id,
                content=content,
                type="text",
                created_at=now - timedelta(hours=3 - i),
            ))

        print("Created test chats: 1 DM, 1 group with sample messages")

        await session.commit()
        print("Database seeding completed successfully!")


async def clear_database():
    """Clear all data from the database (use with caution!)."""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Delete in reverse order of dependencies
        await session.execute(text("DELETE FROM payment_splits"))
        await session.execute(text("DELETE FROM payment_requests"))
        await session.execute(text("DELETE FROM messages"))
        await session.execute(text("DELETE FROM chat_members"))
        await session.execute(text("DELETE FROM chats"))
        await session.execute(text("DELETE FROM tickets"))
        await session.execute(text("DELETE FROM registrations"))
        await session.execute(text("DELETE FROM events"))
        await session.execute(text("DELETE FROM user_club"))
        await session.execute(text("DELETE FROM friendships"))
        await session.execute(text("DELETE FROM clubs"))
        await session.execute(text("DELETE FROM users"))
        await session.commit()
        print("Database cleared!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        asyncio.run(clear_database())
    else:
        asyncio.run(seed_database())
