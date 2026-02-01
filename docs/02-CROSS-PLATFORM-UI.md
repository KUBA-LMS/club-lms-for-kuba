# iOS/Android 플랫폼별 UI 처리 가이드

## 개요

iOS와 Android는 각각 다른 디자인 가이드라인과 시스템 동작을 가진다. 이 문서에서는 두 플랫폼 간의 차이점을 이해하고, 일관성 있으면서도 각 플랫폼에 자연스러운 UI를 구현하는 방법을 다룬다.

## 주요 플랫폼 차이점

### 1. 그림자 (Shadow)

iOS와 Android는 그림자 처리 방식이 완전히 다르다.

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

### 2. 상태바 및 Safe Area

```typescript
import { Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Safe Area 사용
function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      {/* 컨텐츠 */}
    </View>
  );
}

// StatusBar 처리
function AppStatusBar() {
  return (
    <StatusBar
      barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
      backgroundColor={Platform.OS === 'android' ? '#000000' : undefined}
    />
  );
}
```

### 3. 폰트 및 텍스트

```typescript
const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    // Android는 일부 fontWeight만 지원
    fontWeight: Platform.select({
      ios: '600',
      android: 'bold', // Android는 'normal' 또는 'bold'만 확실히 지원
    }),
  },
});
```

### 4. 터치 피드백

```typescript
import {
  Platform,
  TouchableOpacity,
  TouchableNativeFeedback,
  View
} from 'react-native';

// 플랫폼별 터치 피드백 컴포넌트
function Touchable({ children, onPress, style }) {
  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={onPress}
        background={TouchableNativeFeedback.Ripple('#00000020', false)}
      >
        <View style={style}>{children}</View>
      </TouchableNativeFeedback>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}
```

### 5. 키보드 처리

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

function FormScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={{ flex: 1 }}
    >
      {/* 폼 컨텐츠 */}
    </KeyboardAvoidingView>
  );
}
```

### 6. 네비게이션 패턴

| 요소 | iOS | Android |
|------|-----|---------|
| 뒤로가기 | 좌측 상단 버튼, 엣지 스와이프 | 시스템 백버튼, 좌측 상단 버튼 |
| 탭바 위치 | 하단 | 상단 또는 하단 |
| 모달 애니메이션 | 아래에서 위로 슬라이드 | 페이드 또는 슬라이드 |

```typescript
// React Navigation 예시
const screenOptions = {
  headerShown: true,
  ...Platform.select({
    ios: {
      headerLargeTitle: true,
    },
    android: {
      headerTitleAlign: 'center',
    },
  }),
};
```

## 플랫폼별 코드 분리 방법

### 방법 1: Platform.select() 사용

간단한 값 분기에 적합하다.

```typescript
import { Platform } from 'react-native';

const containerPadding = Platform.select({
  ios: 20,
  android: 16,
  default: 16,
});

const buttonStyle = Platform.select({
  ios: {
    borderRadius: 10,
    paddingVertical: 12,
  },
  android: {
    borderRadius: 4,
    paddingVertical: 10,
  },
});
```

### 방법 2: Platform.OS 조건문

로직 분기가 필요한 경우 사용한다.

```typescript
import { Platform } from 'react-native';

function handleNotification() {
  if (Platform.OS === 'ios') {
    // iOS 전용 알림 처리
    requestIOSPermission();
  } else {
    // Android 전용 알림 처리
    createAndroidChannel();
  }
}
```

### 방법 3: 플랫폼별 파일 분리

복잡한 컴포넌트나 로직은 파일을 분리한다. React Native가 자동으로 올바른 파일을 로드한다.

```
src/
  components/
    Button/
      index.ts          # re-export
      Button.tsx        # 공통 타입 및 로직
      Button.ios.tsx    # iOS 전용 구현
      Button.android.tsx # Android 전용 구현
```

`index.ts`:
```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

`Button.ios.tsx`:
```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ButtonProps } from './Button';

export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  text: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

`Button.android.tsx`:
```typescript
import { TouchableNativeFeedback, View, Text, StyleSheet } from 'react-native';
import { ButtonProps } from './Button';

export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableNativeFeedback onPress={onPress}>
      <View style={styles.button}>
        <Text style={styles.text}>{title}</Text>
      </View>
    </TouchableNativeFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6200EE',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
```

## 디자인 시스템 구축

플랫폼 차이를 한 곳에서 관리하기 위해 디자인 시스템을 구축한다.

### 테마 파일 구조

```
src/
  theme/
    index.ts
    colors.ts
    spacing.ts
    typography.ts
    shadows.ts
    platform.ts
```

### colors.ts

```typescript
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',

  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
  },

  text: {
    primary: '#000000',
    secondary: '#6B6B6B',
    disabled: '#C7C7CC',
  },

  border: '#E5E5EA',
};
```

### spacing.ts

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### shadows.ts

```typescript
import { Platform, ViewStyle } from 'react-native';

type ShadowLevel = 'sm' | 'md' | 'lg';

export const shadows: Record<ShadowLevel, ViewStyle> = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }) as ViewStyle,

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }) as ViewStyle,

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,
};
```

### typography.ts

```typescript
import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
});

export const typography: Record<string, TextStyle> = {
  h1: {
    fontFamily,
    fontSize: 32,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    lineHeight: 40,
  },
  h2: {
    fontFamily,
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    lineHeight: 32,
  },
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
  },
};
```

### index.ts (테마 통합)

```typescript
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './shadows';

import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  shadows,
};

export type Theme = typeof theme;
```

## 공통 컴포넌트 라이브러리

### 추천 UI 라이브러리

| 라이브러리 | 특징 | 적합한 경우 |
|------------|------|-------------|
| Tamagui | 고성능, 컴파일 타임 최적화 | 성능 중시, 커스텀 디자인 |
| NativeBase | 접근성 우수, 유틸리티 우선 | 빠른 개발, 다양한 컴포넌트 필요 |
| React Native Paper | Material Design 기반 | Android 중심 디자인 |
| React Native Elements | 범용적, 커스터마이징 쉬움 | 간단한 프로젝트 |

### 직접 구현 시 기본 컴포넌트

```typescript
// src/components/ui/Text.tsx
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, colors } from '@/theme';

interface TextProps extends RNTextProps {
  variant?: keyof typeof typography;
  color?: keyof typeof colors.text;
}

export function Text({
  variant = 'body',
  color = 'primary',
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        { color: colors.text[color] },
        style,
      ]}
      {...props}
    />
  );
}
```

## 테스트 전략

### 양 플랫폼 테스트 필수 항목

1. Safe Area 처리 (노치, 홈 인디케이터)
2. 키보드 동작 (입력 필드 가림 여부)
3. 터치 피드백 (리플, 투명도)
4. 폰트 렌더링 (굵기, 크기)
5. 그림자 표시
6. 네비게이션 제스처
7. 상태바 스타일

### 테스트 환경 구성

```bash
# iOS 시뮬레이터 (다양한 기기)
# - iPhone SE (작은 화면)
# - iPhone 15 Pro (노치)
# - iPhone 15 Pro Max (큰 화면)
# - iPad (태블릿)

# Android 에뮬레이터
# - Pixel 4 (표준)
# - Pixel Fold (폴더블)
# - 저사양 기기 (성능 테스트)
```

### 실기기 테스트

시뮬레이터/에뮬레이터만으로는 한계가 있다. 다음 항목은 반드시 실기기에서 테스트한다:

- 제스처 반응 속도
- 실제 성능 (애니메이션 프레임)
- 카메라, 센서 연동
- 푸시 알림

## 흔한 실수와 해결책

### 1. 하드코딩된 높이값

```typescript
// Bad
const styles = StyleSheet.create({
  header: {
    height: 44, // iOS에서는 괜찮지만 Android에서는 다를 수 있음
  },
});

// Good
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 44 : 56,
  },
});
```

### 2. 그림자 누락

```typescript
// Bad - Android에서 그림자 안 보임
const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

// Good
const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

### 3. Safe Area 무시

```typescript
// Bad
function Screen() {
  return (
    <View style={{ flex: 1 }}>
      <Header /> {/* 노치에 가려질 수 있음 */}
    </View>
  );
}

// Good
import { SafeAreaView } from 'react-native-safe-area-context';

function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header />
    </SafeAreaView>
  );
}
```

## 체크리스트

### 개발 시작 전

- [ ] 디자인 시스템 (테마) 구축
- [ ] 플랫폼별 분기 전략 결정
- [ ] 공통 컴포넌트 설계

### 컴포넌트 개발 시

- [ ] Platform.select 또는 파일 분리 사용
- [ ] Safe Area 처리
- [ ] 그림자 양 플랫폼 대응
- [ ] 터치 피드백 확인

### 배포 전

- [ ] iOS 시뮬레이터 테스트 (다양한 기기)
- [ ] Android 에뮬레이터 테스트
- [ ] 실기기 테스트 (iOS, Android 각 1대 이상)
- [ ] 다크모드 대응 확인

## 참고 자료

- [React Native Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://m3.material.io/)
- [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
