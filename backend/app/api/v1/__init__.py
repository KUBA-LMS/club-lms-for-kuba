from fastapi import APIRouter

from app.api.v1 import auth, users, clubs, events, registrations, tickets, chats

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(clubs.router, prefix="/clubs", tags=["Clubs"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(registrations.router, prefix="/registrations", tags=["Registrations"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
api_router.include_router(chats.router, prefix="/chats", tags=["Chats"])
