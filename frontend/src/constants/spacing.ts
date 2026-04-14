import { Platform } from 'react-native';

export const spacing = {
  // Base spacing scale
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const screenPadding = {
  horizontal: 20,
  vertical: 16,
};

export const layout = {
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Component specific
  cardPadding: 16,
  cardRadius: 15,
  buttonHeight: 48,
  inputHeight: 44,
  tabBarHeight: 80,
  headerHeight: 56,

  // Safe area fallback (Android cutout, 구형 기기 등 대비)
  // Android는 펀치홀/노치 크기가 기기마다 다양해서 더 큰 값 필요
  safeArea: Platform.select({
    ios: {
      minTop: 20,       // iOS 상태바 기본 높이
      topPadding: 12,
    },
    android: {
      minTop: 44,       // Android 펀치홀/노치 대응 (Galaxy S 시리즈 등)
      topPadding: 8,
    },
    default: {
      minTop: 24,
      topPadding: 12,
    },
  }) as { minTop: number; topPadding: number },
};
