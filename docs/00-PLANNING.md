# Club LMS 앱 기획안

## 1. 프로젝트 개요

### 1.1 앱 소개
Club LMS는 대학 동아리(KUBA) 활동을 위한 통합 관리 플랫폼이다. 이벤트 등록, 티켓 관리, 커뮤니티 기능을 제공한다.

### 1.2 주요 타겟
- 고려대학교 경영대학 학술동아리 KUBA 회원
- 동아리 운영진 및 일반 회원

### 1.3 기술 스택
- Frontend: React Native (Expo)
- Backend: Python (FastAPI)
- Database: PostgreSQL
- 인증: JWT 기반

---

## 2. 전체 화면 목록 (Figma 기준)

### 2.1 인증 플로우 (Auth Flow)

#### 2.1.1 Splash Screen
- **화면명**: `splash`
- **구성 요소**:
  - CLUB.LMS 로고 (Porter Sans Block 폰트, 70px)
  - "For:" 텍스트
  - KUBA 로고 이미지
  - 로딩 인디케이터 (3개의 원형 애니메이션)
- **동작**:
  - 앱 시작 시 표시
  - 자동 로그인 체크
  - 2초 후 또는 로딩 완료 시 Login/Home으로 이동

#### 2.1.2 Login 화면들

**Login(start)**
- **화면명**: `Login(start)`
- **구성 요소**:
  - CLUB.LMS 로고 (상단)
  - "WELCOME." 제목 (Open Sans Bold, 30px)
  - "New User? Sign up now" 링크 (Sign up now는 파란색 #00c0e8, 밑줄)
  - ID/Email 입력 필드 (border-radius: 10px, border: 1px solid #c5c5c5)
  - Password 입력 필드 (Eye off 아이콘 포함)
  - "forgot password?" 링크 (주황색 #ff8d28)
  - "Sign in" 버튼 (검정 배경, 흰색 텍스트, border-radius: 10px)
  - iOS 키보드

**Login(Entering ID)**
- **화면명**: `Login(Entering ID)`
- **상태**: ID 입력 중
- **차이점**: ID 필드 라벨이 상단으로 이동 (floating label 패턴)

**Login(Entering PW)**
- **화면명**: `Login(Entering PW)`
- **상태**: 비밀번호 입력 중
- **구성 요소**:
  - ID 필드: 입력 완료 상태 (예: "abc012345")
  - Password 필드: 마스킹된 비밀번호 표시 ("............")
  - Eye off 아이콘 (비밀번호 숨김 상태)

**Login(Show PW)**
- **화면명**: `Login(Show PW)`
- **상태**: 비밀번호 표시 중
- **차이점**: Eye 아이콘으로 변경, 비밀번호 평문 표시 (예: "aaaaaaaaaaaaa")

---

### 2.2 회원가입 플로우 (Sign Up Flow)

#### 2.2.1 Sign Up Step 1/5 - 프로필 설정

**Sign Up - 1(start)**
- **화면명**: `Sign Up - 1(start)`
- **구성 요소**:
  - 상단 네비게이션: 뒤로가기(arrow_back), "Create Account 1/5", 처음부터(start over) 아이콘
  - Progress Bar (20% 완료, 50px 너비)
  - CLUB.LMS 로고 (30px 크기)
  - "Set up your profile." 제목
  - "Help? Read user guide" 링크 (Read user guide는 주황색 #ff8d28)
  - Enter Username 입력 필드
  - Enter Legal Name(Full name) 입력 필드
  - Next 버튼 (비활성화 상태, 회색 #aeaeb2)

**Sign Up - 1(Entering Username)**
- **화면명**: `Sign Up - 1(Entering Username)`
- **상태**: Username 입력 완료
- **구성 요소**:
  - Username 필드: 입력 완료 + 체크 아이콘 (유효성 검증 통과)
  - 예시 값: "hongildong02"

**Sign Up - 1(Entering legal name)**
- **화면명**: `Sign Up - 1(Entering legal name)`
- **상태**: 전체 이름 입력 중
- **구성 요소**:
  - Legal Name 필드: "HONG GIL DONG" 입력 중
  - Next 버튼 활성화

#### 2.2.2 Sign Up Step 2/5 - 프로필 사진

**Sign Up - 2(start) [프로필 사진]**
- **화면명**: `Sign Up - 2(start)`
- **구성 요소**:
  - Progress Bar (40% 완료, 100px 너비)
  - "Set profile picture." 제목
  - 원형 프로필 영역 (170x170px)
  - User 아이콘 (기본 이미지)
  - "upload picture" 텍스트 + Arrow up-circle 아이콘
  - Skip 버튼 (왼쪽)
  - Next 버튼 (오른쪽)

**Sign Up - 2(uploading profile picture)**
- **화면명**: `Sign Up - 2(uploading profile picture)`
- **상태**: 사진 선택/크롭 중
- **구성 요소**:
  - 300x300px 이미지 영역
  - Back 버튼 (왼쪽)
  - Done 버튼 (오른쪽)

**Sign Up - 2(complete)**
- **화면명**: `Sign Up - 2(complete)`
- **상태**: 프로필 사진 설정 완료
- **구성 요소**:
  - 업로드된 프로필 사진 (250x250px 원형)
  - Edit 버튼 (Edit 3 아이콘 + "Edit" 텍스트)
  - Skip/Next 버튼

#### 2.2.3 Sign Up Step 3/5 - 기본 정보

**Sign Up - 2(start) [기본 정보]**
- **화면명**: `Sign Up - 2(start)` (3/5)
- **구성 요소**:
  - Progress Bar (60% 완료, 150px 너비)
  - "Fill out basic info" 제목
  - Enter student ID(KU) 입력 필드
  - Select Nationality 선택 필드
  - Select Gender 선택 필드
  - Next 버튼

**Sign Up - 2(Entering student ID)**
- **화면명**: `Sign Up - 2(Entering student ID)`
- **상태**: 학번 입력 중
- **구성 요소**:
  - Student ID 필드: "2026000000" 입력 완료
  - 키보드 표시

**Sign Up - 2(Selecting nationality)**
- **화면명**: `Sign Up - 2(Selecting nationality)`
- **상태**: 국적 선택 중
- **구성 요소**:
  - 하단 시트 (Bottom Sheet)
  - 국적 목록: Singapore, South Korea (선택됨, 밑줄), United States 등
  - Done 버튼

**Sign Up - 2(Selecting Gender)**
- **화면명**: `Sign Up - 2(Selecting Gender)`
- **상태**: 성별 선택 중
- **구성 요소**:
  - 하단 시트
  - 성별 목록: Male (선택됨), Female
  - Done 버튼

**Sign Up - 2(Complete)**
- **화면명**: `Sign Up - 2(Complete)`
- **상태**: 기본 정보 입력 완료
- **구성 요소**:
  - Student ID: 2026000000
  - Nationality: South Korea
  - Gender: Male
  - Next 버튼 활성화

#### 2.2.4 Sign Up Step 4/5 - 비밀번호 설정

**Sign Up - 4(start)**
- **화면명**: `Sign Up - 4(start)`
- **구성 요소**:
  - Progress Bar (80% 완료, 200px 너비)
  - "Set up your password." 제목
  - Enter Password 입력 필드
  - Confirm Password 입력 필드
  - 안내 문구: "Must be at least 8 characters long with a mix of letters, numbers, and symbols."
  - Next 버튼

**Sign Up - 4(password generation error)**
- **화면명**: `Sign Up - 4(password generation error)`
- **상태**: 비밀번호 규칙 미충족
- **구성 요소**:
  - Password 필드: "xyz123" + X 아이콘 (빨간색)
  - Confirm Password 필드: 빈 상태

**Sign Up - 4(password confirmation error)**
- **화면명**: `Sign Up - 4(password confirmation error)`
- **상태**: 비밀번호 불일치
- **구성 요소**:
  - Password 필드: "xyz12345!" + Check 아이콘 (초록색)
  - Confirm Password 필드: "xyz12345x" + X 아이콘 (빨간색)
  - 에러 메시지: "Passwords do not match."

**Sign Up - 4(complete)**
- **화면명**: `Sign Up - 4(complete)`
- **상태**: 비밀번호 설정 완료
- **구성 요소**:
  - 두 필드 모두 Check 아이콘 표시
  - Next 버튼 활성화

#### 2.2.5 Sign Up Step 5/5 - 약관 동의

**Sign Up - 4(start) [약관]**
- **화면명**: `Sign Up - 4(start)` (5/5)
- **구성 요소**:
  - Progress Bar (100% 완료, 250px 너비)
  - "Agree to terms of use." 제목
  - [Required] View Terms of Service 체크박스
  - [Required] View Privacy Policy 체크박스
  - "Agree to all" 버튼
  - "Complete Sign up" 버튼

**Sign Up - 4(Complete) [약관]**
- **화면명**: `Sign Up - 4(Complete)`
- **상태**: 약관 동의 완료
- **구성 요소**:
  - 모든 체크박스 선택됨
  - "Complete Sign up" 버튼 활성화 (초록색)

---

### 2.3 메인 화면들 (Main Screens)

#### 2.3.1 Home 화면

**Home-1**
- **화면명**: `Home-1`
- **구성 요소**:
  - CLUB.LMS 로고 (상단 중앙)
  - Segmented Control: "Upcoming" (선택됨) / "Past Events"
  - 이벤트 카드 목록 (세로 스크롤)

**이벤트 카드 구조**:
```
- 이벤트 제목 (Inter Bold, 20px)
- 날짜 (Inter Regular, 15px, 우측 정렬)
- 이벤트 이미지 (402x227px)
- 배지들:
  - Official 배지 (검정 배경, 흰색 텍스트)
  - 타입 배지: Free (초록 #34c759) / Prepaid (보라 #cb30e0) / 1/N
- Page Control (이미지 슬라이더 인디케이터)
- 참여 친구 목록 (프로필 아이콘 4개 + "justin1, troy2, nic3... +1 friends participating")
- 등록 상태 바:
  - Registration Open (초록 배경)
  - Registered (검정 배경 + 체크 아이콘)
  - Registration Closed (주황 배경)
- Share 아이콘
- info(i) 아이콘
- Provided by: (제공자 로고)
- Bookmark 아이콘
```

**Home-2(scroll), Home-3(scroll2), Home-4(scroll4)**
- 스크롤 상태에 따른 다양한 이벤트 카드 표시
- Private 배지 (회색 배경)
- 1/N 배지 (보라색 배경)

**하단 네비게이션 바**:
```
- Compass 아이콘 (Home, 선택 시 검정 원형 배경)
- Search 아이콘
- ONE PASS 로고 (숫자 1 + "ONE PASS" 텍스트)
- groups 아이콘 (Community)
- MY 아이콘 (3개의 겹친 카드 형태, 그라데이션 색상)
```

#### 2.3.2 Search 화면

**Search - 1(start)**
- **화면명**: `Search - 1(start)`
- **구성 요소**:
  - Search 아이콘 (선택됨, 원형 배경)
  - 이벤트 목록 (Home과 동일한 카드 구조)
  - 검색 입력 필드 (상단)

---

### 2.4 ONE PASS 화면들 (Ticket System)

#### 2.4.1 ONE PASS(Default-before scan)
- **화면명**: `ONE PASS(Default-before scan)`
- **구성 요소**:
  - ONE PASS 로고 (상단 중앙)
  - 프로필 이미지 (40x40px 원형)
  - 사용자 이름: "GIL DONG, HONG"
  - 타이머: "2:00" + Refresh 아이콘
  - 바코드 영역 (340x80px, 수직 선들로 구성)
  - 바코드 번호: "2 4 6 5 7 4 3 4 6 7 7"
  - 티켓 카드 영역:
    - "AUTO SELECTION" 텍스트
    - "SLIDE DOWN TO VIEW TICKETS" 안내
    - ">>>" 화살표 아이콘
  - 하단: "SCAN BARCODE FIRST" (강조 텍스트)
  - 하단 네비게이션 바 (ONE PASS 선택됨)

#### 2.4.2 ONE PASS(Viewing ticket)
- **화면명**: `ONE PASS(Viewing ticket)`
- **상태**: 특정 티켓 선택됨
- **구성 요소**:
  - 선택된 이벤트 티켓 카드 (메인)
  - 좌우 다른 티켓 카드 (부분 표시)
  - 하단 정보:
    - 이벤트 제목: "KUBA 45th Cheering Orientation"
    - Ticket Description
    - "Details >" 링크
  - "SCAN BARCODE FIRST" / "AUTO SELECTION" 토글

#### 2.4.3 ONE PASS(after check-in)
- **상태**: 체크인 완료
- **구성 요소**:
  - "Check-in Complete" 텍스트 (초록색 체크 아이콘)

#### 2.4.4 ONE PASS(viewing other ticket)
- **상태**: 다른 티켓 보기
- **구성 요소**: Viewing ticket과 유사, 다른 이벤트 정보

#### 2.4.5 ONE PASS(scan failed)
- **상태**: 스캔 실패
- **구성 요소**:
  - "Verification failed. Please try again." 메시지

#### 2.4.6 ONE PASS(Light-mode)
- **상태**: 라이트 모드
- **구성 요소**: 흰색 배경, 검정 바코드

---

### 2.5 이벤트 상세 화면들 (Event Detail)

#### 2.5.1 Free Registration 화면들

**free registration-1(start)**
- **화면명**: `free registration-1(start)`
- **구성 요소**:
  - 상단 네비게이션: 뒤로가기, "User's Univ." 드롭다운, 더보기/공유/북마크 아이콘
  - Official 배지
  - 이벤트 포스터 이미지
  - "Register" 버튼
  - 이벤트 정보:
    - 이벤트 제목: "KUBA 45th Cheering Orientation"
    - 날짜: "Aug 31, 2025"
    - EVENT TYPE: Free Registration
    - COST TYPE: Free
    - REGISTRATION PERIOD: 시작일 ~ 종료일
    - AVAILABLE SLOTS: 잔여/전체
    - PROVIDED BY: (프로필 아이콘 + 이름)
    - POSTED BY: (프로필 아이콘 + 이름)
    - POSTED ON: 게시 날짜
    - DESCRIPTION: 이벤트 설명

**free registration-2(requesting)**
- **상태**: 등록 요청 중
- **구성 요소**:
  - "Registration Requested" 버튼 상태 변경

**free registration-3(confirming cancellation)**
- **상태**: 취소 확인 모달
- **구성 요소**:
  - 모달: "Confirm cancellation!"
  - "Please be aware that any payments associated with this event will be refunded."
  - Exit/Cancel 버튼

**free registration-4(registration completed)**
- **상태**: 등록 완료
- **구성 요소**:
  - "Registration Completed" 버튼 (체크 아이콘)

**free registration-5(cancelled)**
- **상태**: 등록 취소됨
- **구성 요소**:
  - "Register" 버튼으로 복귀

**free registration-6(registration closed after event updated)**
- **상태**: 등록 마감 (이벤트 업데이트 후)
- **구성 요소**:
  - "This post has been updated" 알림 배지
  - "Register" 버튼 (비활성화)

#### 2.5.2 Prepaid Registration 화면들

**prepaid registration-1(start)**
- **화면명**: `prepaid registration-1(start)`
- **구성 요소**:
  - Prepaid 배지 (보라색)
  - EVENT TYPE: Prepaid Event
  - COST TYPE: Paid (금액 표시)
  - "Register" 버튼

**prepaid registration-2(requesting)**
- **상태**: 등록 요청 중
- **구성 요소**:
  - "Non-refundable prepaid event!" 모달
  - "Otherwise, your deposit will be deducted and cannot be refunded."
  - Exit/Proceed 버튼

**prepaid registration-3(registration requested)**
- **상태**: 등록 요청됨
- **구성 요소**:
  - "Registration Requested" 상태
  - "Waiting Payment" 표시 (결제 대기)

**prepaid registration-4(registration completed)**
- **상태**: 등록 완료
- **구성 요소**:
  - "Registration Completed" 버튼 (체크 아이콘)

**prepaid registration-5(cancelling-confirming cancellation)**
- **상태**: 취소 확인 모달
- **구성 요소**:
  - "Confirm cancellation!"
  - "Please be aware that any payments associated with this event will be refunded."
  - Exit/Cancel 버튼

**prepaid registration-6(slots full)**
- **상태**: 마감
- **구성 요소**:
  - "Slots full" 버튼 (비활성화)

**prepaid registration-7(registration cancelled)**
- **상태**: 등록 취소됨
- **구성 요소**:
  - "Registration Completed" 상태 (취소 후)

**prepaid registration-8(post updated)**
- **상태**: 게시물 업데이트됨
- **구성 요소**:
  - 업데이트 알림 배지

#### 2.5.3 1/N Registration 화면들

**1/n registration-1(start)**
- **화면명**: `1/n registration-1(start)`
- **구성 요소**:
  - 1/N 배지 (보라색)
  - EVENT TYPE: 1/N Event
  - COST TYPE: Paid (1/N)
  - "Register" 버튼

**1/n registration-2(requesting)**
- **상태**: 등록 요청 중
- **구성 요소**:
  - "1/N event!" 모달
  - "Final cost will be finalized and split once the event ends."
  - Exit/Proceed 버튼

**1/n registration-3(registration requested)**
- **상태**: 등록 요청됨
- **구성 요소**:
  - "Registration Requested" 상태
  - "Waiting Period for 1/N (Max) Allow" 표시

**1/n registration-4(registration completed)**
- **상태**: 등록 완료
- **구성 요소**:
  - "Registration Completed" 버튼 (체크 아이콘)

**1/n registration-5(confirming cancellation)**
- **상태**: 취소 확인 모달
- **구성 요소**:
  - "Confirm cancellation!"
  - "Please be aware that any payments associated with this event will be refunded."
  - Exit/Cancel 버튼

---

### 2.6 Community 화면들

#### 2.6.1 Chats 화면

**Chats-1(start)**
- **화면명**: `Chats-1(start)`
- **구성 요소**:
  - "COMMUNITY" 헤더 + 설정 아이콘
  - 탭: Chats (선택됨) / Add Friends / Join Groups
  - 동아리 배지 목록 (가로 스크롤): KUBA 등
  - 채팅 목록:
    - 프로필 이미지
    - 이름: "minju5"
    - 최근 메시지 미리보기: "1/N Request: 10,000KRW"
    - 날짜: "Sep 20"
    - 지연 배지: "치연" (빨간 원형)

**Chats-2(select)**
- **상태**: 채팅 선택됨
- **구성 요소**:
  - 선택된 채팅 강조 표시
  - 채팅 상세 정보 표시

**Chats-3(select specific chat)**
- **상태**: 특정 그룹 채팅 선택
- **구성 요소**:
  - 그룹 채팅 정보: "KUBA Group 8"
  - 그룹 설명: "Korea University Cheer..."
  - 뒤로가기 화살표

#### 2.6.2 Create Group Chat 화면

**Create Group Chat-1(start)**
- **화면명**: `Create Group Chat-1(start)`
- **구성 요소**:
  - 뒤로가기 화살표
  - "Create Group Chat." 제목
  - Enter Group Chat Name 입력 필드
  - Enter Username 검색 필드 (돋보기 아이콘)
  - 사용자 목록:
    - 프로필 이미지
    - 이름: "eric6"
    - "Groups in common:" + 동아리 배지
    - 선택 체크박스 (원형)
  - "Create" 버튼 (비활성화)

**Create Group Chat-2(entering name)**
- **상태**: 그룹 이름 입력 중
- **구성 요소**:
  - 그룹 이름: "KUBA Group 8" 입력됨
  - 키보드 표시

**Create Group Chat-3(selecting members)**
- **상태**: 멤버 선택 중
- **구성 요소**:
  - 선택된 멤버에 파란색 체크 표시
  - "Create" 버튼 (비활성화, 아직 조건 미충족)

**Create Group Chat-4(complete)**
- **상태**: 생성 가능
- **구성 요소**:
  - 그룹 이름 입력됨
  - 2명 이상 멤버 선택됨
  - "Create" 버튼 활성화 (초록색)

#### 2.6.3 Add Friends 화면

**Add Friends 화면들**
- 사용자 검색
- 검색 결과 목록
- 친구 추가 버튼

#### 2.6.4 Join Groups 화면들

**Join Groups-1(start) ~ Join Groups-8(choose photo)**
- 그룹 목록 표시
- 그룹 상세 정보
- 그룹 가입 요청
- 프로필 사진 선택

---

### 2.7 AdminHub 화면들 (관리자)

#### 2.7.1 AdminHub event list

**AdminHub event list-1(start)**
- **화면명**: `AdminHub event list-1(start)`
- **구성 요소**:
  - 관리자 전용 이벤트 목록
  - 이벤트 관리 옵션

**AdminHub event list-2(see past)**
- **상태**: 지난 이벤트 보기

**AdminHub event list-2(searching)**
- **상태**: 이벤트 검색 중

**AdminHub event list-3(approved and pending)**
- **상태**: 승인됨/대기중 필터

#### 2.7.2 Add Event (Admin 이벤트 생성)

**Add Event-1(start)**
- **화면명**: `Add Event-1(start)`
- **접근 권한**: Admin 전용
- **구성 요소**:
  - 상단 네비게이션: 뒤로가기, Plus 아이콘 (main 라벨)
  - 지도 배경 (Map API)
  - 포스터/티켓 업로드 영역 (250x324px)
    - "Upload Poster(Ticket)" 텍스트
    - Arrow up-circle 아이콘
  - 입력 필드들:
    - Enter Event Name
    - Enter Event Date
    - Enter Event Location (검색 아이콘)
    - Select Event Type
    - Select Cost Type
    - Set Registration Period
    - Enter Number of Spots
    - Link Related Events
  - Admin 배지 "A" (하단 우측)

**Add Event-2(Entering Event Name)**
- **화면명**: `Add Event-2(Entering Event Name)`
- **상태**: 이벤트 이름 입력 중
- **구성 요소**:
  - Event Name 필드: "KUBA 45th Orientation After Party" 입력됨
  - Floating label 패턴 적용

**Add Event-3(Entering Event Date)**
- **화면명**: `Add Event-3(Entering Event Date)`
- **상태**: 날짜 선택 중
- **구성 요소**:
  - 하단 시트 (Bottom Sheet)
  - 달력 컴포넌트
  - Done 버튼

**Add Event-5(Selecting Event Type)**
- **화면명**: `Add Event-5(Selecting Event Type)`
- **상태**: 이벤트 타입 선택 중
- **구성 요소**:
  - 하단 시트
  - 타입 목록:
    - Official (선택 시 강조)
    - Private
  - Done 버튼

**Add Event-6(Selecting Cost Type)**
- **화면명**: `Add Event-6(Selecting Cost Type)`
- **상태**: 비용 타입 선택 중
- **구성 요소**:
  - 하단 시트
  - 타입 목록:
    - Free
    - Prepaid
    - 1/N
  - Enter Price 필드 (Prepaid/1/N 선택 시 표시)
  - Done 버튼

**Add Event-7(Entering Price)**
- **화면명**: `Add Event-7(Entering Price)`
- **상태**: 가격 입력 중
- **구성 요소**:
  - Price 필드: "15,000" 입력됨
  - 통화 표시: "KRW"

**Add Event-8(Setting Registration Period)**
- **화면명**: `Add Event-8(Setting Registration Period)`
- **상태**: 등록 기간 설정 중
- **구성 요소**:
  - 하단 시트
  - Starts: 날짜/시간 선택기
  - Ends: 날짜/시간 선택기
  - Done 버튼

**Add Event-10(Enter Number of Slots)**
- **화면명**: `Add Event-10(Enter Number of Slots)`
- **상태**: 정원 입력
- **구성 요소**:
  - Number of Spots 필드: "30" 입력됨
  - Add Description 필드
  - Select Provider 필드
  - Link Related Events 필드
  - "Post" 버튼

**Add Event-11(Link Related Events)**
- **화면명**: `Add Event-11(Link Related Events)`
- **상태**: 연관 이벤트 검색 중
- **구성 요소**:
  - 검색 필드: "Cheering" 입력됨
  - 검색 결과: "KUBA 45th Cheering Orientation After Party"
  - Link 아이콘

**Add Event-14(Select group Provider)**
- **화면명**: `Add Event-14(Select group Provider)`
- **상태**: 그룹 제공자 선택 중
- **구성 요소**:
  - 하단 시트
  - 그룹 목록:
    - 45th_KUBA (체크 표시)
    - 45th_KUBA_Group_8 (하위 그룹)
  - View Subgroups 확장 옵션
  - Done 버튼

**Add Event-15(Select indi Provider)**
- **화면명**: `Add Event-15(Select indi Provider)`
- **상태**: 개인 제공자 선택 중
- **구성 요소**:
  - 하단 시트
  - 사용자 목록:
    - eric6 (프로필 + Groups in common)
    - jiwoo7 (프로필 + Groups in common)
  - 체크박스 선택
  - Done 버튼

**Add Event-18(Complete)**
- **화면명**: `Add Event-18(Complete)`
- **상태**: 이벤트 생성 완료
- **구성 요소**:
  - 모든 필드 입력 완료
  - 포스터 이미지 업로드됨
  - "Post" 버튼 활성화

---

#### 2.7.3 Admin Friends Management

**search friends-1(start)**
- **화면명**: `search friends-1(start)`
- **접근 권한**: Admin 전용
- **구성 요소**:
  - 상단 네비게이션: 뒤로가기, "Search Friends" 제목
  - 검색 입력 필드 (돋보기 아이콘)
  - 친구 목록 (빈 상태 또는 전체 목록)

**search friends-2(result)**
- **화면명**: `search friends-2(result)`
- **상태**: 검색 결과 표시
- **구성 요소**:
  - 검색어 입력된 상태
  - 검색 결과 목록:
    - 프로필 이미지
    - 사용자 이름
    - 학번/소속 정보
  - 선택 체크박스

**Manage Friends-1(start)**
- **화면명**: `Manage Friends-1(start)`
- **접근 권한**: Admin 전용
- **구성 요소**:
  - 상단 네비게이션: 뒤로가기, "Manage Friends" 제목
  - 친구 목록:
    - 프로필 이미지
    - 사용자 이름
    - 역할 배지 (Admin "A" / Member)
  - 삭제 버튼 (각 항목)

**Manage Friends-2(delete)**
- **화면명**: `Manage Friends-2(delete)`
- **상태**: 삭제 대상 선택됨
- **구성 요소**:
  - 선택된 친구 강조 표시
  - 삭제 확인 모달 준비

**Manage Friends-3(confirm)**
- **화면명**: `Manage Friends-3(confirm)`
- **상태**: 삭제 확인 모달
- **구성 요소**:
  - "Confirm deletion" 모달
  - "Are you sure you want to remove this friend?"
  - Cancel/Confirm 버튼

**Manage Friends-4(complete)**
- **화면명**: `Manage Friends-4(complete)`
- **상태**: 삭제 완료
- **구성 요소**:
  - "Friend removed" 토스트 메시지
  - 업데이트된 친구 목록

#### 2.7.3 Admin Home 화면

**Home (Admin View)**
- **화면명**: `Home-1` (Admin 버전)
- **차이점**:
  - 사용자 이름 옆 Admin 배지 "A" 표시
  - AdminHub 탭 접근 가능
  - 이벤트 카드에 관리 옵션 표시
- **구성 요소**:
  - 기존 Home 화면과 동일
  - 하단 네비게이션에 AdminHub 탭 추가 (Admin만 표시)

---

### 2.8 Admin 권한 구분

#### 2.8.1 Admin 전용 기능
- 이벤트 생성/수정/삭제
- 이벤트 등록자 관리
- 체크인 스캔
- 친구 관리 (삭제 권한)
- AdminHub 접근

#### 2.8.2 일반 사용자 기능
- 이벤트 조회/등록
- ONE PASS 티켓 사용
- 채팅 참여
- 친구 추가 (삭제 불가)

---

## 3. 컴포넌트 상세

### 3.1 공통 컴포넌트

#### 3.1.1 Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'disabled';
  size: 'large' | 'medium' | 'small';
  label: string;
  icon?: ReactNode;
  onPress: () => void;
}
```
- **Primary**: 검정 배경, 흰색 텍스트, border-radius: 10px
- **Secondary**: 투명 배경, 검정 테두리
- **Disabled**: 회색 배경 (#aeaeb2)

#### 3.1.2 Input Field
```typescript
interface InputFieldProps {
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'email';
  value: string;
  error?: string;
  showPassword?: boolean;
  onChangeText: (text: string) => void;
}
```
- Border: 1px solid #c5c5c5
- Border Radius: 10px
- Height: 42px
- Floating Label 패턴

#### 3.1.3 Badge
```typescript
interface BadgeProps {
  type: 'official' | 'private' | 'free' | 'prepaid' | 'one_n';
  size: 'small' | 'medium';
}
```
- **Official**: 검정 배경
- **Private**: 회색 배경
- **Free**: 초록 배경 (#34c759)
- **Prepaid**: 보라 배경 (#cb30e0)
- **1/N**: 보라 배경 (#cb30e0)

#### 3.1.4 Event Card
```typescript
interface EventCardProps {
  id: string;
  title: string;
  date: string;
  images: string[];
  badges: Badge[];
  registrationStatus: 'open' | 'closed' | 'registered';
  providedBy: User;
  friends: User[];
  onPress: () => void;
  onBookmark: () => void;
  onShare: () => void;
}
```

#### 3.1.5 Progress Bar
```typescript
interface ProgressBarProps {
  progress: number; // 0-100
  width: number;
}
```
- 배경: #e6dfd4
- 활성: 그라데이션 (주황-빨강)
- Border Radius: 8.333px

#### 3.1.6 Bottom Sheet
```typescript
interface BottomSheetProps {
  visible: boolean;
  options: Option[];
  onSelect: (option: Option) => void;
  onClose: () => void;
}
```

#### 3.1.7 Modal
```typescript
interface ModalProps {
  visible: boolean;
  title: string;
  message: string;
  primaryButton: { label: string; onPress: () => void };
  secondaryButton?: { label: string; onPress: () => void };
}
```

### 3.2 Navigation Components

#### 3.2.1 Tab Bar
```typescript
const tabs = [
  { id: 'home', icon: 'Compass', label: 'Home' },
  { id: 'search', icon: 'Search', label: 'Search' },
  { id: 'onepass', icon: 'OnePass', label: 'ONE PASS' },
  { id: 'community', icon: 'groups', label: 'Community' },
  { id: 'mypage', icon: 'MY', label: 'My Page' },
];
```

#### 3.2.2 Segmented Control
```typescript
interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}
```
- Apple HIG 준수
- 선택된 세그먼트: 흰색 배경, 그림자

---

## 4. 데이터 모델

### 4.1 User
```typescript
interface User {
  id: string;
  username: string;
  legalName: string;
  studentId: string;
  email?: string;
  profileImage?: string;
  nationality: string;
  gender: 'male' | 'female' | 'other';
  clubs: Club[];
  role: 'member' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Club
```typescript
interface Club {
  id: string;
  name: string;
  description: string;
  logoImage: string;
  university: string;
  members: User[];
  createdAt: Date;
}
```

### 4.3 Event
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  images: string[];
  eventType: 'official' | 'private';
  costType: 'free' | 'prepaid' | 'one_n';
  costAmount?: number;
  registrationStart: Date;
  registrationEnd: Date;
  eventDate: Date;
  maxSlots: number;
  currentSlots: number;
  providedBy: User;
  postedBy: User;
  club: Club;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.4 Registration
```typescript
interface Registration {
  id: string;
  user: User;
  event: Event;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  paymentStatus: 'pending' | 'completed' | 'refunded';
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.5 Ticket
```typescript
interface Ticket {
  id: string;
  registration: Registration;
  barcode: string;
  isUsed: boolean;
  usedAt?: Date;
}
```

### 4.6 Chat
```typescript
interface Chat {
  id: string;
  type: 'direct' | 'group' | 'event';
  name?: string;
  event?: Event;
  members: ChatMember[];
  createdAt: Date;
}

interface ChatMember {
  user: User;
  joinedAt: Date;
  lastReadAt: Date;
}
```

### 4.7 Message
```typescript
interface Message {
  id: string;
  chat: Chat;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'ticket' | 'payment_request';
  metadata?: {
    ticketId?: string;
    amount?: number;
  };
  createdAt: Date;
}
```

---

## 5. API 엔드포인트

### 5.1 인증
```
POST   /auth/signup              - 회원가입
POST   /auth/login               - 로그인
POST   /auth/logout              - 로그아웃
POST   /auth/refresh             - 토큰 갱신
GET    /auth/profile             - 내 정보 조회
PUT    /auth/profile             - 내 정보 수정
PUT    /auth/profile/image       - 프로필 이미지 변경
POST   /auth/password/forgot     - 비밀번호 찾기
POST   /auth/password/reset      - 비밀번호 재설정
```

### 5.2 이벤트
```
GET    /events                   - 이벤트 목록 (필터: upcoming/past, club, type)
GET    /events/:id               - 이벤트 상세
POST   /events                   - 이벤트 생성 (Admin)
PUT    /events/:id               - 이벤트 수정 (Admin)
DELETE /events/:id               - 이벤트 삭제 (Admin)
GET    /events/:id/registrations - 등록자 목록 (Admin)
```

### 5.3 등록
```
POST   /registrations            - 이벤트 등록
GET    /registrations/my         - 내 등록 목록
GET    /registrations/:id        - 등록 상세
DELETE /registrations/:id        - 등록 취소
POST   /registrations/:id/checkin - 체크인 (Admin)
```

### 5.4 티켓
```
GET    /tickets/my               - 내 티켓 목록
GET    /tickets/:id              - 티켓 상세
POST   /tickets/:id/validate     - 티켓 유효성 검증 (Admin)
```

### 5.5 채팅
```
GET    /chats                    - 채팅 목록
POST   /chats                    - 채팅 생성
GET    /chats/:id                - 채팅 상세
GET    /chats/:id/messages       - 메시지 목록 (페이지네이션)
POST   /chats/:id/messages       - 메시지 전송
POST   /chats/:id/members        - 멤버 추가
DELETE /chats/:id/members/:userId - 멤버 삭제
```

### 5.6 사용자
```
GET    /users                    - 사용자 검색
GET    /users/:id                - 사용자 상세
GET    /users/:id/friends        - 친구 목록
POST   /users/:id/friends        - 친구 추가
DELETE /users/:id/friends/:friendId - 친구 삭제
```

### 5.7 그룹/동아리
```
GET    /clubs                    - 동아리 목록
GET    /clubs/:id                - 동아리 상세
POST   /clubs/:id/join           - 동아리 가입 요청
```

---

## 6. UI/UX 가이드라인

### 6.1 컬러 시스템

#### Primary Colors
- Black: #000000
- White: #FFFFFF

#### Accent Colors
- Orange: #ff8d28
- Cyan: #00c0e8
- Purple: #cb30e0
- Green: #34c759

#### Gray Scale
- Gray 1: #8e8e93
- Gray 2: #aeaeb2
- Gray 3: #c7c7cc
- Gray 4: #d1d1d6
- Gray 5: #e5e5ea
- Gray 6: #f2f2f7

#### Status Colors
- Success: #34c759
- Warning: #ff9500
- Error: #ff3b30
- Info: #007aff

### 6.2 타이포그래피

#### 폰트 패밀리
- Logo: Porter Sans Block
- Headings: Open Sans Bold
- Body: Open Sans Regular / Inter
- Numbers: Gafata

#### 폰트 사이즈
- Logo: 70px (Splash), 30px (Header)
- Heading 1: 30px
- Heading 2: 20px
- Body: 15px
- Caption: 12px
- Small: 10px

### 6.3 간격 시스템
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

### 6.4 Border Radius
- Small: 5px (Badge)
- Medium: 10px (Button, Input)
- Large: 20px (Card, Selection)
- Circle: 50% (Avatar)

### 6.5 그림자
- Card Shadow: 0px 2px 20px rgba(0, 0, 0, 0.06)
- Button Shadow: none (flat design)

---

## 7. 화면별 라우트 구조

### 7.1 Role-based Routing 아키텍처

동일한 앱 내에서 Admin과 일반 사용자를 구분하여 라우팅한다.

```typescript
// app/(tabs)/_layout.tsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

return (
  <Tabs>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="search" options={{ title: 'Search' }} />
    <Tabs.Screen name="onepass" options={{ title: 'ONE PASS' }} />
    <Tabs.Screen name="community" options={{ title: 'Community' }} />
    <Tabs.Screen name="mypage" options={{ title: 'My Page' }} />
    {isAdmin && (
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <AdminIcon color={color} />
        }}
      />
    )}
  </Tabs>
);
```

### 7.2 디렉토리 구조

```
app/
├── (auth)/
│   ├── _layout.tsx
│   ├── splash.tsx
│   ├── login.tsx
│   └── signup/
│       ├── _layout.tsx
│       ├── step1.tsx          # Profile setup (username, legal name)
│       ├── step2.tsx          # Profile picture
│       ├── step3.tsx          # Basic info (student ID, nationality, gender)
│       ├── step4.tsx          # Password
│       └── step5.tsx          # Terms of service
├── (tabs)/
│   ├── _layout.tsx            # Role 기반 탭 표시 로직
│   ├── index.tsx              # Home (Admin: "A" 배지 표시)
│   ├── search.tsx             # Search
│   ├── onepass.tsx            # ONE PASS
│   ├── community/
│   │   ├── _layout.tsx
│   │   ├── index.tsx          # Chats list
│   │   ├── add-friends.tsx    # Add Friends
│   │   ├── join-groups.tsx    # Join Groups
│   │   ├── search-friends.tsx # Admin: 친구 검색
│   │   └── manage-friends.tsx # Admin: 친구 관리
│   └── mypage.tsx             # My Page
├── events/
│   ├── [id].tsx               # Event Detail
│   └── create.tsx             # Admin: Add Event
├── chats/
│   ├── [id].tsx               # Chat Detail
│   └── create.tsx             # Create Group Chat
├── admin/
│   ├── _layout.tsx            # Admin 권한 체크 미들웨어
│   ├── index.tsx              # AdminHub 대시보드
│   ├── events.tsx             # AdminHub event list
│   └── events/
│       ├── [id].tsx           # Event management
│       └── create.tsx         # Add Event 플로우
├── _layout.tsx                # 전역 레이아웃 + Auth Provider
└── +not-found.tsx
```

### 7.3 Admin 권한 보호

```typescript
// app/admin/_layout.tsx
export default function AdminLayout() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack />;
}
```

---

## 8. 개발 우선순위

### Phase 1: 핵심 기능 (MVP)
1. Splash / Login / Sign Up 플로우
2. Home 화면 (이벤트 목록)
3. Event Detail (Free Registration)
4. ONE PASS 기본 (바코드 표시, 체크인)
5. 하단 네비게이션

### Phase 2: 확장 기능
1. Prepaid / 1/N Registration
2. Community (Chats, Add Friends, Join Groups)
3. Create Group Chat
4. Search 기능
5. My Page

### Phase 3: 고급 기능
1. AdminHub (관리자 기능)
2. 결제 연동
3. 푸시 알림
4. 실시간 채팅 (WebSocket)
5. 통계/분석

---

## 9. 기술 구현 노트

### 9.1 바코드 생성
- react-native-barcode-builder 또는 expo-barcode-generator 사용
- 바코드 데이터: `{userId}-{eventId}-{registrationId}-{timestamp}`
- 2분마다 자동 갱신 (타이머 표시)

### 9.2 이미지 처리
- expo-image-picker: 프로필 사진 선택
- expo-image-manipulator: 이미지 크롭/리사이즈
- 이미지 업로드: S3 또는 Cloudinary

### 9.3 실시간 기능
- WebSocket: 채팅 실시간 메시지
- Server-Sent Events: 이벤트 업데이트 알림

### 9.4 결제 연동
- 토스페이먼츠 또는 카카오페이 SDK
- Prepaid: 즉시 결제
- 1/N: 이벤트 종료 후 정산

### 9.5 인증
- JWT 기반 인증
- Access Token (15분) + Refresh Token (7일)
- Secure Storage에 토큰 저장
