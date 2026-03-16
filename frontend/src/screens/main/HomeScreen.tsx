import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Linking,
} from "react-native";
import { NaverMapView, NaverMapViewRef, NaverMapMarkerOverlay } from "../../components/Map";
import EventMarkers from "../../components/Map/EventMarkers";
import { LocationMarkerIcon } from "../../components/Map/LocationMarkerIcon";
import MyLocationButton from "../../components/Map/MyLocationButton";
import * as Location from "expo-location";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { screenPadding, shadows, layout, colors, typography } from "../../constants";
import { getSafeTop } from "../../utils/safeArea";
import SearchBar from "../../components/home/SearchBar";
import GroupsButton from "../../components/home/GroupsButton";
import MyBadge from "../../components/home/MyBadge";
import FilterBadge from "../../components/home/FilterBadge";
import OnePassButton from "../../components/home/OnePassButton";
import EventCard from "../../components/home/EventCard";
import { StarsIcon } from "../../components/icons";
import SearchDropdown from "../../components/home/SearchDropdown";
import AdminFaceFab, { CalendarPlusIcon, KeyIcon, GridIcon } from "../../components/home/AdminFaceFab";
import Svg, { Path } from "react-native-svg";
import {
  EventDetailBottomSheet,
  EventDetailData,
  RegistrationModal,
  RegistrationModalState,
  RegistrationStatus,
} from "../../components/event";
import ShareBottomSheet from "../../components/event/ShareBottomSheet";
import {
  registerForEvent,
  cancelRegistration,
  listEvents,
  searchEventsAndProviders,
} from "../../services/events";
import { toggleBookmark } from "../../services/bookmarks";
import { storage, SearchHistoryItem } from "../../services/storage";
import { useSearchDebounce } from "../../hooks/useSearchDebounce";
import { useMyClubs } from "../../hooks/useMyClubs";
import { EventWithStatus } from "../../types/event";
import { ApiError, User } from "../../types/auth";
import { useAuth } from "../../context/AuthContext";
import { useUserChannel, useChannel } from "../../hooks/useWebSocket";
import { MainStackParamList } from "../../navigation/types";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

type FilterMode = 'date' | 'distance' | 'recommended';
type EventTimeFilter = 'all' | 'current' | 'past';

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper to format date for display
const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper to format registration open date
const formatOpensAt = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function HomeScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const eventDetailRef = useRef<BottomSheetModal>(null);
  const shareRef = useRef<BottomSheetModal>(null);
  const mapRef = useRef<NaverMapViewRef>(null);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { clubs: myClubs, refresh: refreshClubs } = useMyClubs();

  // Flat list: parent clubs + their subgroups
  const flatClubs = useMemo(() => {
    const list: { id: string; name: string; logo_image: string | null }[] = [];
    for (const club of myClubs) {
      list.push({ id: club.id, name: club.name, logo_image: club.logo_image });
      for (const sub of club.subgroups) {
        list.push({ id: sub.id, name: sub.name, logo_image: sub.logo_image });
      }
    }
    return list;
  }, [myClubs]);

  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const handleToggleClubFilter = useCallback((clubId: string) => {
    setSelectedClubId((prev) => (prev === clubId ? null : clubId));
  }, []);

  // Check if user is admin
  const isAdmin = (user as User | null)?.role === "admin";
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Current location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const handleMyLocation = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateCameraTo({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        duration: 500,
      });
    }
  }, [userLocation]);

  // Search
  const searchInputRef = useRef<TextInput>(null);
  const [searchText, setSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const { results: searchResults, isLoading: isSearchLoading } = useSearchDebounce(
    isSearchFocused ? searchText : "",
    searchEventsAndProviders,
    300,
  );

  const showDropdown = isSearchFocused;

  const activateSearch = useCallback(async () => {
    if (isSearchFocused) return;
    setIsSearchFocused(true);
    const history = await storage.getSearchHistory();
    setSearchHistory(history);
  }, [isSearchFocused]);

  const handleSearchTap = useCallback(() => {
    activateSearch();
    searchInputRef.current?.focus();
  }, [activateSearch]);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    if (!text.trim()) setSearchMatches(null);
    if (!isSearchFocused) activateSearch();
  }, [isSearchFocused, activateSearch]);

  const dismissSearch = useCallback(() => {
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const handleSelectHistory = useCallback((item: SearchHistoryItem) => {
    setSearchText(item.name);
    dismissSearch();
  }, [dismissSearch]);

  const handleRemoveHistory = useCallback(async (timestamp: number) => {
    const updated = await storage.removeSearchHistory(timestamp);
    setSearchHistory(updated);
  }, []);

  const handleClearHistory = useCallback(async () => {
    await storage.clearSearchHistory();
    setSearchHistory([]);
  }, []);

  const [events, setEvents] = useState<EventWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterMode>('date');
  const [eventTimeFilter, setEventTimeFilter] = useState<EventTimeFilter>('current');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [bookmarkFilterActive, setBookmarkFilterActive] = useState(false);
  // null = no search filter active, array = show only these events
  const [searchMatches, setSearchMatches] = useState<EventWithStatus[] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetailData | null>(
    null,
  );
  const [registrationModalState, setRegistrationModalState] =
    useState<RegistrationModalState>(null);
  const [shareEvent, setShareEvent] = useState<EventWithStatus | null>(null);

  const toEventDetail = useCallback((event: EventWithStatus): EventDetailData => ({
    id: event.id,
    title: event.title,
    date: formatEventDate(event.event_date),
    isOfficial: event.event_type === "official",
    isFree: event.cost_type === "free",
    isPrepaid: event.cost_type === "prepaid",
    prepaidAmount: event.cost_amount ? Number(event.cost_amount) : undefined,
    hasChangeNotice: false,
    registrationPeriod: {
      start: formatEventDate(event.registration_start),
      end: formatEventDate(event.registration_end),
    },
    cost:
      event.cost_type === "free"
        ? "FREE"
        : event.cost_amount
          ? `${Number(event.cost_amount).toLocaleString()} KRW`
          : undefined,
    imageUri: event.images?.[0] || undefined,
    address: event.event_location || undefined,
    description: event.description || undefined,
    eventType: event.event_type,
    costType: event.cost_type,
    availableSlots: event.max_slots - event.current_slots,
    providedBy: {
      name: event.club.name,
      logo: event.club.logo_image || undefined,
    },
    postedBy: {
      name: event.posted_by.username,
      avatar: event.posted_by.profile_image || undefined,
    },
    status: (
      event.user_status === 'requested' && event.cost_type === 'prepaid'
        ? 'payment_pending'
        : event.user_status
    ) as RegistrationStatus,
    opensAt:
      event.user_status === "upcoming"
        ? formatOpensAt(event.registration_start)
        : undefined,
    registrationId: event.user_registration_id || undefined,
    paymentDeadline: event.payment_deadline ? new Date(event.payment_deadline) : undefined,
    bankName: event.bank_name || undefined,
    bankAccountNumber: event.bank_account_number || undefined,
    accountHolderName: event.account_holder_name || undefined,
  }), []);

  const fetchEvents = useCallback(async (mode: FilterMode = activeFilter, timeFilter: EventTimeFilter = eventTimeFilter) => {
    try {
      setIsLoading(true);
      const apiFilter = timeFilter === 'all' ? 'all' : timeFilter === 'past' ? 'past' : 'upcoming';
      const response = await listEvents({ filter: apiFilter as 'upcoming' | 'past' | 'all' });
      let sorted = [...response.data];

      switch (mode) {
        case 'date':
          sorted.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
          break;
        case 'distance':
          if (userLocation) {
            sorted.sort((a, b) => {
              const dA = (a.latitude != null && a.longitude != null)
                ? haversineDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
                : Infinity;
              const dB = (b.latitude != null && b.longitude != null)
                ? haversineDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
                : Infinity;
              return dA - dB;
            });
          }
          break;
        case 'recommended':
          sorted.sort((a, b) => b.current_slots - a.current_slots);
          break;
        // 'upcoming' uses backend default (event_date ASC)
      }

      setEvents(sorted);

      // Update selectedEvent if it exists
      setSelectedEvent((prev) => {
        if (!prev) return prev;
        const updated = sorted.find((e: EventWithStatus) => e.id === prev.id);
        if (!updated) return prev;
        return { ...toEventDetail(updated), paymentDeadline: prev.paymentDeadline };
      });
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, eventTimeFilter, toEventDetail, userLocation]);

  const handleFilterChange = useCallback((mode: FilterMode) => {
    setActiveFilter(mode);
    fetchEvents(mode);
  }, [fetchEvents]);

  const handleTimeFilterChange = useCallback((filter: EventTimeFilter) => {
    setEventTimeFilter(filter);
    setShowTimeDropdown(false);
    fetchEvents(activeFilter, filter);
  }, [activeFilter, fetchEvents]);

  // Fetch events and clubs on mount and whenever the screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      refreshClubs();
    }, [fetchEvents, refreshClubs]),
  );

  // Real-time: refetch when user's registration status changes
  useUserChannel(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  // Real-time: refetch when selected event's slots change
  useChannel(
    selectedEvent ? `event:${selectedEvent.id}` : null,
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  const filteredEvents = useMemo(() => {
    let base = searchMatches !== null ? searchMatches : events;
    if (bookmarkFilterActive) base = base.filter((e) => e.is_bookmarked);
    if (selectedClubId) base = base.filter((e) => e.club.id === selectedClubId);
    return base;
  }, [searchMatches, events, bookmarkFilterActive, selectedClubId]);

  // Events rendered as map pins — always in sync with bottom sheet
  const mapEvents = useMemo(() => {
    let base = searchMatches !== null ? searchMatches : events;
    if (bookmarkFilterActive) base = base.filter((e) => e.is_bookmarked);
    if (selectedClubId) base = base.filter((e) => e.club.id === selectedClubId);
    return base;
  }, [searchMatches, events, bookmarkFilterActive, selectedClubId]);

  const handleToggleBookmarkFilter = useCallback(() => {
    setBookmarkFilterActive((prev) => !prev);
  }, []);

  // Commit a search: fetch matching events, sync bottom sheet + map
  const commitSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchMatches(null);
      return;
    }
    try {
      const response = await listEvents({ search: query.trim(), filter: 'all', limit: 20 });
      const matched = response.data;
      setSearchMatches(matched);
      // Auto-move map to centroid of matched geo events
      const geoEvents = matched.filter((e) => e.latitude != null && e.longitude != null);
      if (geoEvents.length > 0) {
        const avgLat = geoEvents.reduce((s, e) => s + e.latitude!, 0) / geoEvents.length;
        const avgLng = geoEvents.reduce((s, e) => s + e.longitude!, 0) / geoEvents.length;
        mapRef.current?.animateCameraTo({ latitude: avgLat, longitude: avgLng, duration: 500 });
      }
    } catch {
      setSearchMatches(null);
    }
  }, []);

  // Animation for top section visibility
  const isDetailOpen = useSharedValue(0);

  // Top section slide up animation
  const topSectionAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - isDetailOpen.value,
      transform: [
        {
          translateY: interpolate(
            isDetailOpen.value,
            [0, 1],
            [0, -100],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });


  const handleToggleBookmark = useCallback(async (eventId: string) => {
    // Optimistic update
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, is_bookmarked: !e.is_bookmarked } : e,
      ),
    );
    try {
      await toggleBookmark(eventId);
    } catch {
      // Revert on failure
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, is_bookmarked: !e.is_bookmarked } : e,
        ),
      );
    }
  }, []);

  const handleShare = useCallback((event: EventWithStatus) => {
    setShareEvent(event);
    setTimeout(() => shareRef.current?.present(), 50);
  }, []);

  const handleEventPress = useCallback((event: EventWithStatus) => {
    setSelectedEvent(toEventDetail(event));

    if (event.latitude != null && event.longitude != null) {
      mapRef.current?.animateCameraTo({
        latitude: event.latitude,
        longitude: event.longitude,
        duration: 500,
      });
    }
  }, [toEventDetail]);

  const handleSelectResult = useCallback((item: { type: string; id: string; title?: string }) => {
    if (item.type === 'event') {
      const title = item.title || '';
      setSearchText(title);
      dismissSearch();
      commitSearch(title);
      // Also focus the specific tapped event on the map
      const found = events.find((e) => e.id === item.id);
      if (found?.latitude != null && found?.longitude != null) {
        mapRef.current?.animateCameraTo({
          latitude: found.latitude,
          longitude: found.longitude,
          duration: 500,
        });
      }
    }
  }, [dismissSearch, events, commitSearch]);

  const handleSearch = useCallback(() => {
    if (searchText.trim()) {
      commitSearch(searchText);
      dismissSearch();
    } else if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    }
  }, [searchText, searchResults, commitSearch, dismissSearch, handleSelectResult]);

  const handleCloseEventDetail = useCallback(() => {
    eventDetailRef.current?.close();
    setSelectedEvent(null);
  }, []);

  const handleRegister = useCallback(async () => {
    if (!selectedEvent) return;

    // For prepaid events, show confirmation dialog first
    if (selectedEvent.isPrepaid) {
      setRegistrationModalState("prepaid_confirm");
      return;
    }

    // Show loading state
    setRegistrationModalState("loading");

    try {
      // Try to call the actual API
      await registerForEvent(String(selectedEvent.id));
      setRegistrationModalState("completed");
    } catch (error) {
      const apiError = error as ApiError;
      // Check if slots are full
      if (apiError.detail === "Event is full") {
        setRegistrationModalState("slots_full");
      } else {
        // For other errors (network, auth, etc.), show slots_full as fallback
        // In production, you might want different error handling
        console.error("Registration error:", apiError.detail);
        setRegistrationModalState("slots_full");
      }
    }
  }, [selectedEvent]);

  // Prepaid registration handlers
  const handlePrepaidBack = useCallback(() => {
    setRegistrationModalState(null);
  }, []);

  const handlePrepaidConfirm = useCallback(async () => {
    if (!selectedEvent) return;

    setRegistrationModalState("loading");

    try {
      await registerForEvent(String(selectedEvent.id));
      // Calculate payment deadline (24 hours from now)
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              paymentDeadline: deadline,
              status: "payment_pending" as const,
            }
          : null,
      );
      setRegistrationModalState("prepaid_completed");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.detail === "Event is full") {
        setRegistrationModalState("slots_full");
      } else {
        console.error("Registration error:", apiError.detail);
        setRegistrationModalState("error");
      }
    }
  }, [selectedEvent]);

  const handleCloseRegistrationModal = useCallback(() => {
    const wasSuccessful =
      registrationModalState === "completed" ||
      registrationModalState === "cancel_completed";
    setRegistrationModalState(null);

    // If registration or cancellation was successful, close the event detail as well
    if (wasSuccessful) {
      handleCloseEventDetail();
    }
  }, [registrationModalState, handleCloseEventDetail]);

  // Cancel flow handlers
  const handleCancelPress = useCallback(() => {
    // Show cancel confirmation dialog
    setRegistrationModalState("cancel_confirm");
  }, []);

  const handleCancelBack = useCallback(() => {
    // Go back from cancel confirmation
    setRegistrationModalState(null);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!selectedEvent?.registrationId) return;

    // Show cancel loading state
    setRegistrationModalState("cancel_loading");

    try {
      await cancelRegistration(String(selectedEvent.registrationId));
      setRegistrationModalState("cancel_completed");
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Cancellation error:", apiError.detail);
      setRegistrationModalState("error");
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      // Animate top section out and transit card in
      isDetailOpen.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      // 약간의 딜레이 후 present (컴포넌트 마운트 대기)
      const timer = setTimeout(() => {
        eventDetailRef.current?.present();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Animate back
      isDetailOpen.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [selectedEvent, isDetailOpen]);

  // 바텀시트 위치 추적
  const animatedPosition = useSharedValue(0);

  // 바텀시트가 멈추는 지점들
  const snapPoints = useMemo(() => ["15%", "27%", "40%", "60%", "70%", "92%"], []);

  // 탭바 높이(80) + bottom safe area
  const bottomPadding = layout.tabBarHeight + insets.bottom;

  // 지도 translateY 계산 (바텀시트가 올라갈수록 지도도 위로)
  const mapAnimatedStyle = useAnimatedStyle(() => {
    const sheetHeight = screenHeight - animatedPosition.value;
    const baseHeight = screenHeight * 0.09;
    const maxOffset = screenHeight * 0.3;
    const translateY = -Math.min((sheetHeight - baseHeight) * 0.3, maxOffset);
    return { transform: [{ translateY }] };
  });


  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <Animated.View style={[styles.mapContainer, mapAnimatedStyle]}>
          <NaverMapView
            ref={mapRef}
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
            locale="en"
          >
            <EventMarkers
              events={mapEvents}
              selectedEventId={selectedEvent?.id as string | undefined}
              onMarkerPress={handleEventPress}
            />
            {userLocation && (
              <NaverMapMarkerOverlay
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={20}
              >
                <LocationMarkerIcon />
              </NaverMapMarkerOverlay>
            )}
          </NaverMapView>
        </Animated.View>
        {/* Top Section - slides up when detail opens */}
        <Animated.View
          style={[
            styles.topSection,
            { top: getSafeTop(insets) },
            topSectionAnimatedStyle,
            showDropdown && { zIndex: 10 },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.searchBarContainer}>
              <SearchBar
                inputRef={searchInputRef}
                value={searchText}
                onChangeText={handleSearchTextChange}
                onSubmit={handleSearch}
                onFocus={activateSearch}
                onTap={handleSearchTap}
              />
            </View>
            <GroupsButton onPress={() => navigation.navigate('Community')} />
            <MyBadge
              onPress={() => navigation.navigate('Profile')}
              userImage={(user as User | null)?.profile_image ?? undefined}
              username={(user as User | null)?.username ?? undefined}
            />
          </View>
          {showDropdown ? (
            <View style={styles.dropdownContainer}>
              <SearchDropdown
                mode={searchText.trim() ? "results" : "history"}
                results={searchResults}
                history={searchHistory}
                isLoading={isSearchLoading}
                onSelectResult={handleSelectResult}
                onSelectHistory={handleSelectHistory}
                onRemoveHistory={handleRemoveHistory}
                onClearHistory={handleClearHistory}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <FilterBadge
                label="Bookmark"
                icon={<StarsIcon size={16} color={bookmarkFilterActive ? '#FFFFFF' : '#212121'} />}
                isActive={bookmarkFilterActive}
                onPress={handleToggleBookmarkFilter}
              />
              {flatClubs.map((club) => (
                <FilterBadge
                  key={club.id}
                  label={club.name}
                  imageUri={club.logo_image ?? undefined}
                  isActive={selectedClubId === club.id}
                  onPress={() => handleToggleClubFilter(club.id)}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* My Location button - below top section, right side */}
        <View style={[styles.myLocationBtn, { top: getSafeTop(insets) + 96 }]}>
          <MyLocationButton onPress={handleMyLocation} size="small" />
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
            {/* Sort chips */}
            <View style={styles.sheetFilterContent}>
              {([
                { key: 'recommended', label: 'Recommended' },
                { key: 'date', label: 'Date: Earliest' },
                { key: 'distance', label: 'Distance' },
              ] as const).map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.sheetFilterChip,
                    activeFilter === f.key && styles.sheetFilterChipActive,
                  ]}
                  onPress={() => handleFilterChange(f.key)}
                >
                  <Text
                    style={[
                      styles.sheetFilterText,
                      activeFilter === f.key && styles.sheetFilterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Time filter - chip style, right-aligned below sort chips */}
            <View style={styles.timeFilterRow}>
              <TouchableOpacity
                style={styles.timeFilterChip}
                onPress={() => setShowTimeDropdown((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.timeFilterButtonText}>
                  {eventTimeFilter === 'all' ? 'All Events' : eventTimeFilter === 'past' ? 'Past Events' : 'Current Events'}
                </Text>
                <Svg width={12} height={12} viewBox="0 0 24 24" style={{ marginLeft: 3 }}>
                  <Path
                    d={showTimeDropdown ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
                    stroke={colors.text.secondary}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              {showTimeDropdown && (
                <View style={styles.timeFilterDropdown}>
                  {([
                    { key: 'all', label: 'All Events' },
                    { key: 'current', label: 'Current Events' },
                    { key: 'past', label: 'Past Events' },
                  ] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.timeFilterOption, eventTimeFilter === opt.key && styles.timeFilterOptionActive]}
                      onPress={() => handleTimeFilterChange(opt.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timeFilterOptionText, eventTimeFilter === opt.key && styles.timeFilterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <BottomSheetScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPadding },
            ]}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#03CA5B" />
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : filteredEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No events found</Text>
              </View>
            ) : (
              filteredEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <EventCard
                    title={event.title}
                    date={formatEventDate(event.event_date)}
                    provider={event.club.name}
                    providerLogo={event.club.logo_image || undefined}
                    imageUri={event.images?.[0] || undefined}
                    status={event.user_status}
                    opensAt={
                      event.user_status === "upcoming"
                        ? formatOpensAt(event.registration_start)
                        : undefined
                    }
                    participants={event.participants_preview}
                    participantCount={event.current_slots}
                    isBookmarked={event.is_bookmarked}
                    onPress={() => handleEventPress(event)}
                    onBookmark={() => handleToggleBookmark(event.id)}
                    onShare={() => handleShare(event)}
                  />
                  {index < filteredEvents.length - 1 && (
                    <View style={styles.eventDivider}>
                      <View style={styles.eventDividerInner} />
                    </View>
                  )}
                </React.Fragment>
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
            onOnePass={() => {
              if (selectedEvent) {
                const eventId = String(selectedEvent.id);
                handleCloseEventDetail();
                navigation.navigate('OnePass', { eventId });
              }
            }}
            onFindWay={() => {
              const address = selectedEvent?.address;
              if (!address) return;
              const query = encodeURIComponent(address);
              const naverMapUrl = `nmap://search?query=${query}&appname=com.kuba.clublms`;
              Linking.openURL(naverMapUrl).catch(() => {
                Linking.openURL(`https://map.naver.com/v5/search/${query}`);
              });
            }}
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
          bankName={selectedEvent?.bankName}
          bankAccountNumber={selectedEvent?.bankAccountNumber}
          accountHolderName={selectedEvent?.accountHolderName}
          costAmount={selectedEvent?.prepaidAmount}
        />

        {shareEvent && (
          <ShareBottomSheet
            ref={shareRef}
            eventId={shareEvent.id}
            eventTitle={shareEvent.title}
            onClose={() => setShareEvent(null)}
          />
        )}

        {/* Floating OnePass Button */}
        <View
          style={[styles.floatingOnePass, {
            bottom: bottomPadding - 4,
            right: isAdmin ? 16 + 52 + 12 : screenPadding.horizontal,
          }]}
          pointerEvents="box-none"
        >
          <OnePassButton onPress={() => navigation.navigate('OnePass', {})} />
        </View>

        {/* Admin FAB — same bottom level as OnePass, right side */}
        {isAdmin && (
          <View
            style={[styles.adminColumn, { bottom: bottomPadding - 4 }]}
            pointerEvents="box-none"
          >
            <AdminFaceFab
              isOpen={adminMenuOpen}
              onToggle={() => setAdminMenuOpen((v) => !v)}
              items={[
                {
                  label: 'Create Event',
                  icon: <CalendarPlusIcon />,
                  onPress: () => { setAdminMenuOpen(false); navigation.navigate('AdminCreateEvent'); },
                },
                {
                  label: 'Access Control',
                  icon: <KeyIcon />,
                  onPress: () => { setAdminMenuOpen(false); navigation.navigate('AccessControl'); },
                },
                {
                  label: 'Admin Hub',
                  icon: <GridIcon />,
                  onPress: () => { setAdminMenuOpen(false); navigation.navigate('AdminHub'); },
                },
              ]}
            />
          </View>
        )}

        {/* Search dropdown backdrop */}
        {isSearchFocused && (
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
            activeOpacity={1}
            onPress={dismissSearch}
          />
        )}

        {/* Admin FAB backdrop */}
        {isAdmin && adminMenuOpen && (
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 99 }]}
            activeOpacity={1}
            onPress={() => setAdminMenuOpen(false)}
          />
        )}

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
    position: "absolute",
    left: 0,
    right: 0,
    gap: 11.5,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: screenPadding.horizontal,
  },
  searchBarContainer: {
    flex: 1,
  },
  filterScrollContent: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: screenPadding.horizontal,
  },
  bottomSheetBackground: {
    backgroundColor: colors.background.primary,
    ...shadows.xl,
  },
  handleIndicator: {
    backgroundColor: colors.gray200,
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    paddingTop: screenPadding.vertical,
    paddingBottom: 12,
  },
  sheetFilterContent: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: screenPadding.horizontal,
  },
  sheetFilterChip: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: layout.borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.gray100,
    ...shadows.sm,
  },
  sheetFilterChipActive: {
    backgroundColor: colors.gray900,
    ...shadows.md,
  },
  sheetFilterText: {
    ...typography.labelSmall,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  sheetFilterTextActive: {
    color: colors.text.inverse,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  dropdownContainer: {
    paddingHorizontal: screenPadding.horizontal,
  },
  adminColumn: {
    position: "absolute" as const,
    right: 16,
    zIndex: 100,
  },
  myLocationBtn: {
    position: "absolute",
    right: 16,
  },
  timeFilterRow: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: 10,
    paddingBottom: 4,
    position: "relative" as const,
    zIndex: 10,
  },
  timeFilterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.gray100,
    borderRadius: layout.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...shadows.sm,
  },
  timeFilterButtonText: {
    ...typography.labelSmall,
    fontSize: 12,
    color: colors.text.secondary,
  },
  timeFilterChevron: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  timeFilterDropdown: {
    position: "absolute" as const,
    top: 28,
    right: screenPadding.horizontal,
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    paddingVertical: 4,
    minWidth: 150,
    zIndex: 20,
    ...shadows.lg,
  },
  timeFilterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeFilterOptionActive: {
    backgroundColor: colors.gray100,
  },
  timeFilterOptionText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  timeFilterOptionTextActive: {
    color: colors.text.primary,
    fontWeight: "600" as const,
  },
  floatingOnePass: {
    position: "absolute",
    left: screenPadding.horizontal,
    right: screenPadding.horizontal,
    zIndex: 50,
  },
  eventDivider: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  eventDividerInner: {
    height: 1,
    backgroundColor: '#EBEBEB',
    borderRadius: 1,
  },
});
