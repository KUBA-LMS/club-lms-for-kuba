# Expo React Native 초기 프로젝트 세팅 가이드

## 개요

이 문서는 Expo를 사용한 React Native 프로젝트의 초기 세팅 과정을 다룬다. 프로덕션 레벨의 앱 개발을 위한 필수 설정과 도구들을 포함한다.

## 사전 요구사항

### 필수 설치 항목

- Node.js (v18 이상 권장)
- npm 또는 yarn
- Git
- VS Code (권장 에디터)

### 계정 준비

| 서비스 | 용도 | 비용 |
|--------|------|------|
| Expo 계정 | EAS Build/Submit 사용 | 무료 (유료 플랜 있음) |
| Apple Developer | App Store 배포 | $99/년 |
| Google Play Developer | Play Store 배포 | $25 (1회) |

## 프로젝트 생성

### 1. Expo 프로젝트 초기화

```bash
# 최신 Expo SDK로 프로젝트 생성
npx create-expo-app@latest my-app --template blank-typescript

# 프로젝트 디렉토리로 이동
cd my-app
```

### 2. Expo Router 설정 (권장)

```bash
# Expo Router 템플릿으로 시작하는 경우
npx create-expo-app@latest my-app --template tabs
```

## 개발 환경 설정

### ESLint 설정

```bash
# ESLint 및 관련 플러그인 설치
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier eslint-plugin-prettier
```

`.eslintrc.js` 파일 생성:

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'build/'],
};
```

### Prettier 설정

```bash
npm install --save-dev prettier
```

`.prettierrc` 파일 생성:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "arrowParens": "always"
}
```

`.prettierignore` 파일 생성:

```
node_modules/
.expo/
dist/
build/
*.lock
```

### VS Code 설정

`.vscode/settings.json` 파일 생성:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

`.vscode/extensions.json` 파일 생성:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "dsznajder.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## EAS 설정

### 1. EAS CLI 설치 및 로그인

```bash
# EAS CLI 전역 설치
npm install -g eas-cli

# Expo 계정 로그인
eas login

# 프로젝트 EAS 초기화
eas build:configure
```

### 2. eas.json 설정

`eas.json` 파일 수정:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 3. app.json / app.config.js 설정

`app.config.js`로 동적 설정 사용 (권장):

```javascript
const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.yourcompany.yourapp.dev';
  if (IS_PREVIEW) return 'com.yourcompany.yourapp.preview';
  return 'com.yourcompany.yourapp';
};

const getAppName = () => {
  if (IS_DEV) return 'MyApp (Dev)';
  if (IS_PREVIEW) return 'MyApp (Preview)';
  return 'MyApp';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'my-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier(),
      buildNumber: '1',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: getUniqueIdentifier(),
      versionCode: 1,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'your-project-id',
      },
    },
    plugins: [],
  },
};
```

## 필수 패키지 설치

### 네비게이션

```bash
# Expo Router (권장)
npx expo install expo-router expo-linking expo-constants expo-status-bar

# 또는 React Navigation
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

### 상태 관리

```bash
# Zustand (경량 상태 관리)
npm install zustand

# 또는 React Query (서버 상태 관리)
npm install @tanstack/react-query
```

### 네트워크

```bash
npm install axios
```

### 유틸리티

```bash
# 날짜 처리
npm install date-fns

# 폼 관리
npm install react-hook-form zod @hookform/resolvers
```

### 개발 도구

```bash
# 개발 클라이언트 (디버깅용)
npx expo install expo-dev-client
```

## Git 설정

### .gitignore 확인 및 수정

```gitignore
# Expo
.expo/
dist/
web-build/

# Node
node_modules/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# Local env files
.env*.local
.env

# TypeScript
*.tsbuildinfo

# EAS
google-service-account.json
```

### Husky 및 lint-staged 설정 (선택)

```bash
npm install --save-dev husky lint-staged

# Husky 초기화
npx husky init
```

`.husky/pre-commit` 파일:

```bash
npx lint-staged
```

`package.json`에 추가:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## package.json 스크립트

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
    "typecheck": "tsc --noEmit",
    "build:dev": "eas build --profile development --platform all",
    "build:preview": "eas build --profile preview --platform all",
    "build:prod": "eas build --profile production --platform all",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android"
  }
}
```

## 초기 세팅 체크리스트

- [ ] Node.js 및 npm 설치 확인
- [ ] Expo 프로젝트 생성
- [ ] TypeScript 설정 확인
- [ ] ESLint 및 Prettier 설정
- [ ] VS Code 확장 및 설정
- [ ] EAS CLI 설치 및 로그인
- [ ] eas.json 설정
- [ ] app.config.js 설정
- [ ] 필수 패키지 설치
- [ ] Git 초기화 및 .gitignore 설정
- [ ] Apple Developer 계정 준비 (iOS 배포 시)
- [ ] Google Play Developer 계정 준비 (Android 배포 시)

## 참고 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [EAS Build 설정 가이드](https://docs.expo.dev/build/eas-json/)
- [Expo Router 문서](https://docs.expo.dev/router/introduction/)
