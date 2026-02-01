# Expo React Native 프로젝트 구조 가이드

## 개요

확장 가능하고 유지보수하기 쉬운 프로젝트 구조는 장기적인 개발 생산성에 직접적인 영향을 미친다. 이 문서에서는 프로덕션 레벨의 Expo 프로젝트에 적합한 폴더 구조와 파일 구성 방법을 다룬다.

## 권장 프로젝트 구조

### Expo Router 사용 시 (권장)

```
my-app/
├── app/                      # Expo Router 페이지 (파일 기반 라우팅)
│   ├── (auth)/               # 인증 관련 라우트 그룹
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/               # 탭 네비게이션 그룹
│   │   ├── index.tsx         # 홈 탭
│   │   ├── search.tsx        # 검색 탭
│   │   ├── profile.tsx       # 프로필 탭
│   │   └── _layout.tsx       # 탭 레이아웃
│   ├── settings/
│   │   ├── index.tsx
│   │   └── [id].tsx          # 동적 라우트
│   ├── _layout.tsx           # 루트 레이아웃
│   └── +not-found.tsx        # 404 페이지
│
├── src/
│   ├── components/           # 재사용 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Text.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── forms/            # 폼 관련 컴포넌트
│   │   │   ├── LoginForm.tsx
│   │   │   └── index.ts
│   │   └── layouts/          # 레이아웃 컴포넌트
│   │       ├── Container.tsx
│   │       └── index.ts
│   │
│   ├── features/             # 기능별 모듈 (Feature-based)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── posts/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   └── profile/
│   │       └── ...
│   │
│   ├── hooks/                # 공통 커스텀 훅
│   │   ├── useDebounce.ts
│   │   ├── useAsync.ts
│   │   └── index.ts
│   │
│   ├── services/             # API 및 외부 서비스
│   │   ├── api/
│   │   │   ├── client.ts     # Axios 인스턴스
│   │   │   ├── auth.ts
│   │   │   ├── posts.ts
│   │   │   └── index.ts
│   │   └── storage/
│   │       └── secureStore.ts
│   │
│   ├── stores/               # 상태 관리
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   │
│   ├── theme/                # 디자인 시스템
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   │
│   ├── types/                # 전역 타입 정의
│   │   ├── api.ts
│   │   ├── navigation.ts
│   │   └── index.ts
│   │
│   ├── utils/                # 유틸리티 함수
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   └── constants/            # 상수
│       ├── config.ts
│       └── index.ts
│
├── assets/                   # 정적 에셋
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── .vscode/                  # VS Code 설정
│   ├── settings.json
│   └── extensions.json
│
├── app.config.js             # Expo 설정
├── eas.json                  # EAS 빌드 설정
├── tsconfig.json             # TypeScript 설정
├── .eslintrc.js              # ESLint 설정
├── .prettierrc               # Prettier 설정
├── babel.config.js           # Babel 설정
└── package.json
```

## 폴더별 상세 설명

### app/ - Expo Router 페이지

Expo Router는 파일 시스템 기반 라우팅을 제공한다.

**라우트 그룹 (괄호)**
```
app/
├── (auth)/           # URL에 포함되지 않는 그룹
│   ├── login.tsx     # /login
│   └── register.tsx  # /register
├── (tabs)/           # 탭 네비게이션 그룹
│   └── index.tsx     # /
```

**동적 라우트**
```
app/
├── posts/
│   ├── index.tsx     # /posts
│   └── [id].tsx      # /posts/123
├── users/
│   └── [...slug].tsx # /users/a/b/c (catch-all)
```

**레이아웃 파일**
```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### src/components/ - 컴포넌트

**ui/**: 기본 UI 컴포넌트 (Button, Text, Input 등)
```typescript
// src/components/ui/Button.tsx
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], style]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
```

**index.ts 배럴 파일**
```typescript
// src/components/ui/index.ts
export { Button } from './Button';
export { Text } from './Text';
export { Input } from './Input';
```

### src/features/ - 기능 모듈

Feature-based 구조로 관련 코드를 응집시킨다.

```
src/features/auth/
├── components/
│   ├── LoginButton.tsx
│   └── AuthProvider.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useLogin.ts
├── services/
│   └── authService.ts
├── types.ts
└── index.ts
```

**장점:**
- 관련 코드가 한 곳에 모여 있어 찾기 쉬움
- 기능 단위로 독립적 개발 가능
- 기능 삭제 시 폴더만 삭제하면 됨

### src/services/api/ - API 클라이언트

```typescript
// src/services/api/client.ts
import axios from 'axios';
import { getToken } from '../storage/secureStore';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.example.com';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
    }
    return Promise.reject(error);
  }
);
```

```typescript
// src/services/api/auth.ts
import { apiClient } from './client';
import { LoginRequest, LoginResponse, User } from '@/types/api';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  logout: () =>
    apiClient.post('/auth/logout'),

  getProfile: () =>
    apiClient.get<User>('/auth/profile'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<LoginResponse>('/auth/refresh', { refreshToken }),
};
```

### src/stores/ - 상태 관리

Zustand 사용 예시:

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### src/hooks/ - 커스텀 훅

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

```typescript
// src/hooks/useAsync.ts
import { useState, useCallback } from 'react';

interface UseAsyncReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (...args: any[]) => Promise<void>;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await asyncFunction(...args);
        setData(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  return { data, error, isLoading, execute };
}
```

### src/types/ - 타입 정의

```typescript
// src/types/api.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

```typescript
// src/types/navigation.ts
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'posts/[id]': { id: string };
  settings: undefined;
};
```

## 경로 별칭 (Path Alias) 설정

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/stores/*": ["src/stores/*"],
      "@/theme/*": ["src/theme/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/constants/*": ["src/constants/*"]
    }
  }
}
```

### babel.config.js

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
```

```bash
# module-resolver 설치
npm install --save-dev babel-plugin-module-resolver
```

## 파일 네이밍 컨벤션

### 컴포넌트

| 유형 | 파일명 | 예시 |
|------|--------|------|
| 컴포넌트 | PascalCase.tsx | `Button.tsx`, `UserProfile.tsx` |
| 플랫폼별 | Name.platform.tsx | `Button.ios.tsx`, `Button.android.tsx` |
| 테스트 | Name.test.tsx | `Button.test.tsx` |
| 스토리 | Name.stories.tsx | `Button.stories.tsx` |

### 비컴포넌트 파일

| 유형 | 파일명 | 예시 |
|------|--------|------|
| 훅 | camelCase.ts | `useAuth.ts`, `useDebounce.ts` |
| 유틸리티 | camelCase.ts | `format.ts`, `validation.ts` |
| 상수 | camelCase.ts | `config.ts`, `routes.ts` |
| 타입 | camelCase.ts | `api.ts`, `navigation.ts` |
| 서비스 | camelCase.ts | `authService.ts` |

### 폴더

- 소문자와 하이픈 사용: `user-profile/`, `auth-flow/`
- 또는 소문자만: `components/`, `hooks/`

## 코드 구성 원칙

### 1. Colocation (관련 코드 근접 배치)

관련된 코드는 가까이 둔다:

```
features/auth/
├── components/     # auth 전용 컴포넌트
├── hooks/          # auth 전용 훅
├── services/       # auth 전용 API
└── types.ts        # auth 전용 타입
```

### 2. 재사용성에 따른 분리

| 위치 | 재사용 범위 |
|------|-------------|
| src/components/ui/ | 앱 전체에서 사용하는 기본 컴포넌트 |
| src/hooks/ | 앱 전체에서 사용하는 훅 |
| features/xxx/components/ | 해당 기능에서만 사용하는 컴포넌트 |
| features/xxx/hooks/ | 해당 기능에서만 사용하는 훅 |

### 3. 배럴 파일 (index.ts) 활용

```typescript
// src/components/ui/index.ts
export { Button } from './Button';
export { Text } from './Text';
export { Input } from './Input';

// 사용
import { Button, Text, Input } from '@/components/ui';
```

### 4. 단일 책임 원칙

각 파일/폴더는 하나의 명확한 역할을 가진다:

```
// 좋음
services/api/auth.ts    # 인증 API만
services/api/posts.ts   # 게시물 API만

// 피해야 함
services/api.ts         # 모든 API가 하나의 파일에
```

## 확장 시 고려사항

### 프로젝트가 커질 때

1. **features/ 폴더 세분화**
   ```
   features/
   ├── auth/
   ├── posts/
   ├── comments/
   ├── notifications/
   └── settings/
   ```

2. **공통 모듈 분리**
   ```
   src/
   ├── shared/           # 공통 모듈
   │   ├── components/
   │   ├── hooks/
   │   └── utils/
   └── features/
   ```

3. **모듈별 라우트 그룹**
   ```
   app/
   ├── (auth)/
   ├── (main)/
   │   ├── (tabs)/
   │   └── (modals)/
   └── (admin)/
   ```

### 모노레포 전환 시

```
packages/
├── app/              # Expo 앱
├── web/              # Next.js 웹 (선택)
├── ui/               # 공유 UI 컴포넌트
├── api-client/       # 공유 API 클라이언트
└── utils/            # 공유 유틸리티
```

## 체크리스트

### 초기 설정

- [ ] 폴더 구조 생성
- [ ] 경로 별칭 설정 (tsconfig.json, babel.config.js)
- [ ] 기본 타입 정의
- [ ] 테마/디자인 시스템 설정
- [ ] API 클라이언트 설정

### 개발 시

- [ ] 새 기능은 features/ 폴더에 생성
- [ ] 재사용 컴포넌트는 components/ui/에 배치
- [ ] 배럴 파일(index.ts) 유지
- [ ] 타입 정의 누락 없이 작성

### 리팩토링 시점

- [ ] 파일이 300줄 이상 -> 분리 고려
- [ ] 같은 코드 3번 이상 반복 -> 공통화
- [ ] features/ 폴더가 너무 커짐 -> 세분화

## 참고 자료

- [Expo Router 문서](https://docs.expo.dev/router/introduction/)
- [Expo 폴더 구조 가이드](https://expo.dev/blog/expo-app-folder-structure-best-practices)
- [React Native 프로젝트 구조](https://reactnativeexample.com/react-native-project-structure-template-guide-2025/)
- [Feature-Sliced Design](https://feature-sliced.design/)
