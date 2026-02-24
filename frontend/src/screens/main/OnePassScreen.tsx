import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  StatusBar,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { OnePassTicket, OnePassScreenState } from '../../types/onepass';
import { getOnePassTickets } from '../../services/onepass';
import { useAuth } from '../../context/AuthContext';
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
    if (screenState === 'checked_in') return '#34C759';
    if (activeTicket?.is_used) return '#8E8E93';
    return undefined;
  }, [screenState, activeTicket]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <OnePassHeader onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

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

      <View
        style={styles.carouselSection}
        onTouchEnd={handleSwipeDown}
      >
        <TicketCarousel
          tickets={tickets}
          activeIndex={activeIndex}
          onIndexChange={handleIndexChange}
          scrollX={scrollX}
        />

        {showAutoSelection && <AutoSelectionCapsule />}

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
            <Svg style={styles.scanInfoBorder} viewBox="0 0 316 32">
              <Rect
                x={0.5}
                y={0.5}
                width={315}
                height={31}
                rx={16}
                stroke="#FF383C"
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
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  carouselSection: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  bottomPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  scanInfoContainer: {
    width: 316,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanInfoBorder: {
    position: 'absolute',
    width: 316,
    height: 32,
  },
  scanInfoText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 20,
    color: '#FF383C',
    textAlign: 'center',
  },
});
