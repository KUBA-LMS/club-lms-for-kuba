<p align="center">
  <img src="docs/assets/logo.png" alt="ClubX" width="360" />
</p>

<h3 align="center">The operating system for student clubs and communities.</h3>

<p align="center">
  Run events, move money, track attendance, and chat with your members — all from one clean mobile app, purpose-built for university clubs and student organizations.
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/quick_start-5_minutes-111?style=flat-square" alt="Quick start" /></a>
  <a href="docs/QA-REPORT-APP-STORE-READINESS.md"><img src="https://img.shields.io/badge/app_store-review_ready-0A84FF?style=flat-square" alt="App Store ready" /></a>
  <img src="https://img.shields.io/badge/iOS-16%2B-111?style=flat-square&logo=apple" alt="iOS 16+" />
  <img src="https://img.shields.io/badge/Android-7%2B-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Android 7+" />
  <img src="https://img.shields.io/badge/expo-54-000?style=flat-square&logo=expo" alt="Expo 54" />
  <img src="https://img.shields.io/badge/fastapi-async-009485?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/postgres-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
</p>

<p align="center">
  <a href="#why-clubx">Why</a>
  &nbsp;·&nbsp;
  <a href="#highlights">Highlights</a>
  &nbsp;·&nbsp;
  <a href="#tech-stack">Tech stack</a>
  &nbsp;·&nbsp;
  <a href="#quick-start">Quick start</a>
  &nbsp;·&nbsp;
  <a href="#project-layout">Project layout</a>
  &nbsp;·&nbsp;
  <a href="#deploying">Deploying</a>
  &nbsp;·&nbsp;
  <a href="#documentation">Docs</a>
  &nbsp;·&nbsp;
  <a href="#team">Team</a>
</p>

---

## Why ClubX

Most student clubs stitch together a group chat, a spreadsheet, a shared
bank account, and a photo album. Event signups go through a chat message,
tickets are a screenshot of a spreadsheet row, and 1/N settlement turns
into a week-long chase. Clubs burn their officers on administration
instead of growing the community.

**ClubX** collapses the whole loop into a single mobile app — an event you
post in the morning can accept registrations, verify membership, issue a
rotating-barcode ticket, run a 1/N split at the door, and deposit into the
treasurer's ledger before dinner. No spreadsheets. No screenshots. No
chasing.

---

## Highlights

**Events that run themselves.** Public or club-only events with
registration windows, prepaid or 1/N split cost types, attendance limits,
poster uploads, and map pins. Every event lives inside the club that owns
it — clean multi-tenant by design.

**OnePass.** Each confirmed registration gets a CODE128 barcode that
rotates every 120 seconds. Admins scan at the door with the device camera;
check-ins are concurrency-safe (`SELECT … FOR UPDATE`) so two scanners on
the same barcode can never both succeed.

**1/N settlement, without a fintech license.** ClubX never custodies
funds. The app calculates the per-head split, nudges participants, and
deep-links directly into Toss (`supertoss://send`) or KakaoPay with the
bank details pre-filled. Status ("Pending → Sent → Confirmed") is
mirrored across all participants in real time over the websocket.

**Group chat with payment-aware bubbles.** Rich message types — text,
image, ticket transfer, split request, split completed — with
per-chat-member read receipts and a moderation pipeline (long-press →
report or block).

**Admin hub per club.** Scoped dashboards for member management, role
assignment (member / admin / lead), QR-gated invite flows, event CSV
export, deposit ledger, and waitlist approvals. Admin privileges are
**always** club-scoped — an admin of club A cannot see club B.

**Privacy and access control built in, not bolted on.**
- Club member lists, event details, and WebSocket channels all enforce
  membership at the data layer, not just the UI.
- JWT logout revokes the access token via a Redis blacklist.
- Image uploads are verified against real magic bytes, not the
  client-supplied `content-type`.
- Every datetime is UTC on the wire and renders in the user's device
  timezone automatically.
- 47 pre-submission findings tracked and triaged in
  [`docs/QA-REPORT-APP-STORE-READINESS.md`](docs/QA-REPORT-APP-STORE-READINESS.md).

---

## Tech stack

| Layer                | Choice                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| Mobile               | React Native 0.81, Expo 54, TypeScript, React 19                       |
| Navigation           | `@react-navigation/native-stack`, deep links (`clublms://`)            |
| State / networking   | React Context + custom hooks + axios with refresh-token interceptor    |
| Realtime             | Native WebSocket with channel subscriptions and membership checks      |
| Maps                 | Naver Maps (`@mj-studio/react-native-naver-map`)                       |
| Camera / scanner     | `expo-camera`, `react-native-vision-camera`                            |
| Push                 | Expo Push Service (APNs + FCM)                                         |
| Backend              | FastAPI, SQLAlchemy 2 async, Alembic migrations                        |
| Database             | PostgreSQL 16 (Docker locally, Supabase in production)                 |
| Cache / pubsub       | Redis 7 (token blacklist, websocket fan-out, message cleanup queue)    |
| Geocoding            | Google Places (New) Text Search                                        |
| Media                | Static uploads with magic-byte validation, UUID-scrambled filenames    |
| Auth                 | Email + password, bcrypt, rotating refresh tokens, revocable on logout |
| Admin console        | Next.js 16, Tailwind 4, Recharts                                       |
| Hosting              | Railway (backend + Redis), Supabase (Postgres), Expo EAS (mobile)      |

---

## Project layout

```
club-lms-for-kuba
├── backend                 FastAPI + SQLAlchemy async
│   ├── app
│   │   ├── api/v1          HTTP + WebSocket endpoints
│   │   ├── core            Settings, security, database, redis, limiter
│   │   ├── models          SQLAlchemy ORM (users, clubs, events, chats, …)
│   │   ├── schemas         Pydantic request/response models
│   │   └── services        Notifications, ws_manager, message_cleanup
│   ├── alembic             Versioned database migrations
│   └── scripts
│       ├── seed_db.py              Dev fixtures
│       └── seed_app_review.py      App Store review fixtures (idempotent)
├── frontend                React Native + Expo
│   └── src
│       ├── screens         Auth, main, admin
│       ├── components      Chat, event, community, onepass, admin
│       ├── services        API clients (auth, chat, events, moderation, …)
│       ├── navigation      Typed stack navigators
│       ├── context         AuthContext + friends
│       └── hooks           useChat, useWebSocket, useBlockedUsers
├── admin                   Next.js ops dashboard for superadmins
└── docs                    Design notes, QA report, deployment guides
```

---

## Quick start

### Prerequisites

- **Node** 20.x and **npm** 10.x (or **pnpm**), **Expo CLI** (`npx expo`)
- **Python** 3.12, plus `python -m venv` or `uv`
- **Docker** for local Postgres + Redis
- An iOS Simulator or Android Emulator (Xcode 16+ / Android Studio Koala+)

### 1. Backend

```bash
git clone https://github.com/KUBA-LMS/club-lms-for-kuba.git
cd club-lms-for-kuba

# Local Postgres (port 5434) + Redis (port 6379)
docker compose up -d

# Python env
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Schema + dev seed
alembic upgrade head
python -m scripts.seed_db

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend is now available at `http://localhost:8000` with interactive docs
at `http://localhost:8000/docs`.

### 2. Mobile app

> **Expo Go is not supported.** ClubX ships with Naver Maps and Vision
> Camera native modules, so you need a development build produced by
> `expo prebuild` + `expo run:ios` (or `run:android`).

```bash
cd ../frontend
npm install

# Points EXPO_PUBLIC_API_URL at your LAN IP so a phone can reach localhost
npm start

# Fresh install, or whenever app.json / native deps change:
npx expo prebuild --clean
npx expo run:ios         # or run:android
```

After the first native build, subsequent edits only need
`npx expo start --dev-client`; Metro takes it from there.

### 3. Sign in

| Role         | Username         | Password         |
| ------------ | ---------------- | ---------------- |
| Dev admin    | `admin`          | `admin123!`      |
| Dev member   | `testuser`       | `test1234!`      |
| App reviewer | `reviewer_admin` | `Review3r!Admin` |
| App reviewer | `reviewer_user`  | `Review3r!User`  |

> The reviewer accounts are created by
> [`backend/scripts/seed_app_review.py`](backend/scripts/seed_app_review.py)
> and are the credentials handed to Apple in the App Review Information.

---

## Environment

Backend config lives in `backend/.env` — see
[`backend/.env.example`](backend/.env.example) for the canonical list.
Minimum:

```env
DATABASE_URL=postgresql+asyncpg://clubx:clubx@localhost:5434/clubx
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<32+ random bytes>
GOOGLE_PLACES_API_KEY=<optional for geocoding>
```

The mobile app is configured via [`frontend/app.json`](frontend/app.json)
and `frontend/.env` (auto-generated by `npm start`).

---

## Deploying

**Backend** runs on Railway, **database** on Supabase, **mobile** is
distributed through Expo EAS.

```bash
# Backend: push to main, Railway rebuilds automatically.
git push origin main

# In Railway → Settings → Deploy:
#   Pre-deploy command  :  alembic upgrade head
#   Start command       :  uvicorn app.main:app --host 0.0.0.0 --port $PORT

# App Store review seed (one time, after a backend deploy)
cd backend
REVIEWER_ADMIN_PASSWORD='<strong>' \
REVIEWER_USER_PASSWORD='<strong>' \
railway run python -m scripts.seed_app_review

# Mobile: submit a TestFlight build
cd ../frontend
eas build --platform ios --profile production
eas submit --platform ios --latest
```

---

## Security & privacy posture

ClubX ships with production-hardened defaults rather than dev-only
shortcuts.

- **Access control** is enforced in the data layer, not the UI. Every
  club-scoped read re-verifies membership; every admin action re-verifies
  admin/lead role for *that* club.
- **JWT logout** blacklists the token in Redis for its remaining TTL, so
  a stolen token is dead the moment the user taps "Log out".
- **File uploads** verify real magic bytes, reject 0-byte or oversized
  files, and are served from UUID-scrambled paths — URL enumeration is
  cryptographically infeasible.
- **Password policy** requires letters, digits, and symbols, plus a
  common-password denylist. Enforced uniformly at signup, reset, and
  change.
- **Timezone contract**: every datetime on the wire carries `+00:00`.
  Clients render in device-local automatically.
- **Content moderation**: in-app report + block with AsyncStorage-backed
  blocklist, surfaced under Settings → Safety.
- **Soft delete + 3-day restore** for clubs, protecting against
  accidental destruction.

For the triage of 47 pre-submission findings, test cases, and an explicit
residual-risk register, see
[`docs/QA-REPORT-APP-STORE-READINESS.md`](docs/QA-REPORT-APP-STORE-READINESS.md).

---

## Documentation

| Area                         | File                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------- |
| App Store readiness / QA     | [`docs/QA-REPORT-APP-STORE-READINESS.md`](docs/QA-REPORT-APP-STORE-READINESS.md)   |
| Initial setup                | [`docs/01-INITIAL-SETUP.md`](docs/01-INITIAL-SETUP.md)                             |
| Cross-platform UI notes      | [`docs/02-CROSS-PLATFORM-UI.md`](docs/02-CROSS-PLATFORM-UI.md)                     |
| Deployment playbook          | [`docs/03-DEPLOYMENT.md`](docs/03-DEPLOYMENT.md)                                   |
| Project structure            | [`docs/04-PROJECT-STRUCTURE.md`](docs/04-PROJECT-STRUCTURE.md)                     |
| External APIs                | [`docs/05-EXTERNAL-APIS.md`](docs/05-EXTERNAL-APIS.md)                             |
| Performance / scaling notes  | [`docs/05-PERFORMANCE-AND-SCALING.md`](docs/05-PERFORMANCE-AND-SCALING.md)         |
| Production operations        | [`docs/06-PRODUCTION-OPERATIONS.md`](docs/06-PRODUCTION-OPERATIONS.md)             |
| Physical device testing      | [`docs/07-PHYSICAL-DEVICE-TESTING.md`](docs/07-PHYSICAL-DEVICE-TESTING.md)         |
| WebSocket refresh-token bug  | [`docs/08-WEBSOCKET-TOKEN-REFRESH-BUG.md`](docs/08-WEBSOCKET-TOKEN-REFRESH-BUG.md) |
| Frontend codebase guide      | [`docs/09-FRONTEND-CODEBASE-GUIDE.md`](docs/09-FRONTEND-CODEBASE-GUIDE.md)         |

---

## Roadmap

- [x] Rotating CODE128 barcode tickets (OnePass)
- [x] 1/N settlement with deep-linked Toss / KakaoPay
- [x] Soft-delete + 3-day restore for clubs
- [x] UGC moderation (report + block)
- [x] Access-control hardening + full QA pass for App Store
- [x] UTC timezone contract end-to-end
- [ ] Apple Sign In (ready to enable once social providers land)
- [ ] Signed-URL media delivery
- [ ] Club-level join-approval workflow (pending → approved)
- [ ] Calendar integrations (Google, iCal)
- [ ] Public profile discovery across universities

---

## Team

<div align="left">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/kona0107">
          <img src="https://avatars.githubusercontent.com/kona0107" width="120" alt="Jeonghyeon Park" />
          <br />
          <sub><b>Jeonghyeon Park</b></sub>
        </a>
        <br />
        Mobile engineering
      </td>
      <td align="center">
        <a href="https://github.com/danlee-dev">
          <img src="https://avatars.githubusercontent.com/danlee-dev" width="120" alt="Sungmin Lee" />
          <br />
          <sub><b>Sungmin Lee</b></sub>
        </a>
        <br />
        Backend · AI · Blockchain
      </td>
    </tr>
  </table>
</div>

---

## Contributing

Pull requests are welcome. Before opening one:

1. `pre-commit run --all-files` — lints Python and type-checks the mobile app.
2. `pytest backend/tests -q` for any backend change.
3. For schema changes: create an Alembic revision
   (`alembic revision -m '...' --autogenerate`) and include it in the PR.
4. Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).

All changes are expected to pass the App Store QA checklist in
[`docs/QA-REPORT-APP-STORE-READINESS.md`](docs/QA-REPORT-APP-STORE-READINESS.md#4-pre-submission-checklist-reviewer-facing)
before landing on `main`.

---

## License

© 2026 ClubX team. All rights reserved.

*Logo, product marks, and design are trademarks of the ClubX team. This
repository is private; redistribution without written permission is
prohibited.*
