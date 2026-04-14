# Club LMS 외부 API 및 서비스 목록

앱 개발에 필요한 외부 API와 서비스 목록이다. 직접 가입하고 API 키를 발급받아야 한다.

---

## 1. 지도 API

### 사용처
- Add Event 화면: 이벤트 위치 검색 및 선택
- 이벤트 상세 화면: 위치 표시

### 권장 옵션

| 서비스 | 장점 | 단점 | 무료 한도 |
|--------|------|------|-----------|
| **Kakao Map API** | 한국 주소 정확도 높음, 한글 지원 우수 | 해외 커버리지 약함 | 월 30만 건 무료 |
| **Google Maps API** | 글로벌 커버리지, 자료 풍부 | 비용 발생 가능 | $200/월 크레딧 |
| **Naver Map API** | 한국 정확도 높음 | 해외 커버리지 없음 | 월 5만 건 무료 |

### 추천
- **Kakao Map API**: KUBA가 한국 대학 동아리이므로 한국 주소 정확도가 중요함

### 필요 작업
1. Kakao Developers 가입: https://developers.kakao.com
2. 애플리케이션 등록
3. REST API 키 발급
4. React Native용 패키지 설치: `react-native-maps` + Kakao Map 연동 또는 WebView 방식

---

## 2. 결제 API

### 사용처
- Prepaid Event: 사전 결제
- 1/N Event: 이벤트 종료 후 정산 결제
- 채팅 내 결제 요청 (1/N Request)

### 권장 옵션

| 서비스 | 장점 | 단점 | 수수료 |
|--------|------|------|--------|
| **Toss Payments** | React Native SDK 지원, 문서화 우수 | - | 2.8% + 0원 |
| **Kakao Pay** | 사용자 친숙도 높음 | 별도 SDK 필요 | 2.5% |
| **Portone (구 아임포트)** | 여러 PG사 통합 | 설정 복잡 | PG사별 상이 |

### 추천
- **Toss Payments**: React Native SDK가 가장 잘 문서화되어 있음
- 대안으로 **Portone**을 사용하면 여러 결제 수단을 한 번에 연동 가능

### 필요 작업
1. Toss Payments 가입: https://developers.tosspayments.com
2. 사업자 등록 (개인/법인)
3. API 키 발급 (Client Key, Secret Key)
4. React Native SDK 설치: `@tosspayments/payment-sdk`

### 주의사항
- 결제 서비스는 사업자 등록이 필요할 수 있음
- 테스트 모드로 개발 후 프로덕션 전환

---

## 3. 이미지 저장소

### 사용처
- 프로필 이미지 업로드
- 이벤트 포스터/티켓 이미지 업로드
- 채팅 이미지 전송

### 권장 옵션

| 서비스 | 장점 | 단점 | 무료 한도 |
|--------|------|------|-----------|
| **AWS S3** | 안정성, 확장성 | 설정 복잡, 비용 계산 복잡 | 5GB/12개월 (프리티어) |
| **Cloudinary** | 이미지 변환 내장, CDN 포함 | 용량 제한 | 25GB 저장/25GB 전송 |
| **Firebase Storage** | 설정 간편, Firebase 생태계 | 비용 발생 가능 | 5GB 저장 |
| **Supabase Storage** | PostgreSQL과 통합, S3 호환 | 상대적으로 신생 | 1GB 저장 |

### 추천
- **Cloudinary**: 이미지 리사이즈, 포맷 변환이 URL 파라미터로 가능하여 편리함
- 대안으로 **Supabase Storage**: 백엔드가 PostgreSQL이므로 통합 관리 편리

### 필요 작업
1. Cloudinary 가입: https://cloudinary.com
2. Cloud Name, API Key, API Secret 발급
3. 업로드 프리셋 설정
4. React Native에서 직접 업로드 또는 백엔드 경유 업로드 구현

---

## 4. 바코드 생성

### 사용처
- ONE PASS 화면: 티켓 바코드 표시 (2분마다 갱신)

### 권장 옵션

| 라이브러리 | 특징 |
|------------|------|
| **react-native-barcode-builder** | 순수 JS, 설정 간편 |
| **expo-barcode-generator** (비공식) | Expo 호환 |
| **react-native-barcode-svg** | SVG 기반, 커스터마이징 용이 |

### 추천
- **react-native-barcode-builder**: 가장 널리 사용되며 안정적

### 필요 작업
```bash
npm install react-native-barcode-builder
```

### 참고
- 외부 API가 아닌 로컬 라이브러리로 구현
- 바코드 데이터 포맷: `{userId}-{eventId}-{registrationId}-{timestamp}`

---

## 5. 푸시 알림

### 사용처
- 이벤트 등록 확인 알림
- 채팅 메시지 알림
- 이벤트 리마인더
- 결제 요청/완료 알림

### 권장 옵션

| 서비스 | 장점 | 단점 |
|--------|------|------|
| **Firebase Cloud Messaging (FCM)** | 무료, 안정적, Expo 지원 | Firebase 의존성 |
| **Expo Push Notifications** | Expo 네이티브 지원 | Expo 서버 의존성 |
| **OneSignal** | 대시보드 편리 | 일부 기능 유료 |

### 추천
- **Expo Push Notifications**: Expo 앱이므로 가장 간편
- FCM 토큰을 Expo가 자동 관리

### 필요 작업
1. Expo 프로젝트 설정에서 Push Notifications 활성화
2. 백엔드에서 Expo Push API 연동
3. iOS: Apple Developer 계정에서 Push Notification 인증서 발급
4. Android: FCM 설정 (google-services.json)

### 참고 문서
- https://docs.expo.dev/push-notifications/overview/

---

## 6. 실시간 통신 (WebSocket)

### 사용처
- 채팅 실시간 메시지
- 이벤트 업데이트 실시간 알림

### 권장 옵션

| 서비스 | 장점 | 단점 | 무료 한도 |
|--------|------|------|-----------|
| **자체 구현 (FastAPI WebSocket)** | 완전한 제어, 비용 없음 | 직접 구현 필요 | N/A |
| **Pusher** | 관리형 서비스, 간편 | 비용 발생 | 100 동시 연결 |
| **Ably** | 신뢰성 높음 | 비용 발생 | 5M 메시지/월 |
| **Supabase Realtime** | PostgreSQL 통합 | 기능 제한적 | 무료 티어 포함 |

### 추천
- **자체 구현**: FastAPI가 WebSocket을 기본 지원하므로 직접 구현 권장
- 백엔드에서 `fastapi.WebSocket` 사용

### 필요 작업
1. FastAPI에서 WebSocket 엔드포인트 구현
2. React Native에서 WebSocket 클라이언트 연결
3. 연결 관리, 재연결 로직 구현

---

## 7. 기타 필요 라이브러리

### 이미지 처리 (Expo 내장)
```bash
# 이미지 선택
npx expo install expo-image-picker

# 이미지 크롭/리사이즈
npx expo install expo-image-manipulator
```

### 보안 저장소 (토큰 저장)
```bash
npx expo install expo-secure-store
```

### 달력/날짜 선택
```bash
npm install react-native-calendars
# 또는
npx expo install @react-native-community/datetimepicker
```

---

## 8. API 키 관리 체크리스트

| 서비스 | 가입 URL | 필요 키 | 상태 |
|--------|----------|---------|------|
| Kakao Map | https://developers.kakao.com | REST API Key | [ ] |
| Toss Payments | https://developers.tosspayments.com | Client Key, Secret Key | [ ] |
| Cloudinary | https://cloudinary.com | Cloud Name, API Key, API Secret | [ ] |
| Apple Developer | https://developer.apple.com | Push Notification Certificate | [ ] |
| Google Firebase | https://console.firebase.google.com | google-services.json | [ ] |

---

## 9. 환경 변수 설정

API 키는 환경 변수로 관리한다. `.env` 파일 예시:

```env
# Kakao Map
KAKAO_REST_API_KEY=your_kakao_key

# Toss Payments
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Expo Push
EXPO_ACCESS_TOKEN=your_expo_token
```

### Expo에서 환경 변수 사용

```bash
npx expo install expo-constants
```

`app.config.js`에서 환경 변수를 앱에 노출:

```javascript
export default {
  expo: {
    extra: {
      kakaoApiKey: process.env.KAKAO_REST_API_KEY,
      tossClientKey: process.env.TOSS_CLIENT_KEY,
      // ...
    }
  }
};
```

---

## 10. 우선순위

### Phase 1 (MVP)
1. 이미지 저장소 (Cloudinary) - 프로필, 이벤트 포스터
2. 바코드 생성 (react-native-barcode-builder) - ONE PASS

### Phase 2
1. 지도 API (Kakao Map) - Add Event
2. 푸시 알림 (Expo Push) - 이벤트 알림

### Phase 3
1. 결제 API (Toss Payments) - Prepaid/1/N 결제
2. WebSocket (자체 구현) - 채팅
