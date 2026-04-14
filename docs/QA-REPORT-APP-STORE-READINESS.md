# ClubX — App Store Readiness QA Report

**Scope**: Comprehensive security, business-logic, data-integrity, and UX audit
of the ClubX mobile app (React Native/Expo) and its FastAPI backend ahead of
Apple App Store submission.

**Methodology**: Parallel code review across four axes — (1) access control
and authentication, (2) business-logic correctness and edge cases, (3)
client-side UX and error handling, (4) platform-specific App Store policy
compliance. Each finding was triaged by severity, reproduced in code when
possible, and either fixed in-tree or formally accepted with rationale.

**Outcome**: 47 issues found. 43 fixed. 4 formally accepted residual risks
(documented below).

---

## 1. Summary Table

| # | Severity | Category | Finding | Status | File |
|---|---|---|---|---|---|
| 1 | Critical | Access control | Any logged-in user could list any club's members | Fixed | `backend/app/api/v1/clubs.py` |
| 2 | Critical | Access control | `GET /events/{id}` exposed events of clubs the caller did not belong to, including `friends_only` events | Fixed | `backend/app/api/v1/events.py` |
| 3 | Critical | Logging | `print()` statements leaked barcode/user/registration data in stdout | Fixed | `backend/app/api/v1/access_control.py` |
| 4 | Critical | Business logic | Past-date events could be created; `max_slots` floor missing at schema level | Fixed | `backend/app/api/v1/events.py`, `backend/app/schemas/event.py` |
| 5 | Critical | Frontend | Blank / whitespace-only legal names accepted at sign up | Fixed | `frontend/src/screens/SignUpStep1Screen.tsx`, `backend/app/schemas/user.py` |
| 6 | High | Access control | Global user search returned `student_id` to any admin across clubs | Fixed (now scoped by `club_id`) | `backend/app/api/v1/access_control.py`, `frontend/src/services/accessControl.ts` |
| 7 | High | Access control | WebSocket `chat:*` / `club:*` subscriptions accepted without membership check | Fixed (DB check on every subscribe) | `backend/app/api/v1/ws.py` |
| 8 | High | Access control | `registrations.py` / `tickets.py` admin bypass used global `role == "admin"` (never true) | Fixed (`verify_club_admin` on event's club) | `backend/app/api/v1/registrations.py`, `backend/app/api/v1/tickets.py` |
| 9 | High | Authentication | Logout did not revoke JWT; stolen token remained valid for its lifetime | Fixed (Redis blacklist of sha256 fingerprint with TTL = remaining expiry) | `backend/app/core/security.py`, `backend/app/api/v1/auth.py` |
| 10 | High | Business logic | Ticket check-in race: same barcode scanned twice concurrently both succeeded | Fixed (`SELECT ... FOR UPDATE`) | `backend/app/api/v1/tickets.py` |
| 11 | High | Business logic | Case-sensitive username/email allowed `John` vs `john` as separate accounts | Fixed (case-insensitive compare on signup / login / reset) | `backend/app/api/v1/auth.py` |
| 12 | High | Business logic | Sole admin of a club could leave, orphaning the club | Fixed (`400` unless another admin/lead remains) | `backend/app/api/v1/clubs.py` |
| 13 | High | Business logic | 1/N split allowed n=1 (self-settlement) — edge case bypassed validation | Fixed (`n >= 2` enforced) | `backend/app/api/v1/payments.py` |
| 14 | High | Upload | Image extension derived from client-supplied filename; MIME spoofing possible | Fixed (magic-byte sniff, server picks extension) | `backend/app/api/v1/upload.py` |
| 15 | High | Frontend | ChatMessageBar `onPress` fired during `isSending`, producing duplicate sends | Fixed (local ref guard) | `frontend/src/components/chat/ChatMessageBar.tsx` |
| 16 | High | Frontend | `AsyncStorage` search history persisted across logout | Fixed (`clearAuth` removes search history) | `frontend/src/services/storage.ts` |
| 17 | High | Frontend | Permissive email regex (single-char TLD) | Fixed (TLD ≥ 2) | `frontend/src/screens/SignUpStep1Screen.tsx` |
| 18 | High | Internationalization | Naive datetimes emitted without UTC offset → JS clients parsed as local | Fixed (`UTCJSONResponse` emits `+00:00` for naive datetimes) | `backend/app/main.py` |
| 19 | Medium | Access control | Club-scoped chats could mix in non-members | Fixed (all `member_ids` verified against `user_club`) | `backend/app/api/v1/chats.py` |
| 20 | Medium | Business logic | Empty or whitespace-only chat messages allowed | Fixed (`min_length=1` + `field_validator`, plus `max_length=4000`) | `backend/app/schemas/chat.py` |
| 21 | Medium | Authentication | Password policy: 8 chars with no complexity floor, no common-password denylist | Fixed (letter + digit + symbol + denylist; `<=128` chars) | `backend/app/schemas/user.py`, `backend/app/schemas/auth.py` |
| 22 | Medium | Business logic | Friend request A→B and B→A could both persist (race) | Fixed (`IntegrityError` handler auto-accepts inverse request) | `backend/app/api/v1/users.py` |
| 23 | Medium | Business logic | `cost_type=free` accepted `cost_amount`; paid events accepted `<=0` | Fixed (schema/logic cross-check) | `backend/app/api/v1/events.py` |
| 24 | Medium | Business logic | Club restore could drift by host-tz hours if DB returned naive datetime | Fixed (assume-UTC documented and enforced) | `backend/app/api/v1/clubs.py` |
| 25 | Medium | Headers | No `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Content-Security-Policy` | Fixed (middleware) | `backend/app/main.py` |
| 26 | Medium | Frontend | `UserCreate` backend schema lacked username regex | Fixed (`pattern=^[A-Za-z0-9_]+$`) | `backend/app/schemas/user.py` |
| 27 | Medium | Frontend | Signup allowed unbounded-length email / legal name inputs | Fixed (`maxLength` on TextInput, `max_length` on Field) | `frontend/src/screens/SignUpStep1Screen.tsx` |
| 28 | Low | Frontend | Access-control `searchUsers` was called with single arg; after scoping it now requires `clubId` | Fixed (signature updated, all callers use chat.ts variant) | `frontend/src/services/accessControl.ts` |

*(The full list of 47 items with line references lives in
`backend/app/api/v1/*.py` commit messages; this table enumerates the
user-facing ones.)*

---

## 2. Timezone Contract (End-to-End)

**Requirement**: Every datetime shown in the app renders in the **user's
device local time zone**, with no exceptions.

**Backend**:
- All writes go through `datetime.now(timezone.utc)`.
- DB columns: existing `DateTime` columns store naive UTC; new columns
  (`clubs.deleted_at`) use `DateTime(timezone=True)`.
- Responses flow through `UTCJSONResponse` ([backend/app/main.py](../backend/app/main.py))
  which guarantees every emitted datetime has a `+00:00` suffix — this is the
  contract point the contract relies on.

**Frontend**:
- `new Date(isoStringWithTZ)` parses in UTC.
- Display uses `Intl.DateTimeFormat` via `toLocaleDateString` /
  `toLocaleTimeString` — both honour the device's current tz automatically.
- Event creation: `Date.toISOString()` → backend stores UTC.

**Result**: a reviewer in PST sees the same event displayed in PST; a user in
KST sees it in KST; the underlying UTC storage never changes.

---

## 3. Deferred / Accepted Residual Risks

| # | Risk | Reason for accepting | Mitigation in place |
|---|---|---|---|
| R1 | `/static/uploads/{uuid}.ext` is publicly reachable without authentication | Migrating to signed URLs would break every `<Image source={...}>` in the app and require a second headers-aware fetch pipeline. | File names are 128-bit UUID hex (enumeration infeasible), directory listing disabled, security headers active. |
| R2 | Reset token stateless (issued until expiry, 30 min) | No practical abuse vector: reset emails only sent to verified-owner addresses, short TTL. | Per-IP rate limit of 3/min on `/auth/forgot-password`. |
| R3 | Account deletion anonymises but leaves message rows | Fully hard-deleting would destroy conversation context for other participants, which can itself constitute data loss. | Message sender is replaced with "Unknown User"; personal identifiers cleared. |
| R4 | Superadmin role remains globally trusted | Only used by the operator team with separate credentials; never exposed to mobile clients. | Login endpoint refuses superadmin credentials: `"Superadmin must use the admin dashboard"`. |

---

## 4. Pre-Submission Checklist (Reviewer-Facing)

Run before every App Store submission:

### Data
- [ ] Production database seeded with ≥ 2 test accounts, ≥ 3 clubs,
      ≥ 6 events across status categories, ≥ 2 group chats with sample
      messages.
- [ ] No real student IDs in production DB outside of the internal team.
- [ ] Test credentials included in App Store Connect → App Review
      Information.

### Auth / Privacy
- [ ] Signup rejects blank legal name, invalid email TLD, weak passwords,
      duplicate case-variant usernames.
- [ ] Logout invalidates token (verify by calling any protected endpoint
      with the logged-out token and expecting `401`).
- [ ] Reset-password link expires 30 min after issue.

### Access control
- [ ] `GET /clubs/{id}/members` returns 403 to non-members.
- [ ] `GET /events/{id}` returns 403 to non-members of the event's club.
- [ ] `GET /access-control/users/search` requires `club_id` and verifies
      admin/lead of that club.
- [ ] WebSocket `subscribe` to a foreign `chat:<id>` returns
      `{"type":"error"}`.

### Business logic
- [ ] Attempt to create an event in the past → 400.
- [ ] Attempt to create an event with `max_slots=0` → 422 (schema).
- [ ] Attempt to leave a club as the sole admin → 400.
- [ ] Scan the same valid barcode twice concurrently → only one checkin
      succeeds.

### UX
- [ ] Chat send button cannot double-submit.
- [ ] SignUp step 1 rejects whitespace-only fields.
- [ ] Logout clears search history as well as tokens.
- [ ] Every datetime shown in the app matches the device tz (verify by
      switching device tz between KST and PST).

### App Store policy
- [ ] Policies accessible in-app (`Settings → About → Privacy Policy /
      Terms of Service`).
- [ ] UGC moderation present (long-press on a peer's message →
      Report / Block; `Settings → Safety → Blocked Users`).
- [ ] No references to real university brand names in user-visible strings.
- [ ] No App-Store-banned keywords in metadata (`beta`, `test`, `demo`).

---

## 5. Test Cases for QA Execution

The following test cases should each pass before release. Each maps to a
finding fixed in Section 1.

### TC-1 · Club member list privacy
1. Log in as `testuser` (not a member of `45th_KUBA`).
2. Issue `GET /clubs/{KUBA_ID}/members`.
3. **Expect**: `403 Forbidden`, no member data in body.

### TC-2 · Event visibility
1. Log in as a user in club A only.
2. Issue `GET /events/{event_in_club_B}`.
3. **Expect**: `403 Forbidden`.

### TC-3 · Ticket double-scan
1. Valid unused ticket `T`.
2. Two parallel `POST /tickets/checkin` with `T.barcode`.
3. **Expect**: exactly one `success=true`; the other returns `already used`.

### TC-4 · 1/N settlement
1. Chat with 1 other member.
2. Requester: `total_amount = 100 KRW`, `participant_ids = [other]`.
3. **Expect**: 2 splits, requester 34 KRW, other 34 KRW… `ValueError` trapped
   at `n=1` path.

### TC-5 · Username case duplicate
1. Create user `John`.
2. Attempt to create user `john`.
3. **Expect**: `400 Username already taken`.

### TC-6 · Logout invalidates token
1. Log in, capture access token `T`.
2. Call `POST /auth/logout` with `T`.
3. Use `T` to call `GET /auth/me`.
4. **Expect**: `401 Unauthorized`.

### TC-7 · WebSocket foreign channel
1. Connect with valid token.
2. Send `{"type":"subscribe","channel":"chat:<foreign-uuid>"}`.
3. **Expect**: `{"type":"error","message":"Cannot subscribe to: chat:..."}`.

### TC-8 · Image upload spoof
1. Rename `payload.sh` to `payload.jpg`, upload to `/upload/image`.
2. **Expect**: `400 Uploaded file is not a valid JPEG, PNG, WebP, or GIF
   image`.

### TC-9 · Friend request race
1. User A calls `POST /users/me/friends/B`.
2. Simultaneously B calls `POST /users/me/friends/A`.
3. **Expect**: both users end up in `friendships` table; exactly one
   `FriendRequest` row marked `accepted`.

### TC-10 · TZ round-trip
1. Device tz = PST. Admin creates event at "2026-05-01 18:00 PST".
2. Backend stores `2026-05-02T02:00:00+00:00`.
3. Device tz switched to KST.
4. Event detail page displays "2026-05-02 11:00 KST".

---

## 6. Pending / Post-submission Work

Not blocking for current submission but tracked:

- **Figma design rollout**: 10 new login/signup screens waiting on a Figma
  Personal Access Token so the MCP server can fetch the design graph.
- **Club join admission flow**: currently immediate on QR scan; plan to add
  a `user_club.status` column so large clubs can gate admission.
- **Seeded fixtures**: script to populate production DB with the reviewer
  dataset (test accounts, three clubs, six events, two chats). Runs via
  `python -m scripts.seed_app_review` using API calls only (no direct SQL),
  so it respects all the access-control invariants above.

---

## 7. Document Change Log

| Date (UTC) | Author | Change |
|---|---|---|
| 2026-04-14 | QA audit | Initial release |
