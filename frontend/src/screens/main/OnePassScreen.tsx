import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  StatusBar,
  AppState,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { OnePassTicket, OnePassScreenState } from '../../types/onepass';
import { getOnePassTickets } from '../../services/onepass';
import { useAuth } from '../../context/AuthContext';
import { colors, font } from '../../constants';
import {
  OnePassHeader,
  UserProfile,
  BarcodeDisplay,
  TicketCarousel,
  AutoSelectionCapsule,
  ActionButtons,
  CheckinOverlay,
  EventInfoPanel,
} from '../../components/onepass';

const POLL_INTERVAL = 8000; // 8 seconds

type Props = NativeStackScreenProps<MainStackParamList, 'OnePass'>;

export default function OnePassScreen({ navigation, route }: Props) {
  const { eventId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const auth = useAuth();
  const user = auth.user;

  const [tickets, setTickets] = useState<OnePassTicket[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenState, setScreenState] = useState<OnePassScreenState>('auto_selection');
  const [isLoading, setIsLoading] = useState(true);
  const prevTicketsRef = useRef<OnePassTicket[]>([]);

  const scrollX = useSharedValue(0);

  const activeTicket = useMemo(
    () => (tickets.length > 0 ? tickets[activeIndex] : null),
    [tickets, activeIndex]
  );

  const fetchTickets = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const response = await getOnePassTickets();
      const data = response.data || [];

      // Detect if active ticket just got checked in (admin scanned it)
      if (!isInitial && prevTicketsRef.current.length > 0) {
        const prevActive = prevTicketsRef.current[activeIndex];
        const newActive = data[activeIndex];
        if (
          prevActive &&
          newActive &&
          prevActive.id === newActive.id &&
          !prevActive.is_used &&
          newActive.is_used
        ) {
          setScreenState('checked_in');
        }
      }

      prevTicketsRef.current = data;
      setTickets(data);

      if (isInitial && data.length > 0) {
        if (eventId) {
          const idx = data.findIndex((t) => t.event.id === eventId);
          if (idx >= 0) {
            setActiveIndex(idx);
            setScreenState(data[idx].is_used ? 'checked_in' : 'viewing_ticket');
          }
        } else {
          const now = new Date();
          const autoIdx = data.findIndex(
            (t) => !t.is_used && new Date(t.event.event_date) >= now
          );
          setActiveIndex(autoIdx >= 0 ? autoIdx : 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch OnePass tickets:', error);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [eventId, activeIndex]);

  // Initial fetch
  useEffect(() => {
    fetchTickets(true);
  }, []);

  // Poll for status updates (admin scans barcode -> status changes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets(false);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchTickets(false);
      }
    });
    return () => subscription.remove();
  }, [fetchTickets]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
    setScreenState('viewing_ticket');
  }, []);

  const handleAutoSelectionToggle = useCallback(() => {
    setScreenState('auto_selection');

    const now = new Date();
    const autoIdx = tickets.findIndex(
      (t) => !t.is_used && new Date(t.event.event_date) >= now
    );
    if (autoIdx >= 0) {
      setActiveIndex(autoIdx);
    }
  }, [tickets]);

  const handleSwipeDown = useCallback(() => {
    if (screenState === 'auto_selection') {
      setScreenState('viewing_ticket');
    }
  }, [screenState]);

  const userName = useMemo(() => {
    if (!user) return '';
    if ('legal_name' in user && user.legal_name) return user.legal_name;
    return user.username || '';
  }, [user]);

  const profileImage = useMemo(() => {
    if (!user) return undefined;
    return user.profile_image || undefined;
  }, [user]);

  // Status text for BarcodeDisplay
  const statusText = useMemo(() => {
    if (screenState === 'checked_in') return 'CHECKED IN';
    if (activeTicket?.is_used) return 'USED';
    return undefined;
  }, [screenState, activeTicket]);

  const statusColor = useMemo(() => {
    if (screenState === 'checked_in') return colors.success;
    if (activeTicket?.is_used) return colors.gray500;
    return undefined;
  }, [screenState, activeTicket]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.black} />
        <OnePassHeader onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.black} />
        <OnePassHeader onBack={handleBack} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tickets available</Text>
          <Text style={styles.emptySubtext}>
            Register for events to get your OnePass tickets
          </Text>
        </View>
      </View>
    );
  }

  const showAutoSelection = screenState === 'auto_selection';
  const showCheckedIn = screenState === 'checked_in';
  const showEventInfo = screenState === 'viewing_ticket' || screenState === 'checked_in';

  // Estimated heights of all non-carousel elements (worst-case: viewing_ticket)
  // Header(60) + UserProfile(68) + BarcodeDisplay(168) + ActionButtons(38) + EventInfoPanel(120)
  const FIXED_UI_HEIGHT = 60 + 68 + 168 + 38 + 120;
  const carouselMaxHeight = Math.max(200, screenHeight - insets.top - FIXED_UI_HEIGHT);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <OnePassHeader onBack={handleBack} />

      <UserProfile name={userName} profileImage={profileImage} />

      {activeTicket && (
        <BarcodeDisplay
          barcode={activeTicket.barcode}
          userName={userName}
          statusText={statusText}
          statusColor={statusColor}
        />
      )}

      <View style={styles.carouselSection}>
        <TicketCarousel
          tickets={tickets}
          activeIndex={activeIndex}
          onIndexChange={handleIndexChange}
          scrollX={scrollX}
          maxHeight={carouselMaxHeight}
        />

        {showAutoSelection && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleSwipeDown}
            activeOpacity={1}
          >
            <AutoSelectionCapsule />
          </TouchableOpacity>
        )}

        {showCheckedIn && <CheckinOverlay type="success" />}
      </View>

      <ActionButtons
        screenState={screenState}
        onAutoSelectionToggle={handleAutoSelectionToggle}
      />

      {/* Bottom section */}
      {showAutoSelection ? (
        <View style={styles.bottomPanel}>
          <View style={styles.scanInfoContainer}>
            <Svg style={styles.scanInfoBorder} viewBox="0 0 316 28">
              <Rect
                x={0.5}
                y={0.5}
                width={315}
                height={27}
                rx={14}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
                fill="none"
              />
            </Svg>
            <Text style={styles.scanInfoText}>SCAN BARCODE FIRST</Text>
          </View>
        </View>
      ) : showEventInfo && activeTicket ? (
        <EventInfoPanel ticket={activeTicket} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.white,
    marginTop: 12,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: font.semibold,
    fontSize: 18,
    color: colors.white,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.white,
    opacity: 0.5,
    textAlign: 'center',
  },
  carouselSection: {
    position: 'relative',
    justifyContent: 'center',
  },
  bottomPanel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  scanInfoContainer: {
    width: 316,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanInfoBorder: {
    position: 'absolute',
    width: 316,
    height: 28,
  },
  scanInfoText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
});
