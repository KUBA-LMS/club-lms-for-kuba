# IR Deck 업그레이드 가이드 (G-Stack /office-hours 활용)

G-Stack /office-hours 스킬로 비즈니스 모델 검증 및 GTM 전략 수립 완료.
디자인 문서: ~/.gstack/projects/KUBA-LMS-club-lms-for-kuba/zs_olef.x-develop-design-20260410-174335.md

기존 5페이지 IR Deck에 아래 내용을 추가/수정하여 업그레이드된 버전을 제출.

---

## 1. 기존 1페이지 (솔루션) 수정사항

### Phase 1 "Open Square SaaS" 항목에 추가:
- "현재 MVP 개발 완료 및 TestFlight 배포 완료" 문구 추가
- 기술 스택 명시: React Native (Expo 54) + FastAPI + PostgreSQL (Supabase) + Redis

### Phase 1 "BLE 이벤트 네트워킹" 항목:
- 현재 상태: "BLE 프로토타입 설계 완료, Push Notification 구현 완료" 추가

---

## 2. 기존 3페이지 (실행 로드맵) 수정사항

### "실행 로드맵 : 5명이 Phase 1에 집중" 테이블 업데이트:

| 시점 | 마일스톤 | 상태 | 구체적 산출물 |
|------|---------|------|-------------|
| M1-3 | SaaS MVP 개발 | **완료** | React Native 앱 + FastAPI 백엔드, App Store 심사 제출 |
| M3-5 | BLE 프로토타입 | 진행중 | Push Notification 구현 완료, BLE SDK 설계 중 |
| M5-8 | 한국 시장 런칭 | 예정 | 대학 커뮤니티 온보딩 준비 중 |

---

## 3. 새로운 페이지 추가: "시제품 현황 및 AI 활용" (3페이지와 4페이지 사이에 삽입)

### 제목: "Working Product: MVP 개발 완료"

### 섹션 1: 시제품 아키텍처
```
Frontend: React Native (Expo 54) + TypeScript
Backend: FastAPI + SQLAlchemy 2.0 (async)
Database: PostgreSQL (Supabase)
Cache: Redis (Railway)
Hosting: Railway (Backend) + Vercel (Admin Web)
CI/CD: EAS Build + GitHub Auto-deploy
```

### 섹션 2: 구현 완료 기능 목록
- Club/Group 생성 및 관리 (계층형 구조: Club > Subgroup)
- Event 생성, 등록, QR 체크인 (OnePass)
- 실시간 채팅 (WebSocket + Redis Pub/Sub)
- Push Notifications (Expo Push API)
- 보증금 관리 시스템 (Deposit + Transaction history)
- Admin Hub (역할 기반 권한 관리: Lead/Admin/Member)
- QR 초대 시스템 (일반 멤버 / Admin 초대 구분)
- 친구 요청 및 관리

### 섹션 3: AI 활용 (G-Stack + Claude Code)

| 활용 영역 | 도구 | 효과 |
|----------|------|------|
| 풀스택 개발 | Claude Code | 백엔드+프론트엔드+배포 전 과정 AI 페어 프로그래밍 |
| 코드 리뷰 | G-Stack /review | 자동 코드 품질 검증 |
| 아키텍처 설계 | G-Stack /plan-eng-review | DB 스키마, API 설계, 권한 시스템 설계 |
| 비즈니스 검증 | G-Stack /office-hours | YC 스타일 비즈니스 모델 검증 |
| QA 테스트 | G-Stack /qa | UI/UX 이슈 자동 탐지 및 수정 |
| 배포 자동화 | EAS Build + Railway | GitHub push 시 자동 배포 |

### 섹션 4: 개발 생산성 비교

| 항목 | 기존 (5인 팀) | AI 활용 후 (5인 + AI) |
|------|-------------|---------------------|
| MVP 개발 기간 | 3-4개월 | 약 4주 |
| 코드 라인 수 | - | 프론트엔드 15,000+ / 백엔드 8,000+ |
| 배포 인프라 구축 | 1-2주 | 1일 |
| 버그 수정 주기 | 수일 | 수시간 |

### 섹션 5: 앱 스크린샷 (4-5장)
- 홈 화면 (지도 + 이벤트 목록 + OnePass)
- Community 화면 (그룹 목록 + QR 초대)
- 채팅 화면
- Admin Hub 화면
- OnePass / QR 체크인 화면

---

## 4. 기존 5페이지 (팀) 수정사항

### "팀 : 5명 + AI 40명분 생산성" 수정:
- 이성민 항목: "Claude Code 활용" -> "Claude Code + G-Stack 활용, MVP 단독 개발 완료"
- 박정현 항목: "Antigravity 활용" -> "Antigravity + Claude Code 활용"

### AI 활용 상세 추가 (팀 섹션 하단):
```
AI 도구 활용 현황:
- Claude Code: 풀스택 개발, 디버깅, 코드 리뷰 (일 평균 8시간 활용)
- G-Stack: 비즈니스 검증 (/office-hours), QA (/qa), 배포 (/ship)
- EAS Build: iOS 앱 빌드 자동화
- Cursor/Windsurf: 프론트엔드 UI 개발 보조
```

---

## 5. 기존 2페이지 (시장규모/수익원) 수정사항

### "목표 지표 (Y1 Target)" 업데이트:
- "목표 MAU 50K" 옆에 추가: "현재: MVP 완성, TestFlight 배포, 초기 사용자 테스트 진행 중"

---

## 요약: 수정할 페이지

| 페이지 | 수정 내용 |
|--------|---------|
| 1 (솔루션) | Phase 1 MVP 완료 표기, 기술 스택 추가 |
| 2 (시장/수익) | 현재 진행 상황 추가 |
| 3 (로드맵) | M1-3 완료 표기 |
| **NEW** (시제품) | 아키텍처, 기능, AI 활용, 생산성, 스크린샷 |
| 5 (팀) | AI 활용 상세화 |

총 6페이지 (기존 5 + 신규 1)
