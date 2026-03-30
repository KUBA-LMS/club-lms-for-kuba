import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { getMyGroups, MyGroup } from '../../services/clubs';
import AdminHeader from '../../components/admin/AdminHeader';
import MemberCard from '../../components/admin/MemberCard';
import MemberSearchSection from '../../components/admin/MemberSearchSection';
import OrganizationSection from '../../components/admin/OrganizationSection';
import EventListSection from '../../components/admin/EventListSection';
import TaskListSection from '../../components/admin/TaskListSection';
import { resolveImageUrl } from '../../utils/image';
import DepositModal from '../../components/admin/DepositModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, font } from '../../constants';
import {
  AdminMember,
  SearchNonMember,
  AdminOrganization,
  AdminEventListResponse,
  AdminTaskListResponse,
  getClubMembers,
  toggleAdminRole,
  toggleLeadRole,
  removeMember,
  adjustDeposit,
  searchNonMembers,
  addMemberToClub,
  getOrganization,
  getClubEvents,
  getClubTasks,
  approveRegistration,
  declineRegistration,
  exportEventCsv,
} from '../../services/adminHub';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type PrimaryTab = 'member' | 'event';
type MemberSubTab = 'manage' | 'search' | 'organization';
type EventSubTab = 'list' | 'task';

export default function AdminHubScreen() {
  const navigation = useNavigation<NavigationProp>();

  // Club selection
  const [clubs, setClubs] = useState<MyGroup[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [clubsLoading, setClubsLoading] = useState(true);

  // Tabs
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('event');
  const [memberSubTab, setMemberSubTab] = useState<MemberSubTab>('manage');
  const [eventSubTab, setEventSubTab] = useState<EventSubTab>('list');

  // Member Manage
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Deposit modal
  const [depositModal, setDepositModal] = useState<{
    visible: boolean;
    mode: 'topup' | 'deduct';
    userId: string;
    username: string;
  }>({ visible: false, mode: 'topup', userId: '', username: '' });

  // Confirm modal (remove member)
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    userId: string;
    username: string;
    profileImage: string | null;
  }>({ visible: false, userId: '', username: '', profileImage: null });

  // Member Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchNonMember[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Organization
  const [orgData, setOrgData] = useState<AdminOrganization | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);

  // Events
  const [eventData, setEventData] = useState<AdminEventListResponse | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Tasks
  const [taskData, setTaskData] = useState<AdminTaskListResponse | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  // Fetch clubs on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyGroups();
        const adminClubs = data.filter((c) => c.role === 'admin' || c.role === 'lead');
        setClubs(adminClubs);
        if (data.length > 0) {
          setSelectedClubId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch clubs:', error);
      } finally {
        setClubsLoading(false);
      }
    })();
  }, []);

  // Fetch data when club or tab changes
  useEffect(() => {
    if (!selectedClubId) return;
    if (primaryTab === 'member') {
      if (memberSubTab === 'manage') fetchMembers();
      else if (memberSubTab === 'organization') fetchOrganization();
    } else {
      if (eventSubTab === 'list') fetchEvents();
      else fetchTasks();
    }
  }, [selectedClubId, primaryTab, memberSubTab, eventSubTab]);

  // Search non-members with debounce
  useEffect(() => {
    if (memberSubTab !== 'search' || !selectedClubId) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchNonMembers(selectedClubId, searchQuery.trim());
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, memberSubTab, selectedClubId]);

  const fetchMembers = useCallback(async () => {
    if (!selectedClubId) return;
    setMembersLoading(true);
    try {
      const res = await getClubMembers(selectedClubId, 1, 100);
      setMembers(res.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setMembersLoading(false);
    }
  }, [selectedClubId]);

  const fetchOrganization = useCallback(async () => {
    if (!selectedClubId) return;
    setOrgLoading(true);
    try {
      const res = await getOrganization(selectedClubId);
      setOrgData(res);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    } finally {
      setOrgLoading(false);
    }
  }, [selectedClubId]);

  const fetchEvents = useCallback(async () => {
    if (!selectedClubId) return;
    setEventsLoading(true);
    try {
      const res = await getClubEvents(selectedClubId);
      setEventData(res);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setEventsLoading(false);
    }
  }, [selectedClubId]);

  const fetchTasks = useCallback(async () => {
    if (!selectedClubId) return;
    setTasksLoading(true);
    try {
      const res = await getClubTasks(selectedClubId, taskSearch || undefined);
      setTaskData(res);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, [selectedClubId, taskSearch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (primaryTab === 'member') {
      if (memberSubTab === 'manage') await fetchMembers();
      else if (memberSubTab === 'organization') await fetchOrganization();
    } else {
      if (eventSubTab === 'list') await fetchEvents();
      else await fetchTasks();
    }
    setRefreshing(false);
  }, [primaryTab, memberSubTab, eventSubTab, fetchMembers, fetchOrganization, fetchEvents, fetchTasks]);

  // --- Member Manage handlers ---
  const handleToggleAdmin = useCallback(async (userId: string) => {
    if (!selectedClubId) return;
    try {
      const res = await toggleAdminRole(selectedClubId, userId);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, is_admin: res.is_admin } : m)),
      );
    } catch (error) {
      console.error('Failed to toggle admin:', error);
    }
  }, [selectedClubId]);

  const handleToggleLead = useCallback(async (userId: string) => {
    if (!selectedClubId) return;
    try {
      const res = await toggleLeadRole(selectedClubId, userId);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, club_role: res.club_role } : m)),
      );
    } catch (error) {
      console.error('Failed to toggle lead:', error);
    }
  }, [selectedClubId]);

  const handleRemoveMember = useCallback(async () => {
    if (!selectedClubId || !confirmModal.userId) return;
    try {
      await removeMember(selectedClubId, confirmModal.userId);
      setMembers((prev) => prev.filter((m) => m.id !== confirmModal.userId));
      setConfirmModal({ visible: false, userId: '', username: '', profileImage: null });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }, [selectedClubId, confirmModal.userId]);

  const handleDepositConfirm = useCallback(async (amount: number, description: string) => {
    if (!selectedClubId || !depositModal.userId) return;
    try {
      const res = await adjustDeposit(selectedClubId, depositModal.userId, amount, description);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === depositModal.userId
            ? { ...m, deposit: { ...m.deposit, balance: res.balance, deposit_id: res.deposit_id } }
            : m,
        ),
      );
      setDepositModal({ visible: false, mode: 'topup', userId: '', username: '' });
    } catch (error) {
      console.error('Failed to adjust deposit:', error);
    }
  }, [selectedClubId, depositModal.userId]);

  // --- Member Search handlers ---
  const handleAddMember = useCallback(async (userId: string) => {
    if (!selectedClubId) return;
    try {
      await addMemberToClub(selectedClubId, userId);
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      Alert.alert('Success', 'Member added to club');
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  }, [selectedClubId]);

  // --- Task handlers ---
  const handleApprove = useCallback(async (registrationId: string) => {
    try {
      await approveRegistration(registrationId);
      fetchTasks();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  }, [fetchTasks]);

  const handleDecline = useCallback(async (registrationId: string) => {
    try {
      await declineRegistration(registrationId);
      fetchTasks();
    } catch (error) {
      console.error('Failed to decline:', error);
    }
  }, [fetchTasks]);

  // --- CSV Export ---
  const handleExportCsv = useCallback(async (eventId: string, eventTitle: string) => {
    try {
      const csvData = await exportEventCsv(eventId);
      const safeTitle = eventTitle.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
      const fileUri = `${FileSystem.cacheDirectory}${safeTitle}_participants.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `${eventTitle} Participants`,
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  }, []);

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  // --- Render sections ---

  const renderClubSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.clubSelectorContent}
      style={styles.clubSelector}
    >
      {clubs.map((club) => (
        <TouchableOpacity
          key={club.id}
          onPress={() => setSelectedClubId(club.id)}
          activeOpacity={0.7}
        >
          {club.logo_image ? (
            <Image
              source={{ uri: resolveImageUrl(club.logo_image) }}
              style={[
                styles.clubLogo,
                selectedClubId === club.id && styles.clubLogoSelected,
              ]}
            />
          ) : (
            <View
              style={[
                styles.clubLogo,
                styles.clubLogoPlaceholder,
                selectedClubId === club.id && styles.clubLogoSelected,
              ]}
            >
              <Text style={styles.clubLogoText}>{club.name.charAt(0)}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSegmentedControl = () => (
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[styles.segment, primaryTab === 'member' && styles.segmentActive]}
        onPress={() => setPrimaryTab('member')}
      >
        <Text style={[styles.segmentText, primaryTab === 'member' && styles.segmentTextActive]}>
          Member
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, primaryTab === 'event' && styles.segmentActive]}
        onPress={() => setPrimaryTab('event')}
      >
        <Text style={[styles.segmentText, primaryTab === 'event' && styles.segmentTextActive]}>
          Event
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecondaryTabs = () => {
    if (primaryTab === 'member') {
      const tabs: { key: MemberSubTab; label: string }[] = [
        { key: 'manage', label: 'Manage' },
        { key: 'search', label: 'Search' },
        { key: 'organization', label: 'Organization' },
      ];
      return (
        <View style={styles.secondaryTabs}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.secondaryTab, memberSubTab === t.key && styles.secondaryTabActive]}
              onPress={() => setMemberSubTab(t.key)}
            >
              <Text
                style={[
                  styles.secondaryTabText,
                  memberSubTab === t.key && styles.secondaryTabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    const tabs: { key: EventSubTab; label: string }[] = [
      { key: 'list', label: 'List' },
      { key: 'task', label: 'Task' },
    ];
    return (
      <View style={styles.secondaryTabs}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.secondaryTab, eventSubTab === t.key && styles.secondaryTabActive]}
            onPress={() => setEventSubTab(t.key)}
          >
            <Text
              style={[
                styles.secondaryTabText,
                eventSubTab === t.key && styles.secondaryTabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // --- Member Manage ---
  const renderMemberManage = () => {
    if (membersLoading && members.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      );
    }

    return members.map((member) => (
      <MemberCard
        key={member.id}
        member={member}
        onToggleAdmin={handleToggleAdmin}
        onToggleLead={handleToggleLead}
        onRemove={(userId) => {
          const m = members.find((x) => x.id === userId);
          if (m) {
            setConfirmModal({
              visible: true,
              userId,
              username: m.username,
              profileImage: m.profile_image,
            });
          }
        }}
        onTopUp={(userId) => {
          const m = members.find((x) => x.id === userId);
          if (m) {
            setDepositModal({ visible: true, mode: 'topup', userId, username: m.username });
          }
        }}
        onDeduct={(userId) => {
          const m = members.find((x) => x.id === userId);
          if (m) {
            setDepositModal({ visible: true, mode: 'deduct', userId, username: m.username });
          }
        }}
      />
    ));
  };

  // --- Main render ---
  const renderContent = () => {
    if (!selectedClubId) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No club selected</Text>
        </View>
      );
    }

    if (primaryTab === 'member') {
      switch (memberSubTab) {
        case 'manage':
          return renderMemberManage();
        case 'search':
          return (
            <MemberSearchSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchLoading={searchLoading}
              searchResults={searchResults}
              onAddMember={handleAddMember}
            />
          );
        case 'organization':
          return (
            <OrganizationSection
              orgData={orgData}
              orgLoading={orgLoading}
              selectedClubId={selectedClubId}
              onSubgroupPress={(subgroupId, subgroupName) =>
                navigation.navigate('AdminHubSubgroupDetail', {
                  clubId: selectedClubId,
                  subgroupId,
                  subgroupName,
                })
              }
            />
          );
      }
    } else {
      switch (eventSubTab) {
        case 'list':
          return (
            <EventListSection
              eventData={eventData}
              eventsLoading={eventsLoading}
              onEditEvent={(eventId) => navigation.navigate('AdminCreateEvent', { eventId })}
              onExportCsv={handleExportCsv}
            />
          );
        case 'task':
          return (
            <TaskListSection
              taskData={taskData}
              tasksLoading={tasksLoading}
              taskSearch={taskSearch}
              onTaskSearchChange={setTaskSearch}
              onSubmitSearch={fetchTasks}
              onApprove={handleApprove}
              onDecline={handleDecline}
              onViewDetails={(eventId) => navigation.navigate('EventDetail', { eventId })}
            />
          );
      }
    }
  };

  if (clubsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AdminHeader title="ADMIN HUB" />

      {/* Club Selector */}
      {renderClubSelector()}

      {/* Primary Segmented Control */}
      {renderSegmentedControl()}

      {/* Secondary Tabs */}
      {renderSecondaryTabs()}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Modals */}
      <DepositModal
        visible={depositModal.visible}
        mode={depositModal.mode}
        username={depositModal.username}
        onClose={() => setDepositModal({ visible: false, mode: 'topup', userId: '', username: '' })}
        onConfirm={handleDepositConfirm}
      />

      <ConfirmModal
        visible={confirmModal.visible}
        title={`Remove ${confirmModal.username} from your Club?`}
        profileImage={confirmModal.profileImage}
        onClose={() => setConfirmModal({ visible: false, userId: '', username: '', profileImage: null })}
        onConfirm={handleRemoveMember}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Club Selector
  clubSelector: {
    flexGrow: 0,
    marginBottom: 12,
  },
  clubSelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  clubLogo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray100,
  },
  clubLogoSelected: {
    borderWidth: 2.5,
    borderColor: '#1C1C1E',
  },
  clubLogoPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoText: {
    fontFamily: font.bold,
    fontSize: 18,
    color: colors.gray500,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 100,
    padding: 4,
    height: 40,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: '#1C1C1E',
    letterSpacing: -0.08,
  },
  segmentTextActive: {
    fontFamily: font.semibold,
  },

  // Secondary Tabs
  secondaryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 20,
  },
  secondaryTab: {
    paddingBottom: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  secondaryTabActive: {
    borderBottomColor: '#1C1C1E',
  },
  secondaryTabText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray500,
  },
  secondaryTabTextActive: {
    fontFamily: font.bold,
    color: '#1C1C1E',
  },

  // Scroll
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray500,
  },
});
