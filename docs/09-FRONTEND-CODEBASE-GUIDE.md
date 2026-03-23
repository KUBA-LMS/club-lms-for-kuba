# Frontend Codebase Guide

ClubX 모바일 앱 프론트엔드의 전체 구조와 각 파일의 역할을 설명하는 문서입니다.
다른 프론트엔드 개발자가 프로젝트에 투입되었을 때 빠르게 파악할 수 있도록 작성되었습니다.

---

## 기술 스택

- React Native 0.81.5 + Expo 54
- TypeScript 5.9
- React 19
- React Navigation 7.x (Native Stack + Bottom Tabs)
- Axios (HTTP 클라이언트, 토큰 자동 갱신 인터셉터)
- WebSocket (커스텀 구현, Redis Pub/Sub 연동)
- AsyncStorage (토큰, 유저 정보, 검색 기록 저장)
- @gorhom/bottom-sheet (바텀시트 UI)
- @mj-studio/react-native-naver-map (네이버 지도)
- react-native-vision-camera (바코드 스캐너)
- react-native-reanimated (애니메이션)

---

## 루트 파일

### App.tsx

앱 진입점. 다음 순서로 초기화:
1. 폰트 로딩 (Inter, Gafata, PorterSansBlock) - 완료될 때까지 네이티브 스플래시 유지
2. `SplashScreen.hideAsync()` 호출 후 인앱 스플래시 표시
3. `AuthProvider`로 인증 상태 관리
4. `NavigationContainer`에 딥링크 설정 (`clublms://` scheme)
5. `ErrorBoundary`로 전역 에러 캐치
6. `NetworkBanner`로 오프라인 상태 표시

### app.json

Expo 설정:
- Bundle ID: `com.clubx.app`
- 네이티브 스플래시: `assets/splash-native.png` (검은 배경)
- 플러그인: expo-font, expo-camera, vision-camera, Naver Map

### package.json

주요 의존성:
- `@react-navigation/*` (네비게이션 5개 패키지)
- `@gorhom/bottom-sheet` v5 (바텀시트)
- `react-native-vision-camera` v4 (카메라/바코드)
- `react-native-barcode-svg` (바코드 렌더링)
- `@react-native-community/netinfo` (네트워크 상태)
- `expo-image-picker`, `expo-location`, `expo-camera`

---

## src/ 디렉토리 구조

```
src/
├── assets/              # 폰트, 이미지
├── components/          # 재사용 컴포넌트 (기능별 폴더)
├── config/              # 앱 설정 (API URL, 스토리지 키)
├── constants/           # 디자인 시스템 (색상, 타이포, 스페이싱)
├── context/             # React Context (인증)
├── hooks/               # 커스텀 훅
├── navigation/          # 네비게이션 설정
├── screens/             # 화면 컴포넌트
├── services/            # API 서비스 레이어
├── types/               # TypeScript 타입 정의
└── utils/               # 유틸리티 함수
```

---

## config/

### index.ts
- `API_URL`: 개발 환경에서 로컬 IP 자동 감지, 프로덕션은 환경변수 사용
- `WS_URL`: API_URL에서 http를 ws로 치환
- `IMAGE_BASE_URL`: 상대경로 이미지를 절대경로로 변환할 때 사용
- 스토리지 키 상수: `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY`, `USER_KEY`
- `REQUEST_TIMEOUT`: 30초

---

## constants/ (디자인 시스템)

### colors.ts
- primary: `#007AFF` (iOS 블루) + light/dark 변형
- 상태 색상: success(`#34C759`), warning(`#FF9500`), error(`#FF3B30`), info(`#5AC8FA`)
- grayscale: `gray50`~`gray900` 단계
- 등록 상태별 색상: registered, open, requested, closed, upcoming
- overlay: 투명도별 검정 (light, medium, dark)

### typography.ts
- Inter 폰트 기반 텍스트 스타일
- 제목: h1(28px) ~ h4(18px)
- 본문: bodyLarge(16px), body(14px), bodySmall(13px)
- 레이블, 캡션, 버튼 스타일
- 폰트 웨이트: regular(400), medium(500), semibold(600), bold(700)

### spacing.ts
- 기본 단위: xxs(2) ~ xxxl(64)
- 화면 패딩: horizontal(20), vertical(16)
- 레이아웃: borderRadius(4~20, full), cardHeight, buttonHeight(48), inputHeight(44)
- Safe area 기본값: iOS(20), Android(44)

### shadows.ts
- 플랫폼별 그림자 (iOS: shadow*, Android: elevation)
- 크기별: sm, md, lg, xl, card

---

## types/

### auth.ts
- `User`: 전체 유저 프로필 (id, username, legal_name, email, student_id, nationality, gender, profile_image, role, is_active, timestamps)
- `UserBrief`: 리스트용 간략 유저 (id, username, profile_image)
- `GenderType`: 'male' | 'female' | 'other'
- `LoginRequest/Response`: 로그인 요청/응답 (토큰 + 유저)
- `SignUpRequest`: 회원가입 데이터 (email 필수)
- `RefreshTokenRequest/Response`: 토큰 갱신
- `ForgotPasswordRequest`, `ResetPasswordRequest`: 비밀번호 찾기/재설정
- `AuthState`: 전역 인증 상태 (user, tokens, isLoading, isAuthenticated)

### event.ts
- `EventType`: 'official' | 'private'
- `CostType`: 'free' | 'prepaid' | 'one_n'
- `UserRegistrationStatus`: 'registered' | 'visited' | 'open' | 'requested' | 'closed' | 'upcoming'
- `Event`: 이벤트 전체 정보 (제목, 날짜, 위치(lat/lng), 슬롯, 비용, 가시성, 포스터, 관련 이벤트)
- `EventWithStatus`: Event + 유저의 등록 상태, 참가자 미리보기, 북마크 여부
- `Registration`: 등록 기록 (상태, 결제 상태, 체크인 시간)
- `VisibilityType`: 'friends_only' | 'club'

### chat.ts
- `ChatType`: 'direct' | 'group' | 'event'
- `MessageType`: 'text' | 'image' | 'ticket' | 'payment_request' | 'ticket_delivered' | 'payment_completed' | 'event_share'
- `Chat`: 채팅방 (멤버, 마지막 메시지, 안읽은 수)
- `Message`: 메시지 (content, type, sender, 클라이언트 상태: sending/sent/failed)
- `PaymentSplit`: 정산 분할 (user, amount, status)
- `PaymentRequest`: 정산 요청 (splits, 요청자, 계좌 정보)
- `TicketBrief`: 티켓 간략 정보

### onepass.ts
- `OnePassTicket`: 티켓 + 바코드 + 이벤트 정보
- `OnePassScreenState`: 'auto_selection' | 'viewing_ticket' | 'checked_in'

### accessControl.ts
- `ScanResult`: 스캔 결과 (entry_approved, entry_denied_pending, entry_denied_no_ticket, double_checked_in)
- `Participant`: 참가자 정보 (유저, 등록, 티켓 상태, 소속 클럽)
- `ScanResponse`, `ParticipantsListResponse`: API 응답 타입

---

## context/

### AuthContext.tsx
전역 인증 상태 관리:
- **State**: user, accessToken, refreshToken, isLoading, isAuthenticated
- **Methods**:
  - `login(credentials)`: 로그인 후 토큰/유저 저장
  - `signUp(data)`: 회원가입
  - `logout()`: 토큰 삭제 + API 호출
  - `refreshUser()`: 유저 정보 갱신
- 앱 시작 시 AsyncStorage에서 저장된 인증 정보 복원
- Axios 인터셉터와 토큰 동기화

---

## services/ (API 레이어)

### api.ts
Axios 인스턴스 설정:
- **Request 인터셉터**: Authorization 헤더에 토큰 자동 추가
- **Response 인터셉터**: 401 에러 시 refresh_token으로 자동 재발급, 재발급 중 큐잉
- **토큰 갱신 콜백**: AuthContext에 새 토큰 전달
- Base URL: config에서 가져옴, 30초 타임아웃

### auth.ts
인증 API:
- `login(credentials)` - 로그인, 토큰+유저 AsyncStorage 저장
- `signUp(data)` - 회원가입
- `logout()` - API 호출 + AsyncStorage 클리어
- `getCurrentUser()` - /auth/me 호출, 유저 정보 저장
- `getStoredAuth()` - AsyncStorage에서 인증 정보 복원
- `forgotPassword(email)` - 비밀번호 재설정 이메일 발송
- `resetPassword(token, newPassword)` - 비밀번호 재설정
- `changePassword(currentPassword, newPassword)` - 비밀번호 변경
- `deleteAccount()` - 계정 삭제

### events.ts
이벤트 API:
- `listEvents(params)` - 이벤트 목록 (필터: upcoming/past/all, official/private, club, search, 페이지네이션)
- `getEvent(eventId)` - 이벤트 상세 (유저 등록 상태 포함)
- `registerForEvent(eventId)` - 참가 신청
- `cancelRegistration(registrationId)` - 참가 취소
- `searchEventsAndProviders(query)` - 이벤트+제공자 통합 검색

### chat.ts
채팅 API:
- `createChat(type, name, member_ids, event_id)` - 채팅방 생성
- `searchUsers(query)` - 유저 검색 (최대 20명)
- `listChats(clubId?)` - 채팅 목록 (클럽 필터 가능)
- `getChat(chatId)` - 채팅방 상세
- `getChatMessages(chatId, params)` - 메시지 목록 (페이지네이션, 오래된 순)
- `sendMessage(chatId, content, type)` - 메시지 전송
- `transferTicket(chatId, ticketId, recipientId)` - 티켓 양도
- `requestPaymentSplit(chatId, amount, recipients)` - 정산 요청
- `confirmPaymentSplit(chatId, paymentRequestId)` - 정산 확인
- `markChatAsRead(chatId)` - 읽음 처리

### websocket.ts
커스텀 WebSocket 클라이언트:
- 자동 재연결 (exponential backoff)
- 채널 구독/해제
- 이벤트 리스너 등록 (unsubscribe 함수 반환)
- Ping heartbeat로 연결 유지
- 앱 백그라운드/포그라운드 전환 처리
- **Signal-only**: WS는 알림만, 실제 데이터는 REST로 가져옴

### onepass.ts
- `getOnePassTickets()` - 유저의 티켓 목록 (바코드, 이벤트 정보 포함)

### user.ts
유저 프로필:
- `updateProfile(data)` - 프로필 수정 (username, legal_name, email, student_id, nationality, gender)
- `getMyRegistrations(page, limit, status)` - 내 등록 이력
- `getSettlementHistory()` - 정산 내역

### clubs.ts
클럽/그룹:
- `getMyGroups()` - 내 클럽 목록 (하위 그룹 포함)
- `createGroup(name, logoImage, parentId)` - 그룹 생성
- `joinGroup(clubId)` - 그룹 가입
- `leaveGroup(clubId)` - 그룹 탈퇴

### accessControl.ts
출입 관리 (관리자):
- `getParticipants(eventId, statusFilter)` - 참가자 목록 (상태별 필터, 카운트)
- `scanBarcode(eventId, barcode)` - 바코드 스캔 체크인
- `overrideRegistration(eventId, registrationId)` - 관리자 수동 체크인
- `searchUsers(query)` - 유저 검색
- `walkInRegister(eventId, userId)` - 현장 등록

### adminHub.ts
관리자 클럽 관리:
- 멤버 목록, 역할 관리
- 보증금 잔액/거래 내역
- 하위 그룹 관리

### bookmarks.ts
- `toggleBookmark(eventId)` - 북마크 추가/제거
- `listBookmarks(page, limit)` - 북마크 목록

### upload.ts
- `uploadImage(uri)` - 로컬 file:// URI를 서버에 업로드, HTTPS URL 반환
- MIME 타입 자동 감지 (jpeg/png/webp)

### storage.ts
AsyncStorage 래퍼:
- 토큰 저장/조회/삭제 (access, refresh)
- 유저 정보 저장/조회
- 검색 기록 저장/조회 (최대 20개)

---

## hooks/

### useWebSocket.ts
- `useWebSocketConnection()` - 앱 루트에서 WS 연결 초기화, 인증 변경/포그라운드 전환 시 재연결
- `useChannel(channel, handler)` - 특정 채널 구독 (마운트 시 구독, 언마운트 시 해제)
- `useUserChannel(handler)` - `user:{userId}` 채널 구독 (개인 알림)

### useChat.ts
- `useChatRoom(chatId)` - 채팅방 상태 관리
  - `loadInitial()` - 채팅방 + 최근 30개 메시지 로드
  - `loadMore()` - 무한 스크롤 페이지네이션
  - `sendMessage()` - 낙관적 메시지 전송 (전송 중/완료/실패 상태)
  - `markAsRead()` - 자동 읽음 처리
  - `computeUnreadCount()` - 카카오톡 스타일 안읽은 수 계산
  - WS 채널 `chat:{chatId}` 구독으로 실시간 업데이트
- `useChatList()` - 채팅 목록 관리 (페이지네이션 + 실시간 업데이트)

### useMyClubs.ts
- clubs 목록 (id, name, logo_image, subgroups) 반환
- isLoading 상태
- `refresh()` - API에서 다시 로드
- 마운트 시 자동 로드

### useSearchDebounce.ts
- 검색어 디바운싱 (기본 300ms)
- 새 검색어 입력 시 이전 요청 취소
- results, isLoading 반환

---

## navigation/

### types.ts
네비게이션 파라미터 타입 정의:

**AuthStackParamList** (비인증):
- `Login` - 로그인
- `SignUpStep1` ~ `SignUpStep5` - 5단계 회원가입 (각 단계에서 이전 데이터를 params로 전달)
- `ForgotPassword` - 비밀번호 찾기

**MainStackParamList** (인증 후):
- `Home` - 홈 (지도 + 이벤트)
- `EventDetail` - 이벤트 상세 (`{ eventId }`)
- `OnePass` - 티켓 뷰어 (`{ eventId? }`)
- `Community` - 커뮤니티 (채팅/친구/그룹)
- `CreateGroupChat` - 그룹채팅 생성
- `ChatRoom` - 채팅방 (`{ chatId }`)
- `Profile` - 프로필
- `EditProfile` - 프로필 수정
- `Settings` - 설정
- `AdminCreateEvent` - 이벤트 생성/수정 (`{ eventId? }`)
- `AdminUploadPoster` - 포스터 업로드
- `AccessControl` - 출입 관리
- `AdminHub` - 관리자 허브
- `AdminHubSubgroupDetail` - 하위그룹 상세 (`{ clubId, subgroupId, subgroupName }`)
- `AdminHubMemberDetail` - 멤버 상세 (`{ clubId, adminUserId, adminUsername }`)

**RootStackParamList**:
- `Auth` → AuthNavigator
- `Main` → MainNavigator
- `Splash` → SplashScreen

### AuthNavigator.tsx
비인증 유저용 스택:
- Login, SignUpStep1~5, ForgotPassword
- 우에서 좌로 슬라이드 전환

### MainNavigator.tsx
인증 유저용 스택:
- 마운트 시 WebSocket 연결 초기화
- Home이 기본 화면
- OnePass: 아래에서 위로 슬라이드
- Profile: 우에서 좌로 슬라이드
- 관리자 화면들 포함

---

## screens/

### 인증 화면 (루트 레벨)

**LoginScreen.tsx**
- 이메일/사용자명 + 비밀번호 입력
- 비밀번호 표시/숨기기 토글
- 디바이스 너비 기반 반응형 스케일링
- "비밀번호 찾기" 링크 -> ForgotPassword로 이동
- "회원가입" 링크 -> SignUpStep1로 이동
- 에러 표시, 로딩 상태

**SignUpStep1Screen.tsx**
- 진행 바 (1/5)
- Username 입력: 3자 이상 + 영문/숫자/언더스코어 검증
- Legal Name 입력
- Email 입력: 이메일 형식 검증
- 모든 필드 유효 시 "Next" 버튼 활성화
- SignUpStep2로 username, name, email 전달

**SignUpStep2Screen.tsx**
- 진행 바 (2/5)
- 프로필 이미지 선택 (expo-image-picker)
- 이미지 미리보기 + 삭제
- 이미지 업로드 후 URI 전달
- 건너뛰기 가능 (이미지 선택사항)

**SignUpStep3Screen.tsx** (~701줄)
- 진행 바 (3/5)
- 학번(Student ID) 입력
- 국적(Nationality) 선택 (피커/모달)
- 성별(Gender) 선택 (male/female/other)

**SignUpStep4Screen.tsx** (~488줄)
- 진행 바 (4/5)
- 비밀번호 입력 + 확인
- 비밀번호 강도 검증
- 이전 단계 데이터 모두 수신

**SignUpStep5Screen.tsx** (~438줄)
- 진행 바 (5/5)
- 최종 확인 화면
- 모든 입력 데이터 확인
- 계정 생성 API 호출
- 가입 완료 후 자동 로그인

**ForgotPasswordScreen.tsx**
- 이메일 입력
- "재설정 링크 전송" 버튼
- 전송 완료 후 확인 메시지

**SplashScreen.tsx**
- 검은 배경 + ClubX 로고 (splash-icon.png)
- 페이드인 + 스프링 애니메이션
- 2.2초 후 `onFinish` 콜백 호출
- 로고 크기: 화면 너비의 65%

### 메인 화면 (/screens/main/)

**HomeScreen.tsx** (~1166줄) - 가장 복잡한 화면
- **지도 영역**: 네이버 지도 + 이벤트 마커 표시, 사용자 위치 추적
- **검색 바**: 이벤트/제공자 검색, 검색 기록 드롭다운
- **필터**: 날짜(현재/과거/전체), 타입(Official/Private), 클럽별, 정렬(날짜/거리/추천)
- **이벤트 카드 리스트**: 바텀시트에서 스크롤
- **이벤트 상세 바텀시트**: 카드 탭 시 상세 정보 표시
- **등록 모달**: 참가 신청 + 결제 정보
- **공유 바텀시트**: 이벤트 공유
- **네비게이션 버튼들**: 그룹, 북마크(My Badge), OnePass, 관리자 FAB
- **실시간 업데이트**: WS로 이벤트 변경 감지

**EventDetailScreen.tsx** (~428줄)
- 이벤트 포스터 이미지 캐러셀
- 이벤트 정보 (제목, 날짜, 장소, 비용)
- 참가자 미리보기 리스트
- 참가 신청 버튼 (등록 모달 오픈)
- 공유/북마크 버튼
- 지도에 위치 표시
- 등록 상태 인디케이터
- 참가 취소 버튼 (등록된 경우)

**OnePassScreen.tsx** (~356줄)
- 티켓 캐러셀 (수평 스와이프)
- 다가오는 이벤트 티켓 자동 선택
- 바코드 SVG 렌더링
- 유저 프로필 헤더
- 이벤트 정보 패널
- 관리자 스캔 시 체크인 오버레이 표시
- 8초 간격 티켓 상태 폴링
- 액션 버튼 (공유, 삭제, 설정)

**CommunityScreen.tsx** (~366줄)
- 3개 탭: Chats | Friends | Join Groups
- **Chats 탭**: 클럽별 필터, 채팅 리스트 (안읽은 수 표시), 그룹채팅 생성 버튼
- **Friends 탭**: 검색 | 요청 | 관리 서브탭
  - 유저 검색 + 친구 요청
  - 받은 요청 수락/거절
  - 친구 목록 관리
- **Join Groups 탭**: 가입 가능 그룹 탐색, 가입 버튼

**ChatRoomScreen.tsx** (~290줄)
- 채팅 헤더 (제목, 멤버 수)
- Inverted FlatList (최신 메시지가 아래)
- 메시지 버블 (텍스트, 티켓, 정산 요청 등 타입별)
- 안읽은 수 표시
- 입력 바 + 전송 버튼
- 티켓 양도 모달
- 정산 요청 모달
- 정산 상세 바텀시트
- 낙관적 메시지 전송
- WS로 실시간 메시지 동기화

**ProfileScreen.tsx** (~908줄)
- 유저 아바타 + 정보
- 프로필 수정 버튼
- 접이식 섹션들 (LayoutAnimation 사용):
  - My Registrations: 상태 뱃지 포함
  - My Clubs: 역할 정보 포함
  - Settlement History: 정산 기록
- 설정/로그아웃 버튼

**EditProfileScreen.tsx** (~281줄)
- username, legal_name, email 수정
- student_id, nationality, gender 수정
- 프로필 이미지 변경
- 저장 시 유효성 검증

**SettingsScreen.tsx** (~652줄)
- 비밀번호 변경 모달 (현재 비밀번호, 새 비밀번호, 확인)
- 계정 삭제 (2단계 확인: Alert -> 최종 확인)
- 로그아웃
- 앱 버전 정보

### 관리자 화면 (/screens/admin/)

**AdminCreateEventScreen.tsx** (~1084줄) - 이벤트 생성/수정 폼
- 제목, 설명, 인원 수 입력
- 이벤트 날짜 피커
- 등록 기간 (시작/종료) 바텀시트
- 이벤트 타입 (official/private) + 비용 타입 (free/prepaid/one_n) 바텀시트
- 지도에서 위치 선택 + 주소 검색 바텀시트
- 게시 범위 설정 (friends-only/club)
- 제공자 선택 바텀시트
- 포스터 이미지 업로드
- 네이버 지도로 선택 위치 표시
- eventId가 있으면 수정 모드

**AdminUploadPosterScreen.tsx** (~264줄)
- 디바이스에서 이미지 선택
- 이미지 미리보기
- 업로드 진행 표시
- 선택된 URI를 콜백으로 전달

**AccessControlScreen.tsx** (~344줄)
- 바코드 스캐너 영역 (vision-camera)
- 스캔 결과 배너 (입장 승인/거부)
- 참가자 리스트 (상태별 필터)
- 참가자 테이블 (유저 정보, 상태, 체크인 시간)
- Walk-in 등록 (유저 검색 후 수동 등록)
- 이벤트 선택 드롭다운

**AdminHubScreen.tsx** (~735줄)
- 조직 정보 (클럽명, 로고, 설명)
- 멤버 리스트 (검색, 역할 표시)
- 하위 그룹 목록
- 이벤트 목록
- 보증금 시스템 (멤버별 잔액)
- 멤버/하위그룹 상세 화면으로 이동

**AdminHubSubgroupDetailScreen.tsx** (~263줄)
- 하위 그룹 정보
- 하위 그룹 멤버 목록
- 관리 옵션

**AdminHubMemberDetailScreen.tsx** (~179줄)
- 멤버 프로필 및 정보
- 관리자 권한 관리
- 보증금/잔액 정보

---

## components/

### /common/
- **Avatar.tsx**: 유저 아바타, 폴백 이미지, 크기 설정 가능
- **ScreenWrapper.tsx**: SafeArea 래퍼, 탭 바 높이 처리, 배경색 설정

### /icons/
- **index.tsx**: SVG 아이콘 컴포넌트 30개+ (StarsIcon, ShareIcon, ArrowBackIcon, CheckIcon 등)
- **OnePassLogo.tsx**: OnePass 브랜딩 로고

### /home/ (홈 화면 컴포넌트)
- **SearchBar.tsx**: 위치 인식 검색 입력
- **SearchDropdown.tsx**: 검색 결과 드롭다운 + 검색 기록
- **EventCard.tsx**: 이벤트 카드 (이미지, 제목, 날짜, 장소, 비용, 등록 상태 뱃지, 북마크)
- **FilterBadge.tsx**: 활성 필터 뱃지 (닫기 가능)
- **GroupsButton.tsx**: 클럽/그룹 선택 버튼
- **MyBadge.tsx**: 북마크 인디케이터/버튼
- **OnePassButton.tsx**: OnePass 이동 버튼 + 티켓 수 표시
- **TransitCard.tsx**: 교통 정보 카드
- **AdminFaceFab.tsx**: 관리자 FAB (이벤트 생성, 출입 관리 등 서브 액션)

### /event/ (이벤트 상세 컴포넌트)
- **EventDetailBottomSheet.tsx**: 이벤트 전체 정보 바텀시트
- **RegistrationModal.tsx**: 참가 신청 폼 + 결제 정보
- **ShareBottomSheet.tsx**: 이벤트 공유 (링크 복사, SNS)
- **index.ts**: 컴포넌트 export

### /onepass/ (티켓 뷰어 컴포넌트)
- **OnePassHeader.tsx**: 헤더 (타이틀)
- **TicketCard.tsx**: 개별 티켓 카드 + 바코드
- **TicketCarousel.tsx**: 티켓 수평 캐러셀 + 활성 티켓 추적
- **BarcodeDisplay.tsx**: 바코드 SVG 렌더링 + 번호 텍스트
- **BarcodeScannerModal.tsx**: vision-camera 바코드 스캐닝 UI
- **CheckinOverlay.tsx**: 체크인 성공/실패 오버레이
- **EventInfoPanel.tsx**: 이벤트 정보 패널
- **ActionButtons.tsx**: 공유/삭제/설정 버튼
- **UserProfile.tsx**: OnePass 내 유저 정보
- **AutoSelectionCapsule.tsx**: 자동 선택 인디케이터
- **index.ts**: 컴포넌트 export

### /chat/ (채팅 컴포넌트)
- **ChatHeader.tsx**: 채팅방 헤더 (제목, 멤버 수, 뒤로가기)
- **ChatMessageBar.tsx**: 메시지 입력 바 + 전송 버튼 + 액션 메뉴
- **MessageBubble.tsx**: 텍스트 메시지 버블 (발신자, 시간, 안읽은 수)
- **GiftTicketBubble.tsx**: 티켓 양도 메시지 버블
- **TicketDeliveredBubble.tsx**: 티켓 전달 완료 메시지
- **RequestSplitBubble.tsx**: 정산 요청 버블 (수신자, 금액)
- **SplitCompletedBubble.tsx**: 정산 완료 메시지
- **TransferTicketModal.tsx**: 티켓 양도 확인 모달
- **RequestSplitModal.tsx**: 정산 요청 생성 (금액, 수신자 선택)
- **PaymentDetailSheet.tsx**: 정산 상세 바텀시트
- **ReadReceipt.tsx**: 읽음 표시 (안읽은 수)

### /community/ (커뮤니티 컴포넌트)
- **ChatListItem.tsx**: 채팅 목록 항목 (마지막 메시지 미리보기, 안읽은 수 뱃지)
- **SegmentedControl.tsx**: 탭 전환 (Chats | Friends | Join Groups)
- **ClubFilterRow.tsx**: 클럽별 필터 선택
- **FriendSearchTab.tsx**: 친구 검색 UI
- **FriendRequestsTab.tsx**: 친구 요청 리스트 (수락/거절)
- **FriendManageTab.tsx**: 친구 관리 (삭제/차단)
- **JoinGroupsTab.tsx**: 가입 가능 그룹 탐색
- **UserListItem.tsx**: 유저 목록 항목 (아바타, 이름, 액션 버튼)
- **CreateGroupModal.tsx**: 그룹 채팅 생성 모달
- **LeaveGroupModal.tsx**: 그룹 탈퇴 확인
- **RemoveFriendModal.tsx**: 친구 삭제 확인
- **QRCodeModal.tsx**: 친구 추가용 QR 코드 표시

### /admin/ (관리자 컴포넌트)
- **AdminHeader.tsx**: 관리자 화면 공통 헤더
- **MemberCard.tsx**: 멤버 카드 (역할 뱃지)
- **MemberSearchSection.tsx**: 멤버 검색 + 리스트
- **EventListSection.tsx**: 클럽 이벤트 목록
- **TaskListSection.tsx**: 관리 업무 목록
- **OrganizationSection.tsx**: 조직 정보 + 설정
- **DepositModal.tsx**: 보증금 관리 모달
- **ConfirmModal.tsx**: 범용 확인 다이얼로그
- **DatePickerBottomSheet.tsx**: 날짜 선택 바텀시트 (캘린더)
- **AddressSearchBottomSheet.tsx**: 주소 검색 + 지오코딩
- **TypeSelectorBottomSheet.tsx**: 이벤트 타입/비용 타입 선택
- **RegistrationPeriodBottomSheet.tsx**: 등록 기간 선택
- **ProviderSelectorBottomSheet.tsx**: 이벤트 제공자 선택
- **PostVisibilityBottomSheet.tsx**: 게시 범위 설정 (friends-only/club)
- **index.ts**: 컴포넌트 export

### /access-control/ (출입 관리 컴포넌트)
- **AccessControlHeader.tsx**: 출입 관리 헤더
- **ScannerArea.tsx**: 바코드 스캐너 UI (vision-camera)
- **ScanResultBanner.tsx**: 스캔 결과 표시 (승인/거부)
- **EventSearchDropdown.tsx**: 이벤트 검색 드롭다운
- **EventSelector.tsx**: 이벤트 선택
- **StatusFilterTabs.tsx**: 상태별 참가자 필터
- **ParticipantsTable.tsx**: 참가자 테이블
- **ParticipantDetailCard.tsx**: 참가자 상세 카드
- **ModeSegmentedControl.tsx**: 스캔/수동 모드 전환
- **OverrideConfirmModal.tsx**: 수동 체크인 확인 모달
- **index.ts**: 컴포넌트 export

### /Map/ (지도 컴포넌트)
- **index.tsx / index.web.tsx**: 네이버 지도 래퍼 (플랫폼별)
- **EventMarkers.tsx**: 이벤트 마커 렌더링 + 클러스터링
- **MapPin.tsx**: 핀 마커 컴포넌트
- **LocationMarkerIcon.tsx**: 현재 위치 마커 (파란 점 + 정확도 원)
- **MyLocationButton.tsx**: 현재 위치로 이동 버튼 (expo-location)
- **SearchPin.tsx**: 검색 결과 위치 마커

### 루트 레벨 컴포넌트
- **ErrorBoundary.tsx**: 전역 에러 캐치 + 폴백 UI ("Something went wrong" + 재시도)
- **NetworkBanner.tsx**: 오프라인 상태 배너 (빨간 바, 슬라이드 애니메이션)

---

## utils/

- **image.ts**: `resolveImageUrl(url)` - 상대경로 `/static/...`을 절대 URL로 변환
- **safeArea.ts**: 플랫폼별 Safe Area 계산 헬퍼
- **share.ts**: 이벤트/콘텐츠 공유 유틸리티

---

## assets/

- **fonts/porter-sans-inline-block.ttf**: 커스텀 타이틀 폰트
- **splash-icon.png**: 인앱 스플래시 로고 (ClubX 텍스트 로고, 1603x392)
- **splash-native.png**: 네이티브 스플래시 (순수 검은 배경, 1284x2778)
- **icon.png**: 앱 아이콘
- **adaptive-icon.png**: Android 적응형 아이콘

---

## 아키텍처 패턴

### 인증 흐름
1. 네이티브 스플래시 (검은 화면) -> 폰트 로딩
2. 인앱 스플래시 (ClubX 로고 페이드인, 2.2초)
3. AsyncStorage에서 토큰 복원 시도
4. 토큰 있으면 MainNavigator, 없으면 AuthNavigator
5. 401 에러 시 refresh_token으로 자동 재발급
6. 로그아웃 시 저장소 클리어 + AuthNavigator로 전환

### 실시간 업데이트 (WebSocket)
- MainNavigator 마운트 시 WS 연결
- 채널 기반 구독: `user:{id}`, `chat:{chatId}`, `event:{eventId}`
- WS는 "이벤트가 발생했다"는 신호만 전달
- 실제 데이터는 항상 REST API로 가져옴
- 앱 백그라운드 전환 시 연결 해제, 포그라운드 복귀 시 재연결

### 데이터 페칭
- services/ 폴더가 모든 REST 엔드포인트 담당
- 커스텀 훅(useChat, useMyClubs 등)이 상태 관리
- 검색은 useSearchDebounce로 디바운싱
- 메시지 전송은 낙관적 업데이트 (UI 즉시 반영, 실패 시 롤백)

### 상태 관리
- **전역**: AuthContext (인증 상태)
- **로컬**: useState (각 컴포넌트)
- **영구 저장**: AsyncStorage (토큰, 유저 정보)
- **실시간**: WebSocket 리스너
- Redux/Zustand 미사용 - Context + Hooks로 충분한 규모

### 컴포넌트 구조
- **Screens**: 화면 단위, 복잡한 비즈니스 로직 포함
- **Components**: 기능 영역별 폴더 (home, event, chat, admin 등)
- **Bottom Sheets**: @gorhom/bottom-sheet 기반 모달 오버레이
- **Modals**: Alert 또는 커스텀 모달

---

## 파일 통계

| 카테고리 | 수량 |
|---------|------|
| 화면 (screens) | 19개 (인증 7, 메인 7, 관리자 5) |
| 컴포넌트 | 60개+ (11개 카테고리) |
| 서비스 | 14개 모듈 |
| 커스텀 훅 | 4개 |
| 타입 파일 | 5개 |
| 디자인 시스템 | 4개 (colors, typography, spacing, shadows) |
