# 성능 최적화 및 동시 접속 처리 가이드

## 개요

이 문서는 백엔드 성능 최적화, 동시 접속 처리, 그리고 적절한 인프라 선택에 대해 다룬다. 200명 동시 접속 수준의 서비스를 기준으로 실무에서 필요한 내용을 정리했다.

## 쿠버네티스가 필요한가?

### 결론: 200명 수준에서는 필요 없다

| 규모 | 권장 인프라 |
|------|-------------|
| ~500 동시 접속 | 단일 서버 (VPS) |
| 500~2000 | 로드밸런서 + 서버 2-3대 |
| 2000~10000 | 오토스케일링 (AWS ECS, Cloud Run 등) |
| 10000+ | 쿠버네티스 고려 |

### 쿠버네티스를 쓰면 안 되는 이유 (소규모)

- 학습 곡선이 가파름
- 운영 복잡도 증가
- 비용 증가 (최소 3대의 노드 필요)
- 200명 처리하는데 대포로 모기 잡는 격

### 권장 배포 옵션 (200명 기준)

| 옵션 | 비용 | 난이도 | 특징 |
|------|------|--------|------|
| Railway | $5~/월 | 매우 쉬움 | Git push로 배포, 자동 스케일링 |
| Render | $7~/월 | 쉬움 | 무료 티어 있음, 자동 HTTPS |
| AWS EC2 | $10~/월 | 중간 | 자유도 높음, 직접 관리 |
| Google Cloud Run | 사용량 기반 | 쉬움 | 컨테이너 기반, 자동 스케일링 |
| DigitalOcean | $6~/월 | 중간 | 심플, 가성비 좋음 |

## 동시 접속의 원리

### "200명 동시 접속"의 실제 의미

```
200명이 앱을 켜고 있음
    ↓
실제로 같은 순간에 API 호출하는 사람: 5-20명
    ↓
서버가 처리해야 하는 동시 요청: 5-20 RPS (Requests Per Second)
```

사용자들은 대부분 화면을 보거나 입력 중이므로, 동시 API 요청은 전체의 5-10% 수준이다.

### FastAPI의 처리 능력

```
FastAPI + Uvicorn (4 workers)
    ↓
단순 API: 10,000+ RPS 가능
DB 조회 포함: 1,000-3,000 RPS 가능
복잡한 로직: 500-1,000 RPS 가능
```

200명 동시 접속 = 최대 20-50 RPS → 여유롭게 처리 가능

## 병목 지점 이해

### 일반적인 병목 순서

```
1. 데이터베이스 (가장 흔함)
   - 느린 쿼리
   - 인덱스 미설정
   - 커넥션 풀 부족

2. 외부 API 호출
   - 동기 호출로 블로킹
   - 타임아웃 미설정

3. 파일 I/O
   - 이미지 처리
   - 대용량 파일 업로드

4. CPU 집약 작업
   - 복잡한 계산
   - 암호화/복호화

5. 메모리 부족
   - 대용량 데이터 로드
   - 메모리 누수
```

### 병목 확인 방법

```python
# 간단한 응답 시간 로깅
import time
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    # 느린 요청 로깅 (500ms 이상)
    if process_time > 0.5:
        print(f"SLOW: {request.url.path} took {process_time:.2f}s")

    return response
```

## FastAPI 성능 최적화

### 1. 비동기 처리 활용

```python
# 나쁜 예: 동기 DB 호출
@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = db.query(User).filter(User.id == user_id).first()  # 블로킹
    return user

# 좋은 예: 비동기 DB 호출
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await db.execute(select(User).where(User.id == user_id))
    return user.scalar_one_or_none()
```

### 2. 비동기 ORM 사용

```python
# SQLAlchemy 2.0 + asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,           # 기본 커넥션 수
    max_overflow=10,        # 추가 허용 커넥션
    pool_timeout=30,        # 커넥션 대기 타임아웃
    pool_recycle=1800,      # 커넥션 재활용 주기
)
```

### 3. 외부 API 비동기 호출

```python
# 나쁜 예: requests (동기)
import requests

def get_external_data():
    response = requests.get("https://api.example.com/data")  # 블로킹
    return response.json()

# 좋은 예: httpx (비동기)
import httpx

async def get_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        return response.json()
```

### 4. CPU 집약 작업 분리

```python
from fastapi import BackgroundTasks
from concurrent.futures import ProcessPoolExecutor
import asyncio

executor = ProcessPoolExecutor(max_workers=4)

def heavy_computation(data):
    # CPU 집약적 작업
    result = process_data(data)
    return result

@app.post("/process")
async def process_endpoint(data: dict):
    loop = asyncio.get_event_loop()
    # 별도 프로세스에서 실행
    result = await loop.run_in_executor(executor, heavy_computation, data)
    return {"result": result}
```

### 5. 응답 압축

```python
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)  # 1KB 이상 압축
```

## 데이터베이스 최적화

### 1. 인덱스 설정

```python
# SQLAlchemy 모델에서 인덱스 정의
from sqlalchemy import Column, Integer, String, Index

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)  # 단일 컬럼 인덱스
    name = Column(String)
    organization_id = Column(Integer)

    # 복합 인덱스
    __table_args__ = (
        Index('idx_org_name', 'organization_id', 'name'),
    )
```

### 인덱스가 필요한 경우

| 상황 | 인덱스 필요 |
|------|-------------|
| WHERE 절에 자주 사용 | O |
| JOIN 조건 | O |
| ORDER BY 절 | O |
| 자주 업데이트되는 컬럼 | X (오히려 느려짐) |
| 카디널리티 낮은 컬럼 (성별 등) | X |

### 2. N+1 쿼리 방지

```python
# 나쁜 예: N+1 문제
@app.get("/posts")
async def get_posts():
    posts = await db.execute(select(Post))
    results = []
    for post in posts.scalars():
        # 각 포스트마다 추가 쿼리 발생!
        author = await db.execute(select(User).where(User.id == post.author_id))
        results.append({"post": post, "author": author.scalar_one()})
    return results

# 좋은 예: JOIN으로 한 번에 조회
@app.get("/posts")
async def get_posts():
    query = select(Post, User).join(User, Post.author_id == User.id)
    results = await db.execute(query)
    return [{"post": post, "author": user} for post, user in results]

# 또는 selectinload 사용
from sqlalchemy.orm import selectinload

@app.get("/posts")
async def get_posts():
    query = select(Post).options(selectinload(Post.author))
    results = await db.execute(query)
    return results.scalars().all()
```

### 3. 페이지네이션

```python
from fastapi import Query

@app.get("/posts")
async def get_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    offset = (page - 1) * limit

    # 총 개수 (캐싱 권장)
    total = await db.scalar(select(func.count(Post.id)))

    # 데이터 조회
    query = select(Post).offset(offset).limit(limit)
    posts = await db.execute(query)

    return {
        "data": posts.scalars().all(),
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    }
```

### 4. 커넥션 풀 모니터링

```python
from sqlalchemy import event

@event.listens_for(engine.sync_engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    print(f"Connection checked out. Pool size: {engine.pool.size()}")

@event.listens_for(engine.sync_engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    print(f"Connection returned. Pool size: {engine.pool.size()}")
```

## 캐싱 전략

### 1. 인메모리 캐시 (단일 서버)

```python
from functools import lru_cache
from cachetools import TTLCache
import asyncio

# 간단한 TTL 캐시
cache = TTLCache(maxsize=1000, ttl=300)  # 5분

async def get_user_cached(user_id: int):
    cache_key = f"user:{user_id}"

    if cache_key in cache:
        return cache[cache_key]

    user = await db.execute(select(User).where(User.id == user_id))
    result = user.scalar_one_or_none()

    if result:
        cache[cache_key] = result

    return result
```

### 2. Redis 캐시 (다중 서버)

```python
import redis.asyncio as redis
import json

redis_client = redis.from_url("redis://localhost:6379")

async def get_user_cached(user_id: int):
    cache_key = f"user:{user_id}"

    # 캐시 확인
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # DB 조회
    user = await db.execute(select(User).where(User.id == user_id))
    result = user.scalar_one_or_none()

    if result:
        # 5분간 캐시
        await redis_client.setex(cache_key, 300, json.dumps(result.to_dict()))

    return result

# 캐시 무효화
async def invalidate_user_cache(user_id: int):
    await redis_client.delete(f"user:{user_id}")
```

### 캐싱 대상 선정

| 캐싱 O | 캐싱 X |
|--------|--------|
| 자주 조회되는 데이터 | 자주 변경되는 데이터 |
| 계산 비용이 높은 결과 | 사용자별 개인 데이터 |
| 변경이 적은 설정 데이터 | 실시간성이 중요한 데이터 |

## 부하 테스트

### 1. Locust 사용

```python
# locustfile.py
from locust import HttpUser, task, between

class AppUser(HttpUser):
    wait_time = between(1, 3)  # 요청 간 대기 시간

    @task(3)  # 가중치 3
    def get_posts(self):
        self.client.get("/api/posts")

    @task(1)  # 가중치 1
    def get_user_profile(self):
        self.client.get("/api/users/me")

    def on_start(self):
        # 로그인
        response = self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })
        self.token = response.json()["access_token"]
        self.client.headers = {"Authorization": f"Bearer {self.token}"}
```

```bash
# 설치
pip install locust

# 실행
locust -f locustfile.py --host=http://localhost:8000

# 웹 UI: http://localhost:8089
# 200명, 초당 10명씩 증가로 테스트
```

### 2. 테스트 시나리오

```
1. 기본 부하 테스트
   - 사용자: 100명 → 200명 → 300명
   - 관찰: 응답 시간, 에러율

2. 스파이크 테스트
   - 갑자기 500명 동시 접속
   - 관찰: 서버 복구 시간

3. 지속 부하 테스트
   - 200명으로 30분 유지
   - 관찰: 메모리 누수, 커넥션 풀 고갈
```

### 3. 성능 기준

| 지표 | 양호 | 주의 | 위험 |
|------|------|------|------|
| 응답 시간 (p95) | < 200ms | 200-500ms | > 500ms |
| 에러율 | < 0.1% | 0.1-1% | > 1% |
| CPU 사용률 | < 70% | 70-85% | > 85% |
| 메모리 사용률 | < 80% | 80-90% | > 90% |

## 모니터링

### 1. 기본 로깅 설정

```python
import logging
from fastapi import FastAPI, Request
import time

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} "
        f"status={response.status_code} "
        f"duration={process_time:.2f}ms"
    )

    return response
```

### 2. 헬스체크 엔드포인트

```python
from datetime import datetime

@app.get("/health")
async def health_check():
    # DB 연결 확인
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "database": db_status,
        }
    }
```

### 3. 메트릭 수집 (Prometheus)

```python
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Response

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(time.time() - start_time)

    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## 에러 처리 및 복구

### 1. 재시도 로직

```python
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def call_external_api():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        response.raise_for_status()
        return response.json()
```

### 2. Circuit Breaker

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=30)
async def call_external_service():
    # 5번 실패하면 30초간 차단
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get("https://api.example.com/data")
        return response.json()
```

### 3. Graceful Degradation

```python
async def get_user_with_fallback(user_id: int):
    try:
        # 캐시에서 조회
        cached = await redis_client.get(f"user:{user_id}")
        if cached:
            return json.loads(cached)
    except redis.RedisError:
        # Redis 장애 시 무시하고 계속
        pass

    try:
        # DB에서 조회
        user = await db.execute(select(User).where(User.id == user_id))
        return user.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Failed to get user {user_id}: {e}")
        # 최소한의 정보라도 반환
        return {"id": user_id, "status": "unavailable"}
```

## 배포 설정

### 1. Uvicorn 프로덕션 설정

```bash
# 개발
uvicorn main:app --reload

# 프로덕션
uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --loop uvloop \
    --http httptools \
    --no-access-log
```

### 2. Gunicorn + Uvicorn (권장)

```python
# gunicorn.conf.py
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 100
```

```bash
gunicorn main:app -c gunicorn.conf.py
```

### 3. Docker 설정

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

# 비root 사용자
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# 실행
CMD ["gunicorn", "main:app", "-c", "gunicorn.conf.py"]
```

### 4. docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/dbname
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=dbname
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## 체크리스트

### 개발 단계

- [ ] 비동기 ORM 사용 (SQLAlchemy 2.0 + asyncpg)
- [ ] 외부 API 호출 비동기화
- [ ] N+1 쿼리 확인 및 수정
- [ ] 적절한 인덱스 설정
- [ ] 페이지네이션 구현

### 배포 전

- [ ] 부하 테스트 실행 (Locust)
- [ ] 응답 시간 기준 충족 확인
- [ ] 헬스체크 엔드포인트 구현
- [ ] 로깅 설정
- [ ] 에러 처리 및 재시도 로직

### 배포 후

- [ ] 모니터링 대시보드 설정
- [ ] 알림 설정 (에러율, 응답시간)
- [ ] 정기적인 부하 테스트

## 요약

| 규모 | 해야 할 것 | 안 해도 되는 것 |
|------|------------|-----------------|
| 200명 | 비동기 처리, 인덱스, 기본 캐싱 | 쿠버네티스, 마이크로서비스 |
| 1000명 | 로드밸런서, Redis 캐시 | 복잡한 오케스트레이션 |
| 5000명+ | 오토스케일링, CDN | - |

## 참고 자료

- [FastAPI 공식 문서 - Performance](https://fastapi.tiangolo.com/deployment/)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Locust 부하 테스트](https://locust.io/)
- [The Twelve-Factor App](https://12factor.net/ko/)
