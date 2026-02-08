import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Text, useWindowDimensions, ScrollView } from 'react-native';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { screenPadding, shadows, layout } from '../../constants';
import { getSafeTop } from '../../utils/safeArea';
import SearchBar from '../../components/home/SearchBar';
import GroupsButton from '../../components/home/GroupsButton';
import MyBadge from '../../components/home/MyBadge';
import FilterBadge from '../../components/home/FilterBadge';
import { StarsIcon } from '../../components/icons';

const AnimatedNaverMapView = Animated.createAnimatedComponent(NaverMapView);

export default function HomeScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // 바텀시트 위치 추적
  const animatedPosition = useSharedValue(0);

  // 바텀시트가 멈추는 지점들
  const snapPoints = useMemo(() => ['9%', '25%', '40%', '60%'], []);

  // 탭바 높이(80) + bottom safe area
  const bottomPadding = layout.tabBarHeight + insets.bottom;

  // 지도 translateY 계산 (바텀시트가 올라갈수록 지도도 위로)
  const mapAnimatedStyle = useAnimatedStyle(() => {
    // animatedPosition은 바텀시트 상단의 y 좌표 (화면 하단에서부터의 거리)
    // 바텀시트가 올라가면 position 값이 작아짐
    const sheetHeight = screenHeight - animatedPosition.value;
    const baseHeight = screenHeight * 0.09; // 최소 snapPoint (9%)
    const maxOffset = screenHeight * 0.3; // 최대 이동량

    // 바텀시트 높이에 비례해서 지도 이동 (0.3 비율로 부드럽게)
    const translateY = -Math.min((sheetHeight - baseHeight) * 0.3, maxOffset);

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.container}>
      <AnimatedNaverMapView
        style={[styles.map, mapAnimatedStyle]}
        initialCamera={{
          latitude: 37.5866076,
          longitude: 127.0291003,
          zoom: 15,
        }}
        isShowLocationButton={false}
        isShowZoomControls={false}
        isShowCompass={false}
        isShowScaleBar={false}
      />
      <View style={[styles.topSection, { top: getSafeTop(insets) }]}>
        <View style={styles.topBar}>
          <View style={styles.searchBarContainer}>
            <SearchBar />
          </View>
          <GroupsButton />
          <MyBadge />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <FilterBadge
            label="Bookmark"
            icon={<StarsIcon size={16} />}
          />
          <FilterBadge
            label="46th_KUBA"
            imageUri="https://via.placeholder.com/20"
          />
          <FilterBadge
            label="46th_KUBA_Group_8"
            imageUri="https://via.placeholder.com/20"
          />
        </ScrollView>
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        animatedPosition={animatedPosition}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sectionTitle}>주변 이벤트</Text>
        </View>
        <BottomSheetScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
          {/* 카드뉴스 목록 */}
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <View key={item} style={styles.card}>
              <View style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>이벤트 제목 {item}</Text>
                <Text style={styles.cardDescription}>
                  동아리 행사 설명이 들어갑니다. 간단한 내용 미리보기...
                </Text>
                <Text style={styles.cardDate}>2026.02.15</Text>
              </View>
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    gap: 11.5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: screenPadding.horizontal,
  },
  searchBarContainer: {
    flex: 1,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: screenPadding.horizontal,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    ...shadows.xl,
  },
  handleIndicator: {
    backgroundColor: '#CCCCCC',
    width: 40,
  },
  sheetHeader: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: screenPadding.vertical,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: screenPadding.horizontal,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.borderRadius.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    minHeight: 100,
    backgroundColor: '#DDDDDD',
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    padding: layout.borderRadius.md,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    lineHeight: 16,
    color: '#999999',
  },
});
