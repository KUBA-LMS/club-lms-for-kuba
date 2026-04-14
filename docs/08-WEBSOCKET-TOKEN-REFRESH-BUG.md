# WebSocket Token Refresh Bug - Analysis and Fix

## Overview

WebSocket real-time messaging stopped working entirely after the access token expired.
REST API calls continued to function normally because the axios interceptor handled token refresh automatically, but the WebSocket connection kept failing with 403 because it reused the expired token.

This document covers the full debugging process: symptom observation, log-based diagnosis, root cause analysis, and the architectural fix.

---

## Symptom

- User A sends a message to User B via chat
- User B does NOT receive the message in real-time
- User B must manually refresh (pull down or navigate away/back) to see the message
- REST API works fine: messages are saved to DB, responses are 201 Created
- The issue appeared after some time of usage (not immediately after login)

---

## Architecture Background

### How REST Token Refresh Works

```
Client                    Server
  |                         |
  |--- REST request ------->|
  |<-- 401 Unauthorized ----|
  |                         |
  |--- POST /auth/refresh ->|  (axios interceptor catches 401,
  |<-- new access_token ----|   refreshes automatically)
  |                         |
  |--- retry original req ->|  (with new token)
  |<-- 200 OK --------------|
```

The axios response interceptor (`api.ts`) handles this transparently:
1. Detects 401 response
2. Calls `/auth/refresh` with the refresh token
3. Stores the new access token in AsyncStorage
4. Retries the original request with the new token

### How WebSocket Connection Works

```
Client                              Server
  |                                   |
  |--- WS upgrade request ---------->|
  |    ?token=<JWT access token>      |
  |                                   |--- verify_token(token)
  |                                   |    if invalid: reject (403)
  |<-- 101 Switching Protocols -------|    if valid: accept
  |                                   |
  |--- {"type":"subscribe",  -------->|
  |     "channel":"chat:xxx"}         |
  |<-- {"type":"subscribed"} ---------|
  |                                   |
  |    (bidirectional messages)       |
  |<-- {"type":"new_message"} --------|
```

Key difference from REST: WebSocket uses the token **only at connection time** (in the query string). There is no per-message authentication, and no built-in retry mechanism for expired tokens.

### Token Flow in the App

```
Login
  -> AuthContext stores accessToken in state
  -> useWebSocketConnection reads accessToken from context
  -> wsService.connect(url, accessToken)
  -> WS connected, subscriptions registered

Token Expires (e.g., after 30 min)
  -> REST call gets 401
  -> axios interceptor refreshes token
  -> new token stored in AsyncStorage
  -> [BUG] AuthContext state NOT updated
  -> [BUG] WS still uses old token
```

---

## Debugging Process

### Step 1: Added Debug Logging

Added `[WS]` prefixed logs to both backend and frontend:

**Backend (`ws_manager.py`):**
- Connection/disconnection events with user_id and total count
- Channel subscribe/unsubscribe events
- Publish and broadcast events with recipient lists
- Send failures

**Frontend (`websocket.ts`):**
- Connection success/failure
- Close events with code and reason
- Subscribe attempts (connected vs queued)
- Incoming messages and handler dispatch

### Step 2: Observed the Logs

**Backend log:**
```
WebSocket /api/v1/ws?token=eyJ...0003... 403
connection rejected (403 Forbidden)
connection closed
```

Both users' WebSocket connections were rejected with **403 Forbidden** before the handler even ran.

**Frontend log:**
```
[WS] Error: {...}
[WS] Closed: code=1006, reason=Received bad response code from server: 403.
[WS] Subscribe queued (not connected): chat:dddddddd-...
```

The WebSocket never connected. Channel subscriptions were queued locally but never sent to the server.

### Step 3: Traced the 403 Cause

The WebSocket endpoint verifies the JWT before accepting:

```python
# backend/app/api/v1/ws.py
@router.websocket("")
async def websocket_endpoint(websocket, token=Query(...)):
    payload = verify_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=4001, reason="Invalid token")
        return
    await manager.connect(websocket, user_id)
```

When `verify_token` fails (expired token), `websocket.close(4001)` is called BEFORE `websocket.accept()`. Starlette translates this into a 403 HTTP rejection (WebSocket upgrade denied).

The JWT in the URL had `exp: 1771958752` which was ~55 minutes in the past relative to the server time in the logs.

### Step 4: Why REST Worked but WS Didn't

The REST interceptor refreshes the token on 401 and stores it in AsyncStorage. But this update was invisible to the WebSocket system because:

1. The axios interceptor stores the new token via `storage.setAccessToken()`
2. AuthContext's `accessToken` state was **never updated** (no mechanism to sync)
3. `useWebSocketConnection` watches `accessToken` from AuthContext
4. Since the state didn't change, the effect didn't re-run
5. The WS reconnect loop reused the expired token stored in `wsService.token`

---

## Root Cause (Two Bugs)

### Bug 1: Token Refresh Not Propagated to AuthContext

```
axios interceptor -> storage.setAccessToken(newToken) -> OK
                  -> AuthContext.state.accessToken     -> NOT UPDATED
                  -> useWebSocketConnection            -> SEES OLD TOKEN
                  -> wsService reconnects              -> USES OLD TOKEN -> 403
```

The axios interceptor and AuthContext operated independently. Token refresh updated storage but not React state.

### Bug 2: disconnect() Destroys Channel Subscriptions

Even if the token was updated, calling `disconnect()` before `connect()` in `useWebSocketConnection` would clear all channel subscriptions:

```typescript
// useWebSocketConnection (BEFORE fix)
if (prevTokenRef.current !== accessToken) {
    wsService.disconnect();   // <-- clears this.channels and this.listeners
    wsService.connect(url, accessToken);
}
```

```typescript
// WebSocketService
disconnect(): void {
    this.intentionalClose = true;
    this._cleanup();
    this.channels.clear();    // all subscriptions gone
    this.listeners.clear();   // all handlers gone
}
```

After `disconnect() + connect()`:
- `onopen` calls `_resubscribe()`, which iterates `this.channels`
- But `this.channels` is empty (cleared by `disconnect()`)
- So `chat:{chatId}` subscription is never re-established
- `useChannel` hook's effect doesn't re-run (its dependency `channel` hasn't changed)

---

## Fix

### Fix 1: Token Refresh Callback (`api.ts` -> `AuthContext.tsx`)

Added a callback mechanism so the axios interceptor can notify AuthContext when the token is refreshed:

```typescript
// api.ts
let tokenRefreshCallback: ((token: string) => void) | null = null;

export function setTokenRefreshCallback(cb: ((token: string) => void) | null) {
    tokenRefreshCallback = cb;
}

// In the 401 interceptor, after refresh:
if (tokenRefreshCallback) {
    tokenRefreshCallback(access_token);
}
```

```typescript
// AuthContext.tsx
useEffect(() => {
    setTokenRefreshCallback((newToken: string) => {
        setState((prev) => ({ ...prev, accessToken: newToken }));
    });
    return () => setTokenRefreshCallback(null);
}, []);
```

Now: token refresh -> callback -> AuthContext state update -> `useWebSocketConnection` effect re-runs -> WS reconnects with new token.

### Fix 2: Preserve Subscriptions on Reconnect (`useWebSocket.ts`)

Changed `useWebSocketConnection` to NOT call `disconnect()` when the token changes:

```typescript
// BEFORE (broken)
wsService.disconnect();    // clears channels + listeners
wsService.connect(url, accessToken);

// AFTER (fixed)
wsService.connect(url, accessToken);  // preserves channels + listeners
```

`connect()` internally calls `_cleanup()` which only closes the WebSocket connection and cancels pending reconnect timers. It does NOT touch `this.channels` or `this.listeners`. So when the new connection opens, `_resubscribe()` finds all previously registered channels and re-subscribes.

`disconnect()` (full teardown) is only called on logout.

---

## Fixed Flow

```
Token Expires
  -> REST call gets 401
  -> axios interceptor calls /auth/refresh
  -> new access_token received
  -> storage.setAccessToken(newToken)
  -> tokenRefreshCallback(newToken)                    [Fix 1]
  -> AuthContext setState({ accessToken: newToken })
  -> useWebSocketConnection effect triggers
  -> wsService.connect(url, newToken)                  [Fix 2: no disconnect()]
  -> _cleanup() closes old WS (channels preserved)
  -> new WS connection with valid token
  -> onopen -> _resubscribe() -> chat:{id} restored
  -> real-time messages working again
```

---

## Key Takeaways

### 1. REST and WebSocket Have Different Auth Lifecycles

REST is stateless per-request: each call can attach a fresh token. WebSocket is long-lived: the token is used once at connection time. Any token refresh mechanism must explicitly propagate to the WebSocket layer.

### 2. WebSocket 403 vs 4001 Close Codes

When the server rejects a WebSocket BEFORE accepting it (before `websocket.accept()`), the client receives a 403 HTTP response, not a WebSocket close frame. The client's `onclose` fires with `code=1006` (abnormal closure), not the custom 4001 code the server intended. This means the client-side logic to detect "token expired" (`if code === 4001`) never triggers.

### 3. State Sync Between Layers

The axios interceptor and React context operated at different layers with no communication. The interceptor refreshed the token in storage, but the React state (which drives UI and side effects like WebSocket) was stale. This is a common pattern in React Native apps where storage and state can diverge silently.

### 4. disconnect() vs reconnect() Semantics

`disconnect()` implies "user is done" (logout) and should clean up everything. Token refresh is a "reconnection" scenario where the session continues - subscriptions and handlers should be preserved. These two operations need different implementations.

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Added `tokenRefreshCallback` + `setTokenRefreshCallback()` |
| `frontend/src/context/AuthContext.tsx` | Registered callback to sync `accessToken` state on refresh |
| `frontend/src/hooks/useWebSocket.ts` | Removed `disconnect()` call before `connect()` on token change |
| `frontend/src/services/websocket.ts` | Added debug logging (connect, close, subscribe, message events) |
| `backend/app/services/ws_manager.py` | Added debug logging (connect, disconnect, subscribe, publish, broadcast) |
| `backend/app/api/v1/chats.py` | Added debug logging around `_publish_message_notifications` |
