# Physical Device Testing (iOS)

Expo Dev Client를 사용하여 실제 iOS 기기에서 앱을 테스트하는 방법과, 자주 발생하는 문제 및 해결 방법을 정리한 문서.

## 배경

시뮬레이터에서는 `localhost`로 백엔드에 접근 가능하지만, 실제 아이폰에서는 `localhost`가 아이폰 자체를 가리키므로 Mac에서 실행 중인 백엔드 서버에 접근할 수 없다. LAN IP를 통해 접근해야 한다.

## 사전 조건

- Apple Developer 계정 (유료 $99/년, 또는 무료 계정으로 로컬 빌드 가능)
- Xcode 설치
- 아이폰과 Mac이 같은 Wi-Fi 네트워크에 연결
- USB 케이블로 아이폰-Mac 연결

## 아이폰 설정

### 1. 개발자 모드 활성화
- 설정 > 개인정보 보호 및 보안 > 개발자 모드 > 켜기
- 재부팅 필요

### 2. 컴퓨터 신뢰
- USB 연결 시 "이 컴퓨터를 신뢰하시겠습니까?" > 신뢰

### 3. 앱 인증서 신뢰 (첫 설치 후)
- 설정 > 일반 > VPN 및 기기 관리 > 개발자 인증서 > 신뢰

## Xcode Signing 설정

1. `frontend/ios/ClubLMS.xcworkspace`를 Xcode에서 열기 (`.xcodeproj`가 아님)
2. TARGETS > ClubLMS 선택
3. Signing & Capabilities 탭
4. "Automatically manage signing" 체크
5. Team: Apple Developer 계정 선택
6. "Register Device" 버튼이 나타나면 클릭하여 디바이스 등록

## 빌드 및 실행

### Step 1: 백엔드를 0.0.0.0으로 실행

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`--host 0.0.0.0`이 핵심. 이 옵션 없이 실행하면 localhost만 리슨하여 외부(아이폰)에서 접근 불가.

### Step 2: .env 파일에 Mac LAN IP 설정

```bash
# Mac의 LAN IP 확인
ipconfig getifaddr en0
```

`frontend/.env`:
```
EXPO_PUBLIC_API_URL=http://<Mac-LAN-IP>:8000/api/v1
NAVER_MAP_CLIENT_ID=...
```

### Step 3: 네이티브 빌드

```bash
cd frontend
npx expo run:ios --device
```

디바이스 선택 프롬프트에서 아이폰 선택. 첫 빌드는 10-15분 소요.

### Step 4: Metro 서버 실행 (빌드 후 별도 실행 시)

```bash
npx expo start --dev-client --host lan --clear
```

- `--host lan`: Metro가 LAN IP로 브로드캐스트
- `--clear`: 캐시 클리어 (env 변경 반영 필수)

## 주요 트러블슈팅

### 1. "Network Error" - 로그인/API 호출 실패

#### 증상
앱 UI는 정상 로딩되지만 (Metro 연결 OK), 로그인 등 API 호출 시 "Login Failed - Network Error" 발생.

#### 근본 원인
`frontend/.env` 파일에 `EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1`이 설정되어 있었음. Expo의 `EXPO_PUBLIC_*` 환경변수는 `.env` 파일에서 읽힌 후 Metro bundler가 JS 번들에 컴파일 타임에 인라인하는 방식. `.env` 파일의 값이 커맨드라인에서 전달한 환경변수보다 우선 적용되어, Mac LAN IP 대신 `localhost`가 사용됨.

실제 아이폰에서 `localhost`는 아이폰 자체를 가리키므로 Mac의 백엔드에 접근 불가.

#### 해결
`frontend/.env` 파일의 `EXPO_PUBLIC_API_URL`을 Mac의 LAN IP로 변경:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1
```

변경 후 반드시 `--clear` 옵션으로 Metro 재시작.

#### 디버그 방법
`frontend/src/config/index.ts`에 임시 로그 추가:
```typescript
console.log(">>> API_URL:", config.API_URL);
console.log(">>> EXPO_PUBLIC_API_URL:", process.env.EXPO_PUBLIC_API_URL);
```
Metro 터미널에서 실제 resolve된 URL 확인 가능.

### 2. "No script URL provided"

#### 증상
앱 설치 후 실행 시 빨간 화면에 "No script URL provided. Make sure the packager is running" 에러.

#### 원인
Metro bundler가 실행되지 않은 상태에서 앱이 실행됨.

#### 해결
Metro 서버 실행:
```bash
npx expo start --dev-client --host lan
```
그 후 앱 완전 종료(스와이프 업) 후 재실행.

### 3. "No code signing certificates"

#### 원인
Xcode에 Apple Developer 계정이 로그인되지 않았거나, Signing 설정이 안 됨.

#### 해결
Xcode에서 ClubLMS.xcworkspace 열고 Signing & Capabilities에서 Team 설정 + Sign In.

### 4. "Device is not registered in your developer account"

#### 원인
아이폰이 Apple Developer 계정에 등록되지 않음.

#### 해결
Xcode Signing & Capabilities에서 "Register Device" 버튼 클릭.

### 5. iOS App Transport Security (ATS) 차단

#### 증상
Safari에서 `http://<IP>:8000/docs` 접근 가능하지만, 앱에서 API 호출 실패.

#### 원인
iOS는 기본적으로 HTTP(비암호화) 요청을 차단. `Info.plist`의 `NSAllowsArbitraryLoads`가 `false`로 설정되어 있으면 LAN IP로의 HTTP 요청 차단.

#### 해결
`frontend/ios/ClubLMS/Info.plist`에서:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

`NSAllowsArbitraryLoads`를 `true`로 변경. 이는 네이티브 설정이므로 반드시 `npx expo run:ios --device`로 재빌드 필요.

주의: 프로덕션 배포 시에는 `false`로 되돌리고 HTTPS를 사용해야 함.

## 시뮬레이터 vs 실기기 전환

`.env` 파일의 `EXPO_PUBLIC_API_URL` 값만 바꾸면 됨:

| 환경 | EXPO_PUBLIC_API_URL |
|------|---------------------|
| 시뮬레이터 | `http://localhost:8000/api/v1` |
| 실기기 | `http://<Mac-LAN-IP>:8000/api/v1` |

변경 후 Metro `--clear` 재시작 필수.

config에 `Constants.expoConfig?.hostUri` 기반 자동 감지 코드가 있지만, Expo Dev Client 빌드에서는 `hostUri`가 `undefined`를 반환하여 작동하지 않는다. 따라서 `.env` 파일을 통한 수동 설정이 가장 확실한 방법.

## 관련 파일

- `frontend/.env` - 환경변수 설정 (API URL, Naver Map Client ID)
- `frontend/src/config/index.ts` - API URL resolve 로직
- `frontend/ios/ClubLMS/Info.plist` - iOS ATS 설정, URL Schemes
- `frontend/app.json` - Expo 설정, LSApplicationQueriesSchemes
