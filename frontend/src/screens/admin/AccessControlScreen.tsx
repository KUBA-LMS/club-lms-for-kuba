import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import {
  AccessControlHeader,
  ScannerArea,
  EventSelector,
  EventSearchDropdown,
  ModeSegmentedControl,
  ParticipantsTable,
  StatusFilterTabs,
  ScanResultBanner,
  ParticipantDetailCard,
  OverrideConfirmModal,
} from '../../components/access-control';
import type { ParticipantsTableHandle } from '../../components/access-control';
// Camera is now inline in ScannerArea
import { listEvents } from '../../services/events';
import {
  getParticipants,
  scanBarcode,
  overrideRegistration,
} from '../../services/accessControl';
import {
  Participant,
  ScanResult,
  TicketStatus,
  EventSearchItem,
} from '../../types/accessControl';
import { useChannel } from '../../hooks/useWebSocket';

type Props = NativeStackScreenProps<MainStackParamList, 'AccessControl'>;

type Mode = 'entry_control' | 'override';

export default function AccessControlScreen({ navigation }: Props) {
  // Event selection
  const [selectedEvent, setSelectedEvent] = useState<EventSearchItem | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EventSearchItem[]>([]);

  // Mode
  const [mode, setMode] = useState<Mode>('entry_control');

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Entry control
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | undefined>();
  const [highlightColor, setHighlightColor] = useState<string | undefined>();

  // Override
  const [statusFilter, setStatusFilter] = useState<TicketStatus>('requested');
  const [overrideModalVisible, setOverrideModalVisible] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<Participant | null>(null);

  // Table ref for auto-scroll
  const tableRef = useRef<ParticipantsTableHandle>(null);

  // Preload recent events on mount
  const [recentEvents, setRecentEvents] = useState<EventSearchItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await listEvents({ limit: 10 });
        setRecentEvents(
          res.data.map((e: any) => ({ id: e.id, title: e.title, event_date: e.event_date })),
        );
      } catch {
        // silent
      }
    })();
  }, []);

  // Search events (debounced)
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await listEvents({ search: searchQuery, limit: 10 });
        const items: EventSearchItem[] = res.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          event_date: e.event_date,
        }));
        setSearchResults(items);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Show recent events when no search query, otherwise show search results
  const dropdownResults = searchQuery.length > 0 ? searchResults : recentEvents;

  // Fetch participants when event or mode/filter changes
  const fetchParticipants = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      const filter = mode === 'override' ? statusFilter : undefined;
      const res = await getParticipants(selectedEvent.id, filter);
      setParticipants(res.data);
      setCounts(res.counts);
    } catch {
      // silent
    }
  }, [selectedEvent, mode, statusFilter]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Real-time: refresh participant list when admin channel fires
  useChannel(
    selectedEvent ? `event:${selectedEvent.id}:admin` : null,
    useCallback(() => {
      fetchParticipants();
    }, [fetchParticipants]),
  );

  // Event selection handlers
  const handleEventSelect = useCallback((event: EventSearchItem) => {
    setSelectedEvent(event);
    setIsSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setScanResult(null);
    setSelectedParticipant(null);
    setHighlightedId(undefined);
  }, []);

  const handleClearSearch = useCallback(() => {
    setIsSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Mode change
  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setSelectedParticipant(null);
    setScanResult(null);
    setHighlightedId(undefined);
    setHighlightColor(undefined);
  }, []);

  // Scan barcode
  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      if (!selectedEvent) return;
      try {
        const res = await scanBarcode(selectedEvent.id, barcode);
        setScanResult(res.result);

        if (res.result === 'entry_approved') {
          Vibration.vibrate([0, 80, 60, 80]);
        } else if (res.result === 'double_checked_in') {
          Vibration.vibrate(200);
        } else {
          Vibration.vibrate([0, 100, 80, 100, 80, 100]);
        }

        if (res.participant) {
          setSelectedParticipant(res.participant);
          setHighlightedId(res.participant.user_id);
          const colorMap: Record<ScanResult, string> = {
            entry_approved: '#34C759',
            entry_denied_pending: '#FF383C',
            entry_denied_no_ticket: '#FF383C',
            double_checked_in: '#FFCC00',
          };
          setHighlightColor(colorMap[res.result]);
          // Auto-scroll to scanned participant after list refreshes
          const userId = res.participant.user_id;
          await fetchParticipants();
          setTimeout(() => tableRef.current?.scrollToUser(userId), 150);
        } else {
          fetchParticipants();
        }
      } catch {
        Alert.alert('Error', 'Failed to process scan');
      }
    },
    [selectedEvent, fetchParticipants],
  );

  // Override flow
  const handleOverridePress = useCallback((participant: Participant) => {
    setOverrideTarget(participant);
    setOverrideModalVisible(true);
  }, []);

  const handleOverrideConfirm = useCallback(async () => {
    if (!selectedEvent || !overrideTarget?.registration_id) return;
    setOverrideModalVisible(false);
    try {
      const res = await overrideRegistration(
        selectedEvent.id,
        overrideTarget.registration_id,
      );
      if (res.success && res.participant) {
        setSelectedParticipant(res.participant);
      }
      fetchParticipants();
    } catch {
      Alert.alert('Error', 'Failed to override registration');
    }
    setOverrideTarget(null);
  }, [selectedEvent, overrideTarget, fetchParticipants]);

  const handleParticipantSelect = useCallback(
    (participant: Participant) => {
      setSelectedParticipant(participant);
      if (mode === 'override' && participant.ticket_status === 'requested') {
        handleOverridePress(participant);
      }
    },
    [mode, handleOverridePress],
  );

  const filteredParticipants =
    mode === 'override'
      ? participants
      : participants;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AccessControlHeader onBack={() => navigation.goBack()} />

        {mode === 'entry_control' && (
          <ScannerArea
            isActive={!!selectedEvent}
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}

        <EventSelector
          selectedEventTitle={selectedEvent?.title}
          isSearchMode={isSearchMode}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onPress={() => setIsSearchMode(true)}
          onClearSearch={handleClearSearch}
        />

        {isSearchMode && (
          <EventSearchDropdown
            results={dropdownResults}
            onSelect={handleEventSelect}
            searchQuery={searchQuery}
          />
        )}

        <ModeSegmentedControl mode={mode} onModeChange={handleModeChange} />

        {mode === 'override' && (
          <StatusFilterTabs
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
            counts={counts}
          />
        )}

        <ScrollView style={styles.flex} nestedScrollEnabled>
          <ParticipantsTable
            ref={tableRef}
            participants={filteredParticipants}
            selectedParticipantId={selectedParticipant?.user_id}
            onSelectParticipant={handleParticipantSelect}
            mode={mode}
            highlightedId={highlightedId}
            highlightColor={highlightColor}
          />

          {mode === 'entry_control' && (
            <View style={styles.bannerSection}>
              <ScanResultBanner
                scanResult={scanResult}
                hasEvent={!!selectedEvent}
              />
            </View>
          )}

          {selectedParticipant && (
            <View style={styles.detailSection}>
              <ParticipantDetailCard participant={selectedParticipant} />
            </View>
          )}
        </ScrollView>

        <OverrideConfirmModal
          visible={overrideModalVisible}
          onConfirm={handleOverrideConfirm}
          onCancel={() => {
            setOverrideModalVisible(false);
            setOverrideTarget(null);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  bannerSection: {
    marginTop: 8,
  },
  detailSection: {
    marginTop: 8,
    marginBottom: 24,
  },
});
