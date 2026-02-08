import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, useWindowDimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import BottomSheet, { BottomSheetScrollView, BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, interpolate, Extrapolation } from 'react-native-reanimated';
import { screenPadding, shadows, layout } from '../../constants';
import { getSafeTop } from '../../utils/safeArea';
import SearchBar from '../../components/home/SearchBar';
import GroupsButton from '../../components/home/GroupsButton';
import MyBadge from '../../components/home/MyBadge';
import FilterBadge from '../../components/home/FilterBadge';
import OnePassButton from '../../components/home/OnePassButton';
import EventCard from '../../components/home/EventCard';
import TransitCard from '../../components/home/TransitCard';
import { StarsIcon } from '../../components/icons';
import { EventDetailBottomSheet, EventDetailData, RegistrationModal, RegistrationModalState, RegistrationStatus } from '../../components/event';
import { registerForEvent, cancelRegistration, listEvents } from '../../services/events';
import { EventWithStatus } from '../../types/event';
import { ApiError, User } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Helper to format date for display
const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper to format registration open date
const formatOpensAt = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function HomeScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const eventDetailRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = (user as User | null)?.role === 'admin';

  const [events, setEvents] = useState<EventWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventDetailData | null>(null);
  const [registrationModalState, setRegistrationModalState] = useState<RegistrationModalState>(null);

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await listEvents({ filter: 'upcoming' });
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Animation for top section visibility
  const isDetailOpen = useSharedValue(0);

  // Top section slide up animation
  const topSectionAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - isDetailOpen.value,
      transform: [
        { translateY: interpolate(isDetailOpen.value, [0, 1], [0, -100], Extrapolation.CLAMP) }
      ],
    };
  });

  // Transit card fade in animation
  const transitCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: isDetailOpen.value,
      transform: [
        { translateY: interpolate(isDetailOpen.value, [0, 1], [-20, 0], Extrapolation.CLAMP) }
      ],
    };
  });

  const handleEventPress = useCallback((event: EventWithStatus) => {
    const eventDetail: EventDetailData = {
      id: event.id,
      title: event.title,
      date: formatEventDate(event.event_date),
      isOfficial: event.event_type === 'official',
      isFree: event.cost_type === 'free',
      isPrepaid: event.cost_type === 'prepaid',
      prepaidAmount: event.cost_amount ? Number(event.cost_amount) : undefined,
      hasChangeNotice: false, // TODO: Add change notice tracking
      registrationPeriod: {
        start: formatEventDate(event.registration_start),
        end: formatEventDate(event.registration_end),
      },
      cost: event.cost_type === 'free' ? 'FREE' : event.cost_amount ? `${Number(event.cost_amount).toLocaleString()} KRW` : undefined,
      address: event.event_location || undefined,
      description: event.description || undefined,
      availableSlots: event.max_slots - event.current_slots,
      providedBy: {
        name: event.club.name,
        logo: event.club.logo_image || undefined,
      },
      postedBy: {
        name: event.posted_by.username,
        avatar: event.posted_by.profile_image || undefined,
      },
      transitTimes: {
        publicTransit: '15 min', // TODO: Calculate from location
        car: '10 min',
        walk: '25 min',
      },
      status: event.user_status as RegistrationStatus,
      opensAt: event.user_status === 'upcoming' ? formatOpensAt(event.registration_start) : undefined,
      registrationId: event.user_registration_id || undefined,
    };
    setSelectedEvent(eventDetail);
  }, []);

  const handleCloseEventDetail = useCallback(() => {
    eventDetailRef.current?.close();
    setSelectedEvent(null);
  }, []);

  const handleRegister = useCallback(async () => {
    if (!selectedEvent) return;

    // For prepaid events, show confirmation dialog first
    if (selectedEvent.isPrepaid) {
      setRegistrationModalState('prepaid_confirm');
      return;
    }

    // Show loading state
    setRegistrationModalState('loading');

    try {
      // Try to call the actual API
      await registerForEvent(String(selectedEvent.id));
      setRegistrationModalState('completed');
    } catch (error) {
      const apiError = error as ApiError;
      // Check if slots are full
      if (apiError.detail === 'Event is full') {
        setRegistrationModalState('slots_full');
      } else {
        // For other errors (network, auth, etc.), show slots_full as fallback
        // In production, you might want different error handling
        console.error('Registration error:', apiError.detail);
        setRegistrationModalState('slots_full');
      }
    }
  }, [selectedEvent]);

  // Prepaid registration handlers
  const handlePrepaidBack = useCallback(() => {
    setRegistrationModalState(null);
  }, []);

  const handlePrepaidConfirm = useCallback(async () => {
    if (!selectedEvent) return;

    setRegistrationModalState('loading');

    try {
      await registerForEvent(String(selectedEvent.id));
      // Calculate payment deadline (24 hours from now)
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      setSelectedEvent(prev => prev ? { ...prev, paymentDeadline: deadline, status: 'payment_pending' as const } : null);
      setRegistrationModalState('prepaid_completed');
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.detail === 'Event is full') {
        setRegistrationModalState('slots_full');
      } else {
        console.error('Registration error:', apiError.detail);
        setRegistrationModalState('error');
      }
    }
  }, [selectedEvent]);

  const handleCloseRegistrationModal = useCallback(() => {
    const wasSuccessful = registrationModalState === 'completed' || registrationModalState === 'cancel_completed';
    setRegistrationModalState(null);

    // If registration or cancellation was successful, close the event detail as well
    if (wasSuccessful) {
      handleCloseEventDetail();
    }
  }, [registrationModalState, handleCloseEventDetail]);

  // Cancel flow handlers
  const handleCancelPress = useCallback(() => {
    // Show cancel confirmation dialog
    setRegistrationModalState('cancel_confirm');
  }, []);

  const handleCancelBack = useCallback(() => {
    // Go back from cancel confirmation
    setRegistrationModalState(null);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!selectedEvent?.registrationId) return;

    // Show cancel loading state
    setRegistrationModalState('cancel_loading');

    try {
      await cancelRegistration(String(selectedEvent.registrationId));
      setRegistrationModalState('cancel_completed');
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Cancellation error:', apiError.detail);
      setRegistrationModalState('error');
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      // Animate top section out and transit card in
      isDetailOpen.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      // 약간의 딜레이 후 present (컴포넌트 마운트 대기)
      const timer = setTimeout(() => {
        eventDetailRef.current?.present();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Animate back
      isDetailOpen.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [selectedEvent, isDetailOpen]);

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
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <Animated.View style={[styles.mapContainer, mapAnimatedStyle]}>
          <NaverMapView
          style={styles.map}
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
        </Animated.View>
        {/* Top Section - slides up when detail opens */}
        <Animated.View style={[styles.topSection, { top: getSafeTop(insets) }, topSectionAnimatedStyle]}>
          <View style={styles.topBar}>
            <View style={styles.searchBarContainer}>
              <SearchBar />
            </View>
            <GroupsButton />
            <MyBadge />
            {isAdmin && (
              <TouchableOpacity
                style={styles.adminAddButton}
                onPress={() => navigation.navigate('AdminCreateEvent')}
              >
                <Text style={styles.adminAddButtonText}>+</Text>
              </TouchableOpacity>
            )}
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
        </Animated.View>

        {/* Transit Card - appears when detail opens */}
        <Animated.View style={[styles.transitCardOverlay, { top: getSafeTop(insets) }, transitCardAnimatedStyle]} pointerEvents={selectedEvent ? 'auto' : 'none'}>
          <TransitCard
            publicTransitTime={selectedEvent?.transitTimes?.publicTransit}
            carTime={selectedEvent?.transitTimes?.car}
            walkTime={selectedEvent?.transitTimes?.walk}
          />
        </Animated.View>
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
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#03CA5B" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={formatEventDate(event.event_date)}
                provider={event.club.name}
                status={event.user_status}
                opensAt={event.user_status === 'upcoming' ? formatOpensAt(event.registration_start) : undefined}
                participantCount={event.current_slots}
                onPress={() => handleEventPress(event)}
              />
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheet>

{selectedEvent && (
          <EventDetailBottomSheet
            ref={eventDetailRef}
            event={selectedEvent}
            onClose={handleCloseEventDetail}
            onRegister={handleRegister}
            onCancelRegistration={handleCancelPress}
            onOnePass={() => console.log('OnePass pressed - navigate to ticket')}
            onFindWay={() => console.log('Find way pressed')}
          />
        )}

        <RegistrationModal
          visible={registrationModalState !== null}
          state={registrationModalState}
          onClose={handleCloseRegistrationModal}
          onCancelConfirm={handleCancelConfirm}
          onCancelBack={handleCancelBack}
          onPrepaidConfirm={handlePrepaidConfirm}
          onPrepaidBack={handlePrepaidBack}
          paymentDeadline={selectedEvent?.paymentDeadline}
        />
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
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
  transitCardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  adminAddButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  adminAddButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
});
