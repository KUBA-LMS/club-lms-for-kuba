# Club LMS for KUBA

동아리 학습 관리 시스템 (Learning Management System)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React Native (Expo), TypeScript |
| Backend | FastAPI, Python 3.11+ |
| Database | PostgreSQL |
| 배포 | EAS (모바일), Railway/Render (백엔드) |

## 프로젝트 구조

```
club-lms-for-kuba/
├── frontend/          # Expo React Native 앱
├── backend/           # FastAPI 서버
└── docs/              # 개발 문서
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- PostgreSQL (로컬 개발 시)

### Frontend 설정

```bash
cd frontend
npm install
npm start
```

Expo Go 앱으로 QR 코드를 스캔하거나 시뮬레이터에서 실행.

### Backend 설정

```bash
cd backend

# 가상환경 활성화
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# 환경변수 설정
cp .env.example .env
# .env 파일 수정

# 서버 실행
uvicorn app.main:app --reload
```

API 문서: http://localhost:8000/docs

## 개발 문서

- [초기 세팅 가이드](docs/01-INITIAL-SETUP.md)
- [플랫폼별 UI 처리](docs/02-CROSS-PLATFORM-UI.md)
- [앱스토어 배포](docs/03-DEPLOYMENT.md)
- [프로젝트 구조](docs/04-PROJECT-STRUCTURE.md)
- [성능 및 스케일링](docs/05-PERFORMANCE-AND-SCALING.md)
- [프로덕션 운영](docs/06-PRODUCTION-OPERATIONS.md)

## 스크립트

### Frontend

```bash
npm start          # 개발 서버 시작
npm run android    # Android 실행
npm run ios        # iOS 실행
npm run web        # 웹 실행
```

### Backend

```bash
uvicorn app.main:app --reload          # 개발 서버
uvicorn app.main:app --host 0.0.0.0    # 프로덕션
```

## 환경 변수

### Backend (.env)

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/club_lms
SECRET_KEY=your-secret-key
DEBUG=True
```

## 라이선스

Private
