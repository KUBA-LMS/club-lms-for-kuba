import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Text, useWindowDimensions, ScrollView, TouchableOpacity } from 'react-native';
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
import OnePassButton from '../../components/home/OnePassButton';
import EventCard from '../../components/home/EventCard';
import { StarsIcon } from '../../components/icons';

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'KUBA 45th Orientation',
    date: 'Aug 28, 2025',
    provider: '45th_KUBA',
    status: 'registered' as const,
  },
  {
    id: 2,
    title: 'KUBA 45th Orientation After Party',
    date: 'Aug 28, 2025',
    provider: '45th_KUBA_Group_8',
    status: 'open' as const,
  },
  {
    id: 3,
    title: 'KUBA 45th Cheering Orientation',
    date: 'Aug 31, 2025',
    provider: '45th_KUBA',
    status: 'requested' as const,
  },
  {
    id: 4,
    title: 'KUBA Club Party',
    date: 'Nov 20, 2025',
    provider: '45th_KUBA',
    status: 'closed' as const,
  },
  {
    id: 5,
    title: 'KUBA Group 8 lunch gathering',
    date: 'Nov 28, 2025',
    provider: '45th_KUBA',
    status: 'upcoming' as const,
    opensAt: 'Nov 1st, 2026',
  },
];

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
          <View style={styles.onePassContainer}>
            <OnePassButton onPress={() => {}} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sheetFilterContent}
            style={styles.sheetFilterScroll}
          >
            <TouchableOpacity style={[styles.sheetFilterChip, styles.sheetFilterChipActive]}>
              <Text style={[styles.sheetFilterText, styles.sheetFilterTextActive]}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetFilterChip, styles.sheetFilterChipActive]}>
              <Text style={[styles.sheetFilterText, styles.sheetFilterTextActive]}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetFilterChip}>
              <Text style={styles.sheetFilterText}>Distance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetFilterChip}>
              <Text style={styles.sheetFilterText}>Recommended</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <BottomSheetScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
          {MOCK_EVENTS.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={event.date}
              provider={event.provider}
              status={event.status}
              opensAt={event.opensAt}
              participantCount={4}
            />
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
    paddingTop: screenPadding.vertical,
    paddingBottom: 12,
    gap: 12,
  },
  onePassContainer: {
    paddingHorizontal: screenPadding.horizontal,
  },
  sheetFilterScroll: {
    flexGrow: 0,
  },
  sheetFilterContent: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    flex: 1,
  },
  sheetFilterChip: {
    width: 70,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10.5,
    borderWidth: 0.7,
    borderColor: '#C5C5C5',
    backgroundColor: '#E5E5EA',
  },
  sheetFilterChipActive: {
    backgroundColor: '#8E8E93',
    borderColor: '#8E8E93',
  },
  sheetFilterText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 9,
    color: '#000000',
    textAlign: 'center',
  },
  sheetFilterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: screenPadding.horizontal,
  },
});
