# App Store 및 Google Play Store 배포 가이드

## 개요

이 문서는 Expo EAS를 사용하여 iOS App Store와 Google Play Store에 앱을 배포하는 전체 과정을 다룬다.

## 사전 준비

### 필수 계정

| 플랫폼 | 계정 | 비용 | 등록 URL |
|--------|------|------|----------|
| iOS | Apple Developer Program | $99/년 | https://developer.apple.com/programs/ |
| Android | Google Play Developer | $25 (1회) | https://play.google.com/console/ |
| Expo | Expo 계정 | 무료 | https://expo.dev/signup |

### Apple Developer 계정 설정

1. Apple Developer Program 가입 (개인 또는 조직)
2. 조직 계정의 경우 D-U-N-S 번호 필요 (발급까지 2-3주 소요)
3. 가입 승인까지 24-48시간 소요

### Google Play Developer 계정 설정

1. Google Play Console 접속
2. 개발자 계정 생성 및 $25 결제
3. 개인정보 및 개발자 정보 입력
4. 계정 활성화 (즉시 또는 최대 48시간)

## 빌드 프로필 설정

### eas.json 구성

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_VARIANT": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_VARIANT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 빌드 프로필 설명

| 프로필 | 용도 | 배포 방식 |
|--------|------|-----------|
| development | 개발 및 디버깅 | 내부 배포, 시뮬레이터 |
| preview | QA 테스트 | 내부 배포, 실기기 APK |
| production | 스토어 출시 | App Store, Play Store |

## iOS 배포 (App Store)

### 1. App Store Connect 앱 생성

1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. "My Apps" > "+" > "New App" 클릭
3. 앱 정보 입력:
   - Platform: iOS
   - Name: 앱 이름 (스토어 표시명)
   - Primary Language: 기본 언어
   - Bundle ID: app.config.js의 bundleIdentifier와 동일
   - SKU: 고유 식별자 (내부용)

### 2. 인증서 및 프로비저닝 프로필

EAS가 자동으로 관리한다. 수동 관리가 필요한 경우:

```bash
# 인증서 확인
eas credentials

# iOS 인증서 설정
eas credentials --platform ios
```

### 3. 프로덕션 빌드 생성

```bash
# iOS 프로덕션 빌드
eas build --platform ios --profile production
```

빌드 과정:
1. EAS 클라우드에서 빌드 시작
2. 인증서 및 프로비저닝 프로필 자동 생성/사용
3. 빌드 완료 시 .ipa 파일 생성
4. 빌드 URL로 다운로드 가능

### 4. App Store 제출

```bash
# 자동 제출
eas submit --platform ios --profile production

# 또는 빌드 후 자동 제출
eas build --platform ios --profile production --auto-submit
```

제출 후 과정:
1. App Store Connect에서 빌드 처리 (약 30분)
2. TestFlight에서 테스트 가능
3. 심사 제출 전 메타데이터 작성 필요

### 5. 앱 심사 준비

App Store Connect에서 필수 정보 입력:

**앱 정보**
- 스크린샷 (iPhone, iPad 각 사이즈별)
- 앱 설명 (최대 4000자)
- 키워드 (100자 제한)
- 지원 URL
- 개인정보처리방침 URL

**심사 정보**
- 연락처 정보
- 데모 계정 (로그인 필요 시)
- 심사 노트

**가격 및 판매**
- 가격 책정 (무료/유료)
- 판매 국가 선택

### 6. 심사 제출

1. App Store Connect에서 빌드 선택
2. 모든 필수 정보 입력 확인
3. "Submit for Review" 클릭

심사 기간: 평균 24-48시간 (최대 2주)

## Android 배포 (Google Play Store)

### 1. Google Play Console 앱 생성

1. [Google Play Console](https://play.google.com/console) 접속
2. "Create app" 클릭
3. 앱 정보 입력:
   - App name
   - Default language
   - App or Game
   - Free or Paid

### 2. Google Service Account 설정

Play Store API 접근을 위한 서비스 계정 생성:

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 선택
3. "APIs & Services" > "Credentials" > "Create Credentials" > "Service Account"
4. 서비스 계정 생성:
   - Name: "EAS Submit" 등
   - Role: 생략 가능
5. 생성된 서비스 계정 클릭 > "Keys" > "Add Key" > "Create new key" > "JSON"
6. 다운로드된 JSON 파일을 프로젝트 루트에 `google-service-account.json`으로 저장

**Play Console에서 권한 부여:**

1. Google Play Console > "Users and permissions" > "Invite new users"
2. 서비스 계정 이메일 입력 (JSON 파일의 client_email)
3. 권한 설정:
   - App access: 해당 앱 선택
   - Account permissions: "Release apps to testing tracks" 이상

### 3. 첫 번째 수동 업로드 (필수)

Google Play Store API 제한으로 첫 번째 빌드는 반드시 수동 업로드해야 한다.

```bash
# AAB 파일 빌드
eas build --platform android --profile production
```

수동 업로드:
1. Google Play Console > 앱 선택
2. "Release" > "Production" (또는 Testing 트랙)
3. "Create new release"
4. 빌드된 .aab 파일 업로드
5. Release notes 작성
6. "Review release" > "Start rollout"

### 4. 이후 자동 제출

첫 수동 업로드 후에는 EAS Submit 사용 가능:

```bash
# 자동 제출
eas submit --platform android --profile production

# 빌드 후 자동 제출
eas build --platform android --profile production --auto-submit
```

### 5. 앱 정보 작성

Google Play Console에서 필수 정보:

**스토어 등록정보**
- 앱 이름 (30자)
- 간단한 설명 (80자)
- 자세한 설명 (4000자)
- 스크린샷 (최소 2장, 권장 8장)
- 그래픽 이미지 (512x512 아이콘, 1024x500 배너)

**앱 콘텐츠**
- 개인정보처리방침 URL
- 앱 액세스 (테스트 계정 등)
- 광고 포함 여부
- 콘텐츠 등급 설문

**출시 준비**
- 국가/지역 선택
- 가격 책정

## 테스트 배포

### iOS TestFlight

```bash
# TestFlight 빌드
eas build --platform ios --profile production
eas submit --platform ios
```

TestFlight 설정:
1. App Store Connect > TestFlight
2. 내부 테스터 추가 (Apple ID 필요, 100명 제한)
3. 외부 테스터 추가 (이메일, 10,000명 제한, 간단한 심사 필요)

### Android 내부 테스트

```bash
# 내부 테스트 트랙으로 제출
eas submit --platform android --profile production
```

eas.json의 track 설정:
- `internal`: 내부 테스트 (100명)
- `alpha`: 비공개 테스트
- `beta`: 공개 테스트
- `production`: 프로덕션 출시

## 버전 관리

### 자동 버전 증가

eas.json에서 `autoIncrement` 설정:

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

- iOS: buildNumber 자동 증가
- Android: versionCode 자동 증가

### 수동 버전 관리

app.config.js에서 직접 관리:

```javascript
export default {
  expo: {
    version: '1.2.0',
    ios: {
      buildNumber: '15',
    },
    android: {
      versionCode: 15,
    },
  },
};
```

### 버전 규칙

| 필드 | 설명 | 예시 |
|------|------|------|
| version | 사용자에게 표시되는 버전 | "1.2.0" |
| buildNumber (iOS) | 내부 빌드 번호 | "15" |
| versionCode (Android) | 내부 빌드 번호 (정수) | 15 |

version은 스토어 등록정보에 표시되고, buildNumber/versionCode는 업데이트 판단에 사용된다.

## OTA 업데이트 (EAS Update)

코드 변경사항을 스토어 심사 없이 즉시 배포:

### 설정

```bash
# EAS Update 설정
eas update:configure
```

app.config.js에 자동 추가됨:

```javascript
{
  updates: {
    url: "https://u.expo.dev/your-project-id"
  },
  runtimeVersion: {
    policy: "appVersion"
  }
}
```

### 업데이트 배포

```bash
# 프로덕션 채널로 업데이트 배포
eas update --branch production --message "Bug fix for login"
```

### 제한사항

OTA로 업데이트 가능:
- JavaScript 코드 변경
- 이미지, 폰트 등 에셋 변경

OTA로 업데이트 불가 (새 빌드 필요):
- 네이티브 코드 변경
- 새로운 네이티브 모듈 추가
- app.config.js의 네이티브 설정 변경
- SDK 버전 변경

## CI/CD 자동화

### GitHub Actions 예시

`.github/workflows/eas-build.yml`:

```yaml
name: EAS Build

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build and Submit
        run: eas build --platform all --profile production --auto-submit --non-interactive
```

### EAS Workflows (네이티브 CI/CD)

`.eas/workflows/build-and-submit.yml`:

```yaml
name: Build and Submit
on:
  push:
    branches:
      - main

jobs:
  build-ios:
    runs-on: macos
    steps:
      - uses: actions/checkout@v4
      - uses: expo/eas-build-action@v1
        with:
          platform: ios
          profile: production

  build-android:
    runs-on: ubuntu
    steps:
      - uses: actions/checkout@v4
      - uses: expo/eas-build-action@v1
        with:
          platform: android
          profile: production

  submit:
    needs: [build-ios, build-android]
    runs-on: ubuntu
    steps:
      - uses: expo/eas-submit-action@v1
        with:
          platform: all
          profile: production
```

## 문제 해결

### iOS 빌드 실패

**인증서 문제**
```bash
# 인증서 재설정
eas credentials --platform ios
# "Remove" 선택 후 새로 생성
```

**프로비저닝 프로필 문제**
```bash
# Apple Developer Portal에서 프로필 확인
# Bundle ID가 일치하는지 확인
```

### Android 빌드 실패

**서명 키 문제**
```bash
# 키스토어 재설정
eas credentials --platform android
```

**Gradle 오류**
- `android/build.gradle` 의존성 버전 확인
- `npx expo prebuild --clean` 후 재시도

### 제출 실패

**iOS - Invalid Binary**
- 스크린샷 사이즈 확인
- 필수 권한 설명 누락 확인 (NSCameraUsageDescription 등)

**Android - Upload failed**
- 서비스 계정 권한 확인
- package name이 이미 등록된 경우 변경 필요

## 배포 체크리스트

### 빌드 전

- [ ] 버전 번호 확인 및 업데이트
- [ ] 환경 변수 설정 확인
- [ ] 앱 아이콘, 스플래시 스크린 설정
- [ ] app.config.js 설정 검토

### iOS 배포

- [ ] Apple Developer 계정 활성화
- [ ] App Store Connect에 앱 생성
- [ ] 필수 메타데이터 작성 (설명, 스크린샷, 정책)
- [ ] 프로덕션 빌드 생성
- [ ] TestFlight 테스트
- [ ] 심사 제출

### Android 배포

- [ ] Google Play Developer 계정 활성화
- [ ] Google Play Console에 앱 생성
- [ ] 서비스 계정 설정 및 권한 부여
- [ ] 첫 번째 빌드 수동 업로드
- [ ] 스토어 등록정보 작성
- [ ] 콘텐츠 등급 설문 완료
- [ ] 출시 트랙 선택 및 배포

## 참고 자료

- [EAS Build 공식 문서](https://docs.expo.dev/build/introduction/)
- [EAS Submit 공식 문서](https://docs.expo.dev/submit/introduction/)
- [App Store Connect 도움말](https://developer.apple.com/help/app-store-connect/)
- [Google Play Console 도움말](https://support.google.com/googleplay/android-developer/)
- [EAS Update 문서](https://docs.expo.dev/eas-update/introduction/)
