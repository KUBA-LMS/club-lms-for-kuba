import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants';

interface ScreenWrapperProps {
  children: React.ReactNode;
  // Safe area 옵션
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  // 탭바 있는 화면인지 (bottom padding 자동 추가)
  hasTabBar?: boolean;
  // 배경색
  backgroundColor?: string;
  // 추가 스타일
  style?: ViewStyle;
}

export default function ScreenWrapper({
  children,
  edges = ['top', 'bottom'],
  hasTabBar = false,
  backgroundColor = colors.white,
  style,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const paddingStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom')
      ? (hasTabBar ? 0 : insets.bottom)  // 탭바가 이미 bottom 처리함
      : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.container, { backgroundColor }, paddingStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
