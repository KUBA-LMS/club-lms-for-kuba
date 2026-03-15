from fastapi import APIRouter

from app.api.v1 import auth, users, clubs, events, registrations, tickets, chats, access_control, geocoding, ws, payments, deposits, bookmarks, admin, admin_auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(admin_auth.router, prefix="/admin/auth", tags=["Admin Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(clubs.router, prefix="/clubs", tags=["Clubs"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(registrations.router, prefix="/registrations", tags=["Registrations"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
api_router.include_router(chats.router, prefix="/chats", tags=["Chats"])
api_router.include_router(access_control.router, prefix="/access-control", tags=["Access Control"])
api_router.include_router(geocoding.router, prefix="/geocoding", tags=["Geocoding"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(deposits.router, prefix="/deposits", tags=["Deposits"])
api_router.include_router(bookmarks.router, prefix="/bookmarks", tags=["Bookmarks"])
api_router.include_router(ws.router, prefix="/ws", tags=["WebSocket"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Hub"])
