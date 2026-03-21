# KUBA LMS - Club Event Management Platform

<div align="center">
<h3>KUBA 동아리 이벤트 관리 및 커뮤니티 플랫폼</h3>
<p>동아리 이벤트 생성, 티켓 발급, 실시간 채팅, 정산까지 하나의 앱에서 관리합니다</p>
</div>

<div align="center">

**개발기간**: 2025.03 ~

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)

</div>

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [주요 기능](#주요-기능)
3. [화면 구성](#화면-구성)
4. [시스템 아키텍처](#시스템-아키텍처)
5. [기술 스택](#기술-스택)
6. [데이터베이스 설계](#데이터베이스-설계)
7. [API 명세](#api-명세)
8. [설치 및 실행](#설치-및-실행)
9. [참여자](#참여자)
10. [문서](#문서)

---

## 프로젝트 개요

**KUBA LMS**는 대학교 동아리를 위한 올인원 이벤트 관리 플랫폼입니다.

이벤트 생성부터 참가 신청, 바코드 티켓 발급, 현장 체크인, 실시간 채팅, 정산까지 동아리 운영에 필요한 모든 기능을 하나의 모바일 앱과 관리자 웹 대시보드에서 제공합니다.

### 핵심 가치

- **이벤트 관리**: 이벤트 생성, 참가 신청, 선착순/선불/1/N 비용 관리
- **OnePass 티켓**: 바코드 기반 티켓 발급 및 현장 체크인
- **실시간 소통**: WebSocket 기반 채팅, 티켓 양도, 정산 요청
- **커뮤니티**: 동아리 그룹 관리, 친구 시스템, 보증금 관리
- **관리자 도구**: 멤버 관리, 출석 확인, 보증금 조정, 이벤트 편집

---

## 주요 기능

### 1. 이벤트 관리
- 지도 기반 이벤트 생성 (Naver Maps 연동)
- 비용 유형 선택 (무료 / 선불 / 1/N)
- 선불 이벤트: 은행 계좌 정보 + 24시간 결제 마감 카운트다운
- 게시 범위 설정 (전체 공개 / 친구 전용 / 특정 클럽)
- 관련 이벤트 연결
- 포스터 및 이미지 업로드

### 2. 참가 신청 및 티켓
- 이벤트 참가 신청 (상태 추적: 대기/확정/취소/체크인)
- 12자리 숫자 바코드 티켓 자동 생성
- OnePass: 보유 티켓을 한 화면에서 확인
- 바코드 스캔 기반 현장 체크인

### 3. 관리자 포털
- 클럽 멤버 관리 (역할 부여: admin, lead)
- 이벤트 생성/수정/삭제
- 참가자 목록 및 현장 체크인 관리
- Walk-in 등록
- 보증금 조정 및 거래 내역
- 하위 그룹(소모임) 관리

### 4. 실시간 채팅
- WebSocket + Redis Pub/Sub 기반 실시간 메시징
- 1:1, 그룹, 이벤트 기반 채팅
- 메시지 유형: 텍스트, 이미지, 티켓 양도, 정산 요청
- 읽음 표시 및 안읽은 메시지 카운트

### 5. 정산 시스템
- 채팅 내 정산 요청 생성
- 개인별 금액 분할
- 보증금 차감 결제
- 정산 내역 추적

### 6. 커뮤니티
- 동아리 생성 및 가입
- 하위 그룹(소모임) 구조
- 친구 요청/수락/관리
- 사용자 검색

### 7. 관리자 웹 대시보드 (Next.js)
- 이벤트 관리 대시보드
- 멤버 분석 및 통계
- 바코드 스캔 기반 체크인

---

## 화면 구성

### 인증 화면

| 로그인 | 회원가입 Step 1 | 회원가입 Step 2 | 회원가입 Step 3 | 회원가입 Step 4 | 회원가입 Step 5 |
|--------|----------------|----------------|----------------|----------------|----------------|
| 이메일/비밀번호 | 프로필 설정 | 학번 입력 | 국적 선택 | 성별 선택 | 비밀번호 설정 |

### 메인 화면 (지도 기반)

| 홈 (지도 + 이벤트 피드) | 이벤트 상세 | 이벤트 등록 |
|------------------------|------------|------------|
| Naver Maps 기반 이벤트 마커 | 이벤트 정보, 참가자 미리보기 | 참가 신청 및 결제 정보 |

- 카테고리 필터 (Official / Private)
- 클럽별 필터링
- 검색 기능
- 북마크

### OnePass 티켓

| OnePass 메인 | 바코드 표시 | 체크인 |
|-------------|------------|--------|
| 보유 티켓 캐러셀 | 12자리 숫자 바코드 | 스캔 기반 입장 확인 |

- 이벤트별 티켓 자동 선택
- 바코드 (Code 128C) 기반 체크인

### 채팅

| 채팅 목록 | 채팅방 | 정산 요청 | 티켓 양도 |
|----------|--------|----------|----------|
| 1:1, 그룹, 이벤트 채팅 | 실시간 메시지 | 금액 분할 | 바코드 티켓 전송 |

### 관리자 허브

| 멤버 관리 | 이벤트 생성 | 출석 체크 |
|----------|------------|----------|
| 역할 부여, 보증금 관리 | 지도 기반 장소 설정 | 바코드 스캔 |

- 멤버 역할 관리 (admin / lead / member)
- 보증금 잔액 조정 및 거래 이력
- 하위 그룹 생성/관리

### 커뮤니티

| 그룹 탐색 | 친구 검색 | 친구 요청 | 친구 관리 |
|----------|----------|----------|----------|
| 클럽/소모임 가입 | 사용자 검색 | 요청 수락/거절 | 친구 목록 |

### 프로필

| 프로필 | 프로필 수정 | 설정 |
|--------|-----------|------|
| 소속 클럽, 친구, 참가 이력 | 프로필 사진, 이름 | 로그아웃, 계정 관리 |

---

## 시스템 아키텍처

```
                    Mobile App (React Native / Expo 54)
                              |
                    Naver Maps API (지도)
                              |
                    +---------+---------+
                    |                   |
              REST API (HTTP)    WebSocket (WS)
                    |                   |
                    v                   v
              FastAPI Backend ---- Redis Pub/Sub
                    |
              SQLAlchemy 2.0 (Async)
                    |
              PostgreSQL 16

              Next.js Admin Dashboard
                    |
              FastAPI Backend (동일)
```

---

## 기술 스택

### Frontend (Mobile)
| 기술 | 버전 | 설명 |
|------|------|------|
| React Native | 0.81.5 | 크로스 플랫폼 모바일 앱 |
| Expo | 54 | 개발 환경 및 빌드 도구 |
| React | 19 | UI 프레임워크 |
| TypeScript | 5.9 | 정적 타입 지원 |
| Naver Maps | @mj-studio/react-native-naver-map | 지도 UI |
| React Navigation | 7.x | 화면 이동 |

### Backend
| 기술 | 버전 | 설명 |
|------|------|------|
| FastAPI | 0.128.0 | Python 비동기 웹 프레임워크 |
| SQLAlchemy | 2.0.46 | Async ORM |
| PostgreSQL | 16 | 관계형 데이터베이스 |
| Redis | 7 | Pub/Sub, 캐싱 |
| Alembic | - | DB 마이그레이션 |
| python-jose | - | JWT 인증 |

### Admin Dashboard
| 기술 | 버전 | 설명 |
|------|------|------|
| Next.js | 16.1.6 | React 프레임워크 |
| React | 19.2.3 | UI 프레임워크 |
| TailwindCSS | 4 | 유틸리티 CSS |
| Recharts | - | 데이터 시각화 |

### Infrastructure
| 기술 | 설명 |
|------|------|
| Docker Compose | PostgreSQL + Redis 컨테이너 |
| EAS Build | 모바일 앱 빌드 |
| Railway / Render | 백엔드 배포 |

---

## 데이터베이스 설계

### 주요 테이블 (14개)

| 도메인 | 테이블 | 설명 |
|--------|--------|------|
| **사용자** | User | 사용자 계정, 프로필, 은행 정보 |
| **동아리** | Club | 동아리/소모임 (계층 구조) |
| **이벤트** | Event | 이벤트 상세 (위치, 비용, 가시성) |
| **참가** | Registration | 참가 신청 (상태, 결제) |
| **티켓** | Ticket | 바코드 티켓 |
| **채팅** | Chat, ChatMember, Message | 실시간 메시징 |
| **정산** | PaymentRequest, PaymentSplit | 정산 요청/분할 |
| **보증금** | Deposit, DepositTransaction | 클럽별 보증금 잔액 |
| **북마크** | Bookmark | 이벤트 북마크 |
| **친구** | FriendRequest | 친구 요청 시스템 |

---

## API 명세

### 주요 엔드포인트 (85+)

| 카테고리 | Method | Endpoint | 설명 |
|----------|--------|----------|------|
| **인증** | POST | /auth/signup | 회원가입 |
| | POST | /auth/login | 로그인 |
| | POST | /auth/refresh | 토큰 갱신 |
| | GET | /auth/me | 내 정보 |
| **이벤트** | GET | /events/ | 이벤트 목록 (필터/검색) |
| | POST | /events/ | 이벤트 생성 (관리자) |
| | PUT | /events/{id} | 이벤트 수정 |
| | DELETE | /events/{id} | 이벤트 삭제 |
| **참가** | POST | /registrations/ | 참가 신청 |
| | POST | /registrations/{id}/cancel | 참가 취소 |
| | POST | /registrations/{id}/checkin | 체크인 |
| **티켓** | GET | /tickets/ | 내 티켓 |
| | GET | /tickets/onepass | OnePass 티켓 |
| | POST | /tickets/checkin | 바코드 체크인 |
| **채팅** | GET | /chats/ | 채팅 목록 |
| | POST | /chats/{id}/messages | 메시지 전송 |
| | POST | /chats/{id}/transfer-ticket | 티켓 양도 |
| **정산** | POST | /payments/chats/{id}/payment-request | 정산 요청 |
| | POST | /payment-splits/{id}/mark-sent | 송금 완료 |
| | POST | /payment-splits/{id}/confirm | 수금 확인 |
| **클럽** | GET | /clubs/me | 내 클럽 |
| | POST | /clubs/{id}/join | 클럽 가입 |
| **관리자** | GET | /admin/clubs/{id}/members | 멤버 목록 |
| | POST | /admin/clubs/{id}/members/{uid}/deposit | 보증금 조정 |
| **체크인** | POST | /access-control/{id}/scan | 바코드 스캔 |
| | POST | /access-control/{id}/walk-in | Walk-in 등록 |
| **업로드** | POST | /upload/image | 이미지 업로드 |
| **WebSocket** | WS | /ws | 실시간 메시징 |

> 전체 API 문서: 서버 실행 후 http://localhost:8000/docs

---

## 설치 및 실행

### 필수 요구사항

- Node.js 18+
- Python 3.11+
- Docker (PostgreSQL, Redis)
- Xcode (iOS 빌드) / Android Studio (Android 빌드)
- CocoaPods (iOS)

### 1. 인프라 실행

```bash
# PostgreSQL + Redis 컨테이너 시작
docker-compose up -d
```

### 2. Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate    # Mac/Linux

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일 수정 (DATABASE_URL, SECRET_KEY 등)

# DB 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend 설정

> **Expo Go 사용 불가**: Naver Maps SDK, Vision Camera 등 네이티브 모듈을 사용하기 때문에
> Expo Go 앱으로는 실행할 수 없습니다. 반드시 네이티브 빌드(`expo run:ios` / `expo run:android`)가 필요합니다.

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# EXPO_PUBLIC_API_URL을 로컬 IP로 설정 (예: http://192.168.0.10:8000/api/v1)
```

#### iOS 실행

```bash
# iOS 네이티브 빌드 (최초 1회 또는 네이티브 모듈 변경 시)
npx expo run:ios

# 시뮬레이터 선택 실행
npx expo run:ios --simulator "iPhone 16 Pro"

# 실제 디바이스 (USB 연결 필요)
npx expo run:ios --device
```

#### Android 실행

```bash
# Android 네이티브 빌드
npx expo run:android

# 실제 디바이스 (USB 연결 필요)
npx expo run:android --device
```

#### 이후 JS 코드만 수정할 경우

네이티브 빌드가 완료된 후에는 Metro 번들러만 띄워서 빠르게 개발할 수 있습니다:

```bash
npx expo start --dev-client
```

> **네트워크 이동 시 주의**: Wi-Fi가 바뀌면 (집 -> 학교 등) `.env`의 `EXPO_PUBLIC_API_URL` IP를
> 현재 네트워크 IP로 변경하고 Metro를 재시작해야 합니다.
> 확인: `ipconfig getifaddr en0` (Mac)

### 4. Admin Dashboard 설정

```bash
cd admin

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 환경 변수

**Backend (.env)**
```bash
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5434/club_lms
SECRET_KEY=your-secret-key
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=["http://localhost:3000","http://localhost:8081"]
```

**Frontend (.env)**
```bash
NAVER_MAP_CLIENT_ID=<Naver Map Client ID>
EXPO_PUBLIC_API_URL=http://<your-local-ip>:8000/api/v1
```

---

## 프로젝트 구조

```
club-lms-for-kuba/
├── frontend/                    # React Native 모바일 앱 (Expo 54)
│   ├── src/
│   │   ├── screens/            # 22개 화면
│   │   │   ├── main/           # 메인 화면 (Home, Profile, Chat 등)
│   │   │   └── admin/          # 관리자 화면 (Hub, CreateEvent 등)
│   │   ├── components/         # 12개 기능별 컴포넌트 그룹
│   │   │   ├── home/           # 이벤트 카드, 검색, 필터
│   │   │   ├── event/          # 이벤트 상세, 등록 모달
│   │   │   ├── chat/           # 채팅 UI, 메시지 버블
│   │   │   ├── onepass/        # 티켓 카드, 바코드
│   │   │   ├── admin/          # 관리자 폼, 바텀시트
│   │   │   ├── community/      # 커뮤니티 탭
│   │   │   ├── access-control/ # 체크인 스캐너
│   │   │   ├── icons/          # SVG 아이콘 (30+)
│   │   │   └── Map/            # Naver Maps 컴포넌트
│   │   ├── services/           # 14개 API 서비스
│   │   ├── navigation/         # React Navigation 설정
│   │   ├── types/              # TypeScript 타입 정의
│   │   ├── constants/          # 디자인 시스템 (색상, 타이포, 스페이싱)
│   │   ├── hooks/              # 커스텀 훅
│   │   └── utils/              # 유틸리티
│   └── app.json
│
├── backend/                     # FastAPI 서버
│   ├── app/
│   │   ├── api/v1/             # API 라우트 (17개 모듈)
│   │   ├── models/             # SQLAlchemy 모델 (14개 테이블)
│   │   ├── schemas/            # Pydantic 스키마
│   │   ├── services/           # 비즈니스 로직
│   │   └── core/               # 설정, DB, 인증
│   ├── alembic/                # DB 마이그레이션
│   └── requirements.txt
│
├── admin/                       # Next.js 관리자 대시보드
│   ├── src/
│   │   ├── app/                # Next.js 페이지
│   │   ├── components/         # React 컴포넌트
│   │   └── lib/                # 유틸리티
│   └── package.json
│
├── docs/                        # 개발 문서
├── docker-compose.yml           # PostgreSQL + Redis
└── README.md
```

---

## 참여자

<div align="left">
<table>
<tr>
<td align="center"><b>박정현</b></td>
<td align="center"><b>이성민</b></td>
</tr>
<tr>
<td align="center"><img src="https://avatars.githubusercontent.com/kona0107" width="140px" alt="박정현" /></td>
<td align="center"><img src="https://avatars.githubusercontent.com/danlee-dev" width="140px" alt="이성민" /></td>
</tr>
<tr>
<td align="center"><a href="https://github.com/kona0107">@kona0107</a></td>
<td align="center"><a href="https://github.com/danlee-dev">@danlee-dev</a></td>
</tr>
<tr>
<td align="center">프론트엔드</td>
<td align="center">백엔드, AI/블록체인</td>
</tr>
</table>
</div>

---

## 문서

| 문서 | 설명 |
|------|------|
| [초기 세팅 가이드](docs/01-INITIAL-SETUP.md) | 개발 환경 구축 |
| [플랫폼별 UI 처리](docs/02-CROSS-PLATFORM-UI.md) | iOS/Android 차이 대응 |
| [앱스토어 배포](docs/03-DEPLOYMENT.md) | 배포 프로세스 |
| [프로젝트 구조](docs/04-PROJECT-STRUCTURE.md) | 아키텍처 상세 |
| [외부 API 연동](docs/05-EXTERNAL-APIS.md) | 외부 서비스 통합 |
| [성능 및 스케일링](docs/05-PERFORMANCE-AND-SCALING.md) | 성능 최적화 |
| [프로덕션 운영](docs/06-PRODUCTION-OPERATIONS.md) | 운영 가이드 |
| [실기기 테스트](docs/07-PHYSICAL-DEVICE-TESTING.md) | 디바이스 테스트 |

---

## Project Tech Stack

### Environment

![Visual Studio Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

### Frontend (Mobile)

![React Native](https://img.shields.io/badge/React_Native_0.81-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo_54-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)

### Frontend (Admin Web)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logoColor=white)

### Backend

![Python](https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI_0.128-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2.0-D71F00?style=for-the-badge&logoColor=white)

### Database & Infra

![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### External APIs

![Naver Maps](https://img.shields.io/badge/Naver_Maps-03C75A?style=for-the-badge&logo=naver&logoColor=white)

---

## 라이선스

본 프로젝트는 교육 목적으로 개발되었습니다.
