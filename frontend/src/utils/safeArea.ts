import { EdgeInsets } from 'react-native-safe-area-context';
import { layout } from '../constants';

/**
 * Safe area 유틸리티 함수들
 * - iOS: 노치, Dynamic Island, 홈 인디케이터
 * - Android: 상태바, 카메라 cutout(펀치홀/노치), 네비게이션 바
 */

// 상단 safe area + 추가 여백
export const getSafeTop = (insets: EdgeInsets, additionalPadding = layout.safeArea.topPadding) => {
  return Math.max(insets.top, layout.safeArea.minTop) + additionalPadding;
};

// 하단 safe area (탭바 있는 경우 탭바가 처리하므로 0)
export const getSafeBottom = (insets: EdgeInsets, hasTabBar = false) => {
  if (hasTabBar) return 0;
  return Math.max(insets.bottom, 0);
};

// 좌우 safe area (폴더블, 가로모드 대응)
export const getSafeHorizontal = (insets: EdgeInsets) => {
  return {
    left: Math.max(insets.left, 0),
    right: Math.max(insets.right, 0),
  };
};

// 전체 safe area padding 객체 반환
export const getSafePadding = (
  insets: EdgeInsets,
  options?: {
    hasTabBar?: boolean;
    additionalTop?: number;
    additionalBottom?: number;
  }
) => {
  const { hasTabBar = false, additionalTop = layout.safeArea.topPadding, additionalBottom = 0 } = options || {};

  return {
    paddingTop: getSafeTop(insets, additionalTop),
    paddingBottom: getSafeBottom(insets, hasTabBar) + additionalBottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
};
