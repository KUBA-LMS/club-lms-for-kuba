"""
Idempotent App Store review seed.

Populates the *currently configured* DATABASE_URL with the minimum dataset
needed for an Apple reviewer to experience the app as a real user without
seeing any production-sensitive data. It is safe to re-run: every row is
either fixed-UUID or found-by-username first.

Created objects
    clubs            - Three brand-neutral clubs, one with a subgroup.
    users            - Two test accounts: `reviewer_admin` and `reviewer_user`.
                       Passwords are taken from env vars (see bottom of file).
    memberships      - Both test users are members of all three clubs;
                       `reviewer_admin` is `admin` in the parent club.
    events           - Six events spanning every ``UserRegistrationStatus``.
    group chat       - One group chat with the two users + seeded messages.
    registrations    - `reviewer_user` has one confirmed + ticket for the
                       on-going event, and one pending for a requested one.

This file talks directly to the DB (the same way `seed_db.py` does) because
the endpoints it would otherwise call require admin role in the very clubs
it is creating -- a chicken-and-egg. All code paths still respect the app's
invariants (role assignment via `user_club`, UUID primary keys, etc.).

Run locally::

    source backend/venv/bin/activate
    python -m scripts.seed_app_review

Run against the Railway-hosted production DB (from your machine)::

    railway run --service <backend-service-name> \\
        python -m scripts.seed_app_review
"""

import asyncio
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal as D

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, user_club
from app.models.club import Club
from app.models.event import Event
from app.models.registration import Registration
from app.models.ticket import Ticket
from app.models.chat import Chat, ChatMember, Message


# ---------------------------------------------------------------------------
# Fixed identifiers (make the script idempotent)
# ---------------------------------------------------------------------------

REVIEWER_ADMIN_ID = uuid.UUID("33333333-0000-0000-0000-000000000001")
REVIEWER_USER_ID = uuid.UUID("33333333-0000-0000-0000-000000000002")

# Placeholder images. Picsum Photos returns a deterministic image per seed
# string, is free, HTTPS-served, and the CDN caches aggressively. Used only
# for seed fixtures -- in production uploads go through `/upload/image`.
def _img(seed: str, w: int = 800, h: int = 600) -> str:
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


def _img_square(seed: str, size: int = 400) -> str:
    return _img(seed, size, size)


def _img_poster(seed: str) -> str:
    return _img(seed, 800, 1200)

CLUB_DEMO_ID = uuid.UUID("33333333-1111-0000-0000-000000000001")
CLUB_LANG_ID = uuid.UUID("33333333-1111-0000-0000-000000000002")
CLUB_SUBGROUP_ID = uuid.UUID("33333333-1111-0000-0000-000000000003")

EVENT_IDS = {
    "today_open": uuid.UUID("33333333-2222-0000-0000-000000000001"),
    "upcoming_open": uuid.UUID("33333333-2222-0000-0000-000000000002"),
    "registered": uuid.UUID("33333333-2222-0000-0000-000000000003"),
    "requested": uuid.UUID("33333333-2222-0000-0000-000000000004"),
    "paid_one_n": uuid.UUID("33333333-2222-0000-0000-000000000005"),
    "closed": uuid.UUID("33333333-2222-0000-0000-000000000006"),
}

CHAT_GROUP_ID = uuid.UUID("33333333-3333-0000-0000-000000000001")

ADMIN_REG_CONFIRMED = uuid.UUID("33333333-4444-0000-0000-000000000001")
USER_REG_CONFIRMED = uuid.UUID("33333333-4444-0000-0000-000000000002")
USER_REG_PENDING = uuid.UUID("33333333-4444-0000-0000-000000000003")
USER_TICKET_ID = uuid.UUID("33333333-5555-0000-0000-000000000001")

# Pull from env so scripts can rotate credentials without editing source.
REVIEWER_ADMIN_PASSWORD = os.getenv("REVIEWER_ADMIN_PASSWORD", "Review3r!Admin")
REVIEWER_USER_PASSWORD = os.getenv("REVIEWER_USER_PASSWORD", "Review3r!User")


async def _get_or_create_user(
    session,
    uid,
    username,
    email,
    password,
    legal_name,
    role="member",
    profile_image=None,
):
    existing = (await session.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if existing:
        print(f"  user {username} already present")
        return existing
    user = User(
        id=uid,
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        legal_name=legal_name,
        role=role,
        is_active=True,
        profile_image=profile_image,
    )
    session.add(user)
    print(f"  created user {username}")
    return user


async def _get_or_create_club(
    session, cid, name, *, parent_id=None, description=None, logo_image=None,
):
    existing = (await session.execute(select(Club).where(Club.id == cid))).scalar_one_or_none()
    if existing:
        print(f"  club {name} already present")
        return existing
    club = Club(
        id=cid,
        name=name,
        description=description,
        parent_id=parent_id,
        logo_image=logo_image,
    )
    session.add(club)
    print(f"  created club {name}")
    return club


async def _ensure_membership(session, user_id, club_id, role):
    existing = await session.execute(
        select(user_club).where(
            user_club.c.user_id == user_id,
            user_club.c.club_id == club_id,
        )
    )
    if existing.first():
        return
    await session.execute(
        user_club.insert().values(user_id=user_id, club_id=club_id, role=role)
    )


async def _get_or_create_event(session, eid, **fields):
    existing = (await session.execute(select(Event).where(Event.id == eid))).scalar_one_or_none()
    if existing:
        print(f"  event {fields.get('title')} already present")
        return existing
    event = Event(id=eid, **fields)
    session.add(event)
    print(f"  created event {fields.get('title')}")
    return event


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    async with Session() as session:
        print("Users...")
        admin = await _get_or_create_user(
            session,
            REVIEWER_ADMIN_ID,
            "reviewer_admin",
            "reviewer.admin@clubx.local",
            REVIEWER_ADMIN_PASSWORD,
            "Reviewer Admin",
            profile_image=_img_square("reviewer-admin"),
        )
        user = await _get_or_create_user(
            session,
            REVIEWER_USER_ID,
            "reviewer_user",
            "reviewer.user@clubx.local",
            REVIEWER_USER_PASSWORD,
            "Reviewer User",
            profile_image=_img_square("reviewer-user"),
        )

        print("Clubs...")
        demo_club = await _get_or_create_club(
            session,
            CLUB_DEMO_ID,
            "Demo Club",
            description="A generic activity club used for the App Store review.",
            logo_image=_img_square("demo-club-logo"),
        )
        lang_club = await _get_or_create_club(
            session,
            CLUB_LANG_ID,
            "Language Exchange",
            description="Practice English, Korean, Japanese.",
            logo_image=_img_square("language-exchange-logo"),
        )
        # Ensure parent exists before child
        await session.flush()
        demo_sub = await _get_or_create_club(
            session,
            CLUB_SUBGROUP_ID,
            "Demo Club - Group A",
            parent_id=demo_club.id,
            description="A subgroup of Demo Club.",
            logo_image=_img_square("demo-club-group-a-logo"),
        )

        await session.flush()

        print("Memberships...")
        await _ensure_membership(session, admin.id, demo_club.id, "admin")
        await _ensure_membership(session, admin.id, lang_club.id, "admin")
        await _ensure_membership(session, admin.id, demo_sub.id, "admin")
        await _ensure_membership(session, user.id, demo_club.id, "member")
        await _ensure_membership(session, user.id, lang_club.id, "member")
        await _ensure_membership(session, user.id, demo_sub.id, "member")

        print("Events...")
        # 1. Today, open for registration
        await _get_or_create_event(
            session,
            EVENT_IDS["today_open"],
            title="Language Exchange Meetup",
            description="Casual conversation practice at a cafe.",
            images=[_img_poster("event-language-exchange"), _img("event-language-exchange-2", 800, 600)],
            event_type="official",
            cost_type="free",
            registration_start=now - timedelta(days=5),
            registration_end=now + timedelta(hours=6),
            event_date=now + timedelta(hours=12),
            event_location="Seoul, Hongdae area",
            latitude=D("37.5563"),
            longitude=D("126.9236"),
            max_slots=30,
            current_slots=2,
            provided_by_id=admin.id,
            posted_by_id=admin.id,
            club_id=lang_club.id,
        )
        # 2. Upcoming, registration open
        await _get_or_create_event(
            session,
            EVENT_IDS["upcoming_open"],
            title="Photography Walk",
            description="Weekend walk with cameras, all levels welcome.",
            images=[_img_poster("event-photo-walk"), _img("event-photo-walk-2", 800, 600)],
            event_type="official",
            cost_type="free",
            registration_start=now - timedelta(days=1),
            registration_end=now + timedelta(days=3),
            event_date=now + timedelta(days=5),
            event_location="Seoul, Seongsu-dong",
            latitude=D("37.5447"),
            longitude=D("127.0557"),
            max_slots=20,
            current_slots=0,
            provided_by_id=admin.id,
            posted_by_id=admin.id,
            club_id=demo_club.id,
        )
        # 3. Registered (reviewer_user has confirmed reg + ticket)
        await _get_or_create_event(
            session,
            EVENT_IDS["registered"],
            title="Board Game Night",
            description="Pizza, soft drinks, and a pile of classic board games.",
            images=[_img_poster("event-board-games"), _img("event-board-games-2", 800, 600)],
            event_type="private",
            cost_type="free",
            registration_start=now - timedelta(days=10),
            registration_end=now - timedelta(days=1),
            event_date=now + timedelta(days=2),
            event_location="Demo Club HQ",
            latitude=D("37.5729"),
            longitude=D("126.9794"),
            max_slots=16,
            current_slots=2,
            provided_by_id=admin.id,
            posted_by_id=admin.id,
            club_id=demo_club.id,
        )
        # 4. Requested (reviewer_user has pending registration)
        await _get_or_create_event(
            session,
            EVENT_IDS["requested"],
            title="Weekend Hike - Bukhansan",
            description="Moderate 5-hour hike, pack water and snacks.",
            images=[_img_poster("event-hike-bukhansan"), _img("event-hike-bukhansan-2", 800, 600)],
            event_type="official",
            cost_type="free",
            registration_start=now - timedelta(days=2),
            registration_end=now + timedelta(days=4),
            event_date=now + timedelta(days=8),
            event_location="Bukhansan National Park",
            latitude=D("37.6584"),
            longitude=D("126.9775"),
            max_slots=25,
            current_slots=1,
            provided_by_id=admin.id,
            posted_by_id=admin.id,
            club_id=demo_club.id,
        )
        # 5. Paid / 1/N
        await _get_or_create_event(
            session,
            EVENT_IDS["paid_one_n"],
            title="Group Dinner - KBBQ",
            description="Split the bill evenly at the end of the night.",
            images=[_img_poster("event-kbbq"), _img("event-kbbq-2", 800, 600)],
            event_type="private",
            cost_type="one_n",
            cost_amount=D("25000"),
            registration_start=now - timedelta(days=3),
            registration_end=now + timedelta(days=2),
            event_date=now + timedelta(days=3),
            event_location="Seoul, Gangnam",
            latitude=D("37.4979"),
            longitude=D("127.0276"),
            max_slots=10,
            current_slots=1,
            provided_by_id=admin.id,
            posted_by_id=admin.id,
            club_id=demo_sub.id,
        )
        # 6. Closed (registration period ended, event still upcoming)
        await _get_or_create_event(
            session,
            EVENT_IDS["closed"],
            title="Movie Night (Tickets Sold Out)",
            description="Private screening, registration has closed.",
            images=[_img_poster("event-movie-night"), _img("event-movie-night-2", 800, 600)],
            event_type="private",
            cost_type="free",
            registration_start=now - timedelta(days=14),
            registration_end=now - timedelta(days=3),
            event_date=now + timedelta(days=4),
            event_location="Seoul, Yongsan",
            latitude=D("37.5298"),
            longitude=D("126.9650"),
            max_slots=12,
            current_slots=12,
            provided_by_id=admin.id,
            posted_by_id=admin.id,
            club_id=lang_club.id,
        )

        await session.flush()

        print("Registrations + Ticket...")
        async def _get_or_create_reg(rid, uid, eid, status, payment="completed"):
            exists = (await session.execute(select(Registration).where(Registration.id == rid))).scalar_one_or_none()
            if exists:
                return exists
            reg = Registration(
                id=rid,
                user_id=uid,
                event_id=eid,
                status=status,
                payment_status=payment,
            )
            session.add(reg)
            return reg

        await _get_or_create_reg(ADMIN_REG_CONFIRMED, admin.id, EVENT_IDS["registered"], "confirmed")
        reg_confirmed = await _get_or_create_reg(USER_REG_CONFIRMED, user.id, EVENT_IDS["registered"], "confirmed")
        await _get_or_create_reg(USER_REG_PENDING, user.id, EVENT_IDS["requested"], "pending", payment="pending")
        await session.flush()

        ticket_exists = (await session.execute(select(Ticket).where(Ticket.id == USER_TICKET_ID))).scalar_one_or_none()
        if not ticket_exists:
            session.add(Ticket(
                id=USER_TICKET_ID,
                barcode=secrets.token_hex(16).upper(),
                is_used=False,
                registration_id=reg_confirmed.id,
            ))

        print("Chat + messages...")
        chat_exists = (await session.execute(select(Chat).where(Chat.id == CHAT_GROUP_ID))).scalar_one_or_none()
        if not chat_exists:
            session.add(Chat(
                id=CHAT_GROUP_ID,
                type="group",
                name="Demo Club General",
                club_id=demo_club.id,
            ))
            session.add(ChatMember(chat_id=CHAT_GROUP_ID, user_id=admin.id, joined_at=now))
            session.add(ChatMember(chat_id=CHAT_GROUP_ID, user_id=user.id, joined_at=now))
            await session.flush()
            for i, (sender_id, content) in enumerate([
                (admin.id, "Welcome to Demo Club! Say hi in this chat."),
                (user.id, "Excited for the board game night."),
                (admin.id, "Great — see you there at 7pm."),
                (user.id, "Is parking available at the venue?"),
                (admin.id, "Yes, there's street parking right outside."),
            ]):
                session.add(Message(
                    chat_id=CHAT_GROUP_ID,
                    sender_id=sender_id,
                    content=content,
                    type="text",
                    created_at=now - timedelta(minutes=(30 - i * 5)),
                ))

        await session.commit()
        print("Done.")


if __name__ == "__main__":
    asyncio.run(seed())
