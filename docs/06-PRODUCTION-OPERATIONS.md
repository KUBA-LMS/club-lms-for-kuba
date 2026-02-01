# 프로덕션 운영 및 모니터링 가이드

## 개요

이 문서는 실제 사용자에게 서비스를 제공할 때 필요한 모니터링, 알림, 장애 대응, 유지보수에 대해 다룬다. "지금 몇 명이 접속해있지?", "에러가 났는데 어디서 났지?", "서버가 죽으면 어떻게 알지?" 같은 실무적인 질문들에 대한 답을 제공한다.

## 모니터링 스택 개요

### 권장 구성 (소규모 서비스)

```
┌─────────────────────────────────────────────────────────────┐
│                        모니터링 스택                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   Sentry    │    │  Prometheus │    │   Uptime    │    │
│   │ (에러 추적)  │    │  + Grafana  │    │   Kuma     │    │
│   │             │    │ (메트릭)     │    │ (가동 확인) │    │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│          │                  │                  │            │
│          └────────────┬─────┴──────────────────┘            │
│                       │                                     │
│                       ▼                                     │
│              ┌─────────────────┐                           │
│              │  Slack/Discord  │                           │
│              │     알림        │                           │
│              └─────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 도구별 역할

| 도구 | 역할 | 비용 |
|------|------|------|
| Sentry | 에러 추적, 스택 트레이스 | 무료 (5K 이벤트/월) |
| Prometheus + Grafana | 메트릭 수집, 대시보드 | 무료 (셀프호스팅) |
| Uptime Kuma | 서버 가동 상태 확인 | 무료 (셀프호스팅) |
| Better Stack / Betterstack | 업타임 + 로그 통합 | 무료 티어 있음 |

## 1. 실시간 접속자 수 확인

### 방법 1: 간단한 메모리 기반 카운터

```python
# app/middleware/active_users.py
from fastapi import FastAPI, Request
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

class ActiveUsersTracker:
    def __init__(self, timeout_seconds: int = 300):
        self.active_users: dict[str, datetime] = {}
        self.timeout = timedelta(seconds=timeout_seconds)

    def touch(self, user_id: str):
        """사용자 활동 기록"""
        self.active_users[user_id] = datetime.utcnow()

    def get_active_count(self) -> int:
        """현재 활성 사용자 수"""
        now = datetime.utcnow()
        # 타임아웃된 사용자 제거
        self.active_users = {
            uid: last_seen
            for uid, last_seen in self.active_users.items()
            if now - last_seen < self.timeout
        }
        return len(self.active_users)

    def get_active_users(self) -> list[str]:
        """현재 활성 사용자 목록"""
        self.get_active_count()  # 정리
        return list(self.active_users.keys())


# 전역 인스턴스
active_tracker = ActiveUsersTracker(timeout_seconds=300)  # 5분


# 미들웨어
async def track_active_users(request: Request, call_next):
    # 인증된 사용자인 경우
    if hasattr(request.state, 'user') and request.state.user:
        active_tracker.touch(request.state.user.id)

    response = await call_next(request)
    return response


# 관리자 API
@app.get("/admin/stats/active-users")
async def get_active_users():
    return {
        "active_count": active_tracker.get_active_count(),
        "active_users": active_tracker.get_active_users(),
        "timestamp": datetime.utcnow().isoformat()
    }
```

### 방법 2: Redis 기반 (다중 서버용)

```python
# app/services/active_users_redis.py
import redis.asyncio as redis
from datetime import datetime

redis_client = redis.from_url("redis://localhost:6379")

ACTIVE_USERS_KEY = "active_users"
TIMEOUT_SECONDS = 300  # 5분


async def touch_user(user_id: str):
    """사용자 활동 기록"""
    score = datetime.utcnow().timestamp()
    await redis_client.zadd(ACTIVE_USERS_KEY, {user_id: score})


async def get_active_count() -> int:
    """현재 활성 사용자 수"""
    min_score = datetime.utcnow().timestamp() - TIMEOUT_SECONDS

    # 오래된 항목 제거
    await redis_client.zremrangebyscore(ACTIVE_USERS_KEY, 0, min_score)

    # 현재 카운트
    return await redis_client.zcard(ACTIVE_USERS_KEY)


async def get_active_users() -> list[str]:
    """현재 활성 사용자 목록"""
    min_score = datetime.utcnow().timestamp() - TIMEOUT_SECONDS
    await redis_client.zremrangebyscore(ACTIVE_USERS_KEY, 0, min_score)

    users = await redis_client.zrange(ACTIVE_USERS_KEY, 0, -1)
    return [u.decode() for u in users]
```

### 방법 3: WebSocket 기반 (실시간)

```python
# app/websocket/connection_manager.py
from fastapi import WebSocket
from typing import Dict, Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    def get_active_count(self) -> int:
        return len(self.active_connections)

    def get_connection_count(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())


manager = ConnectionManager()


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # 메시지 처리
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


@app.get("/admin/stats/connections")
async def get_connection_stats():
    return {
        "active_users": manager.get_active_count(),
        "total_connections": manager.get_connection_count()
    }
```

## 2. Prometheus + Grafana 설정

### 2.1 FastAPI에 Prometheus 메트릭 추가

```bash
pip install prometheus-fastapi-instrumentator
```

```python
# main.py
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Prometheus 메트릭 자동 수집
instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_respect_env_var=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/metrics", "/health"],
    inprogress_name="http_requests_inprogress",
    inprogress_labels=True,
)

instrumentator.instrument(app).expose(app, endpoint="/metrics")
```

### 2.2 커스텀 메트릭 추가

```python
from prometheus_client import Counter, Histogram, Gauge

# 활성 사용자 수
ACTIVE_USERS = Gauge(
    'app_active_users_total',
    'Number of active users'
)

# 로그인 횟수
LOGIN_COUNTER = Counter(
    'app_login_total',
    'Total login attempts',
    ['status']  # success, failure
)

# API 응답 시간 (엔드포인트별)
RESPONSE_TIME = Histogram(
    'app_response_time_seconds',
    'Response time in seconds',
    ['endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)


# 사용 예시
@app.post("/auth/login")
async def login(credentials: LoginRequest):
    try:
        user = await authenticate(credentials)
        LOGIN_COUNTER.labels(status='success').inc()
        return {"token": create_token(user)}
    except AuthError:
        LOGIN_COUNTER.labels(status='failure').inc()
        raise


# 주기적으로 활성 사용자 수 업데이트
async def update_active_users_metric():
    while True:
        count = active_tracker.get_active_count()
        ACTIVE_USERS.set(count)
        await asyncio.sleep(10)
```

### 2.3 Docker Compose로 스택 구성

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['host.docker.internal:8000']
    metrics_path: /metrics

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### 2.4 Grafana 대시보드 설정

1. Grafana 접속 (http://localhost:3001, admin/admin123)
2. Data Sources > Add Prometheus (URL: http://prometheus:9090)
3. 대시보드 추가 (Import > Dashboard ID: 16110)

**주요 패널 구성:**

| 패널 | 쿼리 | 용도 |
|------|------|------|
| 요청 수/분 | `rate(http_requests_total[1m])` | 트래픽 모니터링 |
| 응답 시간 (p95) | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | 성능 모니터링 |
| 에러율 | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])` | 안정성 확인 |
| 활성 사용자 | `app_active_users_total` | 동시 접속자 |

## 3. Sentry 에러 트래킹

### 3.1 설치 및 설정

```bash
pip install "sentry-sdk[fastapi]"
```

```python
# main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn="https://your-key@sentry.io/your-project",
    environment="production",  # 또는 "staging", "development"
    release="my-app@1.0.0",    # 버전 관리

    # 성능 모니터링
    traces_sample_rate=0.1,    # 10% 샘플링 (프로덕션)
    profiles_sample_rate=0.1,  # 프로파일링

    # 통합
    integrations=[
        FastApiIntegration(transaction_style="endpoint"),
        SqlalchemyIntegration(),
    ],

    # 민감 정보 전송 여부
    send_default_pii=False,

    # 무시할 에러
    ignore_errors=[
        KeyboardInterrupt,
        ConnectionResetError,
    ],

    # 요청 필터링 (비밀번호 등 제거)
    before_send=filter_sensitive_data,
)


def filter_sensitive_data(event, hint):
    """민감한 데이터 필터링"""
    if 'request' in event and 'data' in event['request']:
        data = event['request']['data']
        if isinstance(data, dict):
            for key in ['password', 'token', 'secret', 'credit_card']:
                if key in data:
                    data[key] = '[FILTERED]'
    return event
```

### 3.2 수동 에러 보고

```python
import sentry_sdk

# 예외 캡처
try:
    risky_operation()
except Exception as e:
    sentry_sdk.capture_exception(e)

# 메시지 전송
sentry_sdk.capture_message("Something unusual happened", level="warning")

# 컨텍스트 추가
with sentry_sdk.push_scope() as scope:
    scope.set_tag("feature", "payment")
    scope.set_user({"id": user.id, "email": user.email})
    scope.set_extra("order_id", order.id)
    sentry_sdk.capture_exception(e)
```

### 3.3 사용자 컨텍스트 설정

```python
from fastapi import Request

@app.middleware("http")
async def sentry_user_context(request: Request, call_next):
    if hasattr(request.state, 'user') and request.state.user:
        sentry_sdk.set_user({
            "id": str(request.state.user.id),
            "email": request.state.user.email,
        })
    else:
        sentry_sdk.set_user(None)

    response = await call_next(request)
    return response
```

## 4. 로깅 시스템

### 4.1 구조화된 로깅 설정

```python
# app/core/logging.py
import logging
import json
from datetime import datetime
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name

        # 에러인 경우 스택 트레이스 추가
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)


def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # JSON 포맷 핸들러
    handler = logging.StreamHandler()
    handler.setFormatter(CustomJsonFormatter())
    logger.addHandler(handler)

    # 파일 핸들러 (선택)
    file_handler = logging.FileHandler('app.log')
    file_handler.setFormatter(CustomJsonFormatter())
    logger.addHandler(file_handler)

    return logger


# 사용
logger = setup_logging()

logger.info("User logged in", extra={
    "user_id": user.id,
    "ip": request.client.host,
    "user_agent": request.headers.get("user-agent")
})
```

### 4.2 요청 로깅 미들웨어

```python
import time
import uuid
from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    # 요청 ID를 Sentry에도 추가
    sentry_sdk.set_tag("request_id", request_id)

    logger.info("Request started", extra={
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "client_ip": request.client.host,
    })

    response = await call_next(request)

    duration = time.time() - start_time

    logger.info("Request completed", extra={
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": round(duration * 1000, 2),
    })

    # 느린 요청 경고
    if duration > 1.0:
        logger.warning("Slow request detected", extra={
            "request_id": request_id,
            "path": request.url.path,
            "duration_ms": round(duration * 1000, 2),
        })

    response.headers["X-Request-ID"] = request_id
    return response
```

## 5. 알림 설정

### 5.1 Discord Webhook

```python
# app/services/notifications.py
import httpx
from datetime import datetime
from enum import Enum

class AlertLevel(Enum):
    INFO = 0x3498db      # 파란색
    WARNING = 0xf39c12   # 노란색
    ERROR = 0xe74c3c     # 빨간색
    CRITICAL = 0x9b59b6  # 보라색


DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/xxx/yyy"


async def send_discord_alert(
    title: str,
    message: str,
    level: AlertLevel = AlertLevel.INFO,
    fields: dict = None
):
    embed = {
        "title": title,
        "description": message,
        "color": level.value,
        "timestamp": datetime.utcnow().isoformat(),
        "footer": {"text": "My App Monitor"}
    }

    if fields:
        embed["fields"] = [
            {"name": k, "value": str(v), "inline": True}
            for k, v in fields.items()
        ]

    payload = {"embeds": [embed]}

    async with httpx.AsyncClient() as client:
        try:
            await client.post(DISCORD_WEBHOOK_URL, json=payload)
        except Exception as e:
            logger.error(f"Failed to send Discord alert: {e}")


# 사용 예시
await send_discord_alert(
    title="Server Error",
    message="500 에러가 발생했습니다",
    level=AlertLevel.ERROR,
    fields={
        "Endpoint": "/api/users",
        "Error": "Database connection failed",
        "User": "user@example.com"
    }
)
```

### 5.2 Slack Webhook

```python
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/xxx/yyy/zzz"


async def send_slack_alert(
    title: str,
    message: str,
    level: str = "info",  # info, warning, error
    fields: dict = None
):
    color_map = {
        "info": "#3498db",
        "warning": "#f39c12",
        "error": "#e74c3c",
    }

    attachment = {
        "color": color_map.get(level, "#3498db"),
        "title": title,
        "text": message,
        "ts": datetime.utcnow().timestamp(),
    }

    if fields:
        attachment["fields"] = [
            {"title": k, "value": str(v), "short": True}
            for k, v in fields.items()
        ]

    payload = {"attachments": [attachment]}

    async with httpx.AsyncClient() as client:
        await client.post(SLACK_WEBHOOK_URL, json=payload)
```

### 5.3 자동 알림 트리거

```python
# 에러율 기반 알림
class ErrorRateMonitor:
    def __init__(self, window_seconds: int = 60, threshold: float = 0.05):
        self.window = window_seconds
        self.threshold = threshold
        self.requests = []
        self.errors = []
        self.alerted = False

    def record(self, is_error: bool):
        now = datetime.utcnow().timestamp()
        self.requests.append(now)
        if is_error:
            self.errors.append(now)

        # 오래된 기록 정리
        cutoff = now - self.window
        self.requests = [t for t in self.requests if t > cutoff]
        self.errors = [t for t in self.errors if t > cutoff]

    async def check_and_alert(self):
        if len(self.requests) < 10:  # 최소 요청 수
            return

        error_rate = len(self.errors) / len(self.requests)

        if error_rate > self.threshold and not self.alerted:
            await send_discord_alert(
                title="High Error Rate Alert",
                message=f"에러율이 {error_rate:.1%}로 임계치를 초과했습니다",
                level=AlertLevel.CRITICAL,
                fields={
                    "Total Requests": len(self.requests),
                    "Errors": len(self.errors),
                    "Error Rate": f"{error_rate:.1%}",
                    "Threshold": f"{self.threshold:.1%}"
                }
            )
            self.alerted = True

        elif error_rate <= self.threshold and self.alerted:
            await send_discord_alert(
                title="Error Rate Recovered",
                message="에러율이 정상으로 돌아왔습니다",
                level=AlertLevel.INFO
            )
            self.alerted = False


error_monitor = ErrorRateMonitor(window_seconds=60, threshold=0.05)


@app.middleware("http")
async def monitor_errors(request: Request, call_next):
    response = await call_next(request)
    error_monitor.record(is_error=response.status_code >= 500)
    await error_monitor.check_and_alert()
    return response
```

## 6. 업타임 모니터링

### 6.1 Uptime Kuma 설정

```yaml
# docker-compose.yml에 추가
services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    volumes:
      - uptime-kuma-data:/app/data
    ports:
      - "3002:3001"
    restart: unless-stopped

volumes:
  uptime-kuma-data:
```

설정 후:
1. http://localhost:3002 접속
2. 모니터 추가 (HTTP, API 엔드포인트)
3. 알림 채널 설정 (Discord, Slack)
4. 상태 페이지 생성 (사용자에게 공개 가능)

### 6.2 외부 서비스 사용

| 서비스 | 무료 티어 | 특징 |
|--------|-----------|------|
| Better Stack | 10개 모니터 | 업타임 + 로그 통합 |
| Pingdom | 1개 모니터 | 가장 유명 |
| UptimeRobot | 50개 모니터 | 5분 간격 체크 |
| Cronitor | 5개 모니터 | 크론잡 모니터링 특화 |

### 6.3 헬스체크 엔드포인트 상세

```python
from datetime import datetime
from enum import Enum
import asyncio

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


async def check_database():
    try:
        async with asyncio.timeout(5):
            await db.execute(text("SELECT 1"))
        return HealthStatus.HEALTHY, None
    except asyncio.TimeoutError:
        return HealthStatus.DEGRADED, "Database slow"
    except Exception as e:
        return HealthStatus.UNHEALTHY, str(e)


async def check_redis():
    try:
        async with asyncio.timeout(2):
            await redis_client.ping()
        return HealthStatus.HEALTHY, None
    except Exception as e:
        return HealthStatus.DEGRADED, str(e)  # Redis는 없어도 동작 가능


async def check_external_api():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get("https://api.example.com/health")
            if response.status_code == 200:
                return HealthStatus.HEALTHY, None
            return HealthStatus.DEGRADED, f"Status {response.status_code}"
    except Exception as e:
        return HealthStatus.DEGRADED, str(e)


@app.get("/health")
async def health_check():
    checks = {}
    overall_status = HealthStatus.HEALTHY

    # 병렬로 체크
    db_status, db_error = await check_database()
    redis_status, redis_error = await check_redis()

    checks["database"] = {"status": db_status, "error": db_error}
    checks["redis"] = {"status": redis_status, "error": redis_error}

    # 전체 상태 결정
    statuses = [db_status, redis_status]
    if HealthStatus.UNHEALTHY in statuses:
        overall_status = HealthStatus.UNHEALTHY
    elif HealthStatus.DEGRADED in statuses:
        overall_status = HealthStatus.DEGRADED

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "checks": checks
    }


# 간단한 liveness probe (쿠버네티스용)
@app.get("/health/live")
async def liveness():
    return {"status": "ok"}


# readiness probe
@app.get("/health/ready")
async def readiness():
    db_status, _ = await check_database()
    if db_status == HealthStatus.UNHEALTHY:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ok"}
```

## 7. 장애 대응 절차

### 7.1 장애 등급 정의

| 등급 | 정의 | 대응 시간 | 예시 |
|------|------|-----------|------|
| P1 (Critical) | 서비스 전체 장애 | 즉시 | 서버 다운, DB 연결 불가 |
| P2 (Major) | 주요 기능 장애 | 30분 이내 | 로그인 불가, 결제 실패 |
| P3 (Minor) | 부분 기능 장애 | 4시간 이내 | 일부 페이지 오류 |
| P4 (Low) | 사소한 문제 | 24시간 이내 | UI 깨짐, 오타 |

### 7.2 장애 대응 체크리스트

```markdown
## 장애 발생 시

### 1. 초기 대응 (5분 이내)
- [ ] 장애 인지 및 범위 파악
- [ ] Slack/Discord에 장애 알림 공유
- [ ] 영향받는 사용자 수 확인

### 2. 원인 파악 (15분 이내)
- [ ] 최근 배포 내역 확인
- [ ] 에러 로그 확인 (Sentry)
- [ ] 메트릭 이상 확인 (Grafana)
- [ ] 외부 서비스 상태 확인

### 3. 조치 (상황에 따라)
- [ ] 롤백 필요 여부 결정
- [ ] 임시 조치 또는 핫픽스 배포
- [ ] 사용자 공지 (필요 시)

### 4. 복구 후
- [ ] 정상화 확인
- [ ] 복구 알림 공유
- [ ] 포스트모템 작성 (P1, P2)
```

### 7.3 롤백 절차

```bash
# EAS를 사용하는 경우

# 1. 이전 빌드 확인
eas build:list --platform all

# 2. 이전 버전으로 OTA 업데이트
eas update --branch production --message "Rollback to previous version"

# 3. 네이티브 롤백 필요 시
# App Store / Play Store에서 이전 버전 제출
```

```bash
# 백엔드 (Docker)

# 1. 이전 이미지로 롤백
docker-compose down
docker-compose up -d --pull never  # 이전 이미지 사용

# 2. 특정 버전으로 롤백
docker-compose pull app:v1.2.3
docker-compose up -d
```

### 7.4 포스트모템 템플릿

```markdown
# 장애 보고서

## 개요
- **발생 일시**: 2024-01-15 14:30 KST
- **복구 일시**: 2024-01-15 15:15 KST
- **지속 시간**: 45분
- **영향 범위**: 전체 사용자 (200명)
- **장애 등급**: P1

## 타임라인
- 14:30 - 에러 알림 수신
- 14:35 - 원인 파악 시작
- 14:45 - DB 커넥션 풀 고갈 확인
- 15:00 - 커넥션 풀 증설 및 재시작
- 15:15 - 정상화 확인

## 근본 원인
배치 작업에서 DB 커넥션을 반환하지 않아 커넥션 풀 고갈

## 조치 내용
1. 커넥션 풀 사이즈 20 → 50 증가
2. 배치 작업 코드 수정 (커넥션 반환 보장)
3. 커넥션 풀 모니터링 알림 추가

## 재발 방지
- [ ] 커넥션 풀 사용량 모니터링 대시보드 추가
- [ ] 배치 작업 코드 리뷰 강화
- [ ] 로드 테스트에 배치 작업 시나리오 추가
```

## 8. 정기 유지보수

### 8.1 일일 체크리스트

```markdown
- [ ] Grafana 대시보드 확인 (이상 징후)
- [ ] Sentry 새 에러 확인
- [ ] 디스크 사용량 확인
- [ ] 백업 상태 확인
```

### 8.2 주간 체크리스트

```markdown
- [ ] 보안 업데이트 확인
- [ ] 의존성 취약점 스캔
- [ ] 로그 정리 (30일 이상)
- [ ] 성능 추이 분석
```

### 8.3 월간 체크리스트

```markdown
- [ ] 부하 테스트 실행
- [ ] 백업 복구 테스트
- [ ] SSL 인증서 만료 확인
- [ ] 비용 분석
```

## 9. 관리자 대시보드 API

```python
from fastapi import APIRouter, Depends
from app.auth import require_admin

admin_router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


@admin_router.get("/stats")
async def get_stats():
    return {
        "active_users": active_tracker.get_active_count(),
        "total_users": await db.scalar(select(func.count(User.id))),
        "requests_today": await get_today_request_count(),
        "errors_today": await get_today_error_count(),
        "avg_response_time": await get_avg_response_time(),
        "uptime_percentage": 99.9,  # 계산 로직 필요
    }


@admin_router.get("/stats/hourly")
async def get_hourly_stats():
    """시간별 통계"""
    # Prometheus 쿼리 또는 자체 집계
    pass


@admin_router.get("/users/active")
async def get_active_users_list():
    """현재 접속 중인 사용자 목록"""
    return {
        "count": active_tracker.get_active_count(),
        "users": active_tracker.get_active_users()
    }


@admin_router.get("/errors/recent")
async def get_recent_errors():
    """최근 에러 목록 (Sentry API 연동)"""
    pass
```

## 10. 비용 최적화

### 모니터링 스택 비용 (월간 추정)

| 구성 | 셀프호스팅 | 매니지드 서비스 |
|------|------------|-----------------|
| 메트릭 | $0 (Prometheus) | $50+ (Datadog) |
| 로그 | $0 (Loki) | $30+ (Papertrail) |
| 에러 추적 | $0 (Sentry OSS) | $0-$26 (Sentry Cloud) |
| 업타임 | $0 (Uptime Kuma) | $0-$10 (Better Stack) |
| **합계** | **$5-10** (서버비) | **$50-100+** |

### 권장 시작 구성 (무료/저비용)

1. **Sentry** (무료 티어) - 에러 추적
2. **Better Stack** (무료 티어) - 업타임 + 기본 로그
3. **Railway/Render 내장 메트릭** - 기본 모니터링

→ 사용자 1000명 넘어가면 Prometheus + Grafana 도입 고려

## 참고 자료

- [Prometheus FastAPI Instrumentator](https://github.com/trallnag/prometheus-fastapi-instrumentator)
- [Sentry FastAPI 가이드](https://docs.sentry.io/platforms/python/integrations/fastapi/)
- [Grafana FastAPI Dashboard](https://grafana.com/grafana/dashboards/16110-fastapi-observability/)
- [Uptime Kuma](https://github.com/louislam/uptime-kuma)
- [Better Stack](https://betterstack.com/)
