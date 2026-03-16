import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { getMyGroups, MyGroup } from '../../services/clubs';
import { SearchIcon, ArrowBackIcon, ChevronRightIcon, CheckIcon } from '../../components/icons';
import MemberCard from '../../components/admin/MemberCard';
import { resolveImageUrl } from '../../utils/image';
import DepositModal from '../../components/admin/DepositModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { useSearchDebounce } from '../../hooks/useSearchDebounce';
import {
  AdminMember,
  AdminMemberListResponse,
  SearchNonMember,
  AdminOrganization,
  SubgroupCard,
  AdminEvent,
  AdminEventListResponse,
  AdminTask,
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
        setClubs(data);
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
      // TODO: enable after prebuild with expo-file-system & expo-sharing
      Alert.alert('CSV Ready', `${csvData.split('\n').length - 1} rows exported. Rebuild app to enable file sharing.`);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  }, []);

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimeout = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
          <ActivityIndicator size="large" color="#000" />
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

  // --- Member Search ---
  const renderMemberSearch = () => (
    <>
      <View style={styles.searchInputContainer}>
        <SearchIcon size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Enter Username or Legal name"
          placeholderTextColor="#C5C5C5"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {searchLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        searchResults.map((user) => (
          <View key={user.id} style={styles.searchResultCard}>
            <View style={styles.searchResultRow}>
              {user.profile_image ? (
                <Image source={{ uri: resolveImageUrl(user.profile_image) }} style={styles.searchAvatar} />
              ) : (
                <View style={[styles.searchAvatar, styles.searchAvatarPlaceholder]}>
                  <Text style={styles.searchAvatarText}>
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.searchInfo}>
                <Text style={styles.searchUsername}>{user.username}</Text>
                {user.legal_name && (
                  <Text style={styles.searchLegalName}>LEGAL NAME: {user.legal_name}</Text>
                )}
                {user.common_groups.length > 0 && (
                  <View style={styles.commonGroupsRow}>
                    <Text style={styles.commonGroupsLabel}>Groups in common:</Text>
                    <View style={styles.commonGroupLogos}>
                      {user.common_groups.map((g) =>
                        g.logo_image ? (
                          <Image
                            key={g.id}
                            source={{ uri: resolveImageUrl(g.logo_image) }}
                            style={styles.commonGroupLogo}
                          />
                        ) : (
                          <View key={g.id} style={[styles.commonGroupLogo, styles.commonGroupLogoPlaceholder]}>
                            <Text style={styles.commonGroupLogoText}>{g.name.charAt(0)}</Text>
                          </View>
                        ),
                      )}
                    </View>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddMember(user.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Add +</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );

  // --- Organization ---
  const renderOrganization = () => {
    if (orgLoading || !orgData) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <>
        {/* My Profile Card */}
        <View style={styles.orgProfileCard}>
          {/* Top row: label + badges */}
          <View style={styles.orgProfileTopRow}>
            <Text style={styles.orgProfileLabel}>My Profile:</Text>
            <View style={styles.orgBadges}>
              <View style={styles.orgBadge}>
                <Text style={styles.orgBadgeText}>
                  Supervisor: {orgData.supervisor_names.length > 0
                    ? orgData.supervisor_names.join(', ')
                    : 'None'}
                </Text>
              </View>
              <View style={styles.orgBadgeLead}>
                <Text style={styles.orgBadgeText}>
                  Lead: {orgData.lead_name || 'None'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom row: avatar + username | separator | legal info */}
          <View style={styles.orgProfileRow}>
            {orgData.my_profile.profile_image ? (
              <Image source={{ uri: resolveImageUrl(orgData.my_profile.profile_image) }} style={styles.orgAvatar} />
            ) : (
              <View style={[styles.orgAvatar, styles.orgAvatarPlaceholder]}>
                <Text style={styles.orgAvatarText}>
                  {orgData.my_profile.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.orgUsername}>{orgData.my_profile.username}</Text>
            <View style={styles.orgProfileSeparator} />
            <View style={styles.orgLegalInfo}>
              {orgData.my_profile.legal_name && (
                <Text style={styles.orgLegalName}>{orgData.my_profile.legal_name}</Text>
              )}
              {orgData.my_profile.student_id && (
                <Text style={styles.orgStudentId}>#{orgData.my_profile.student_id}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{orgData.stats.subgroups}</Text>
            <Text style={styles.statLabel}>Subgroups</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{orgData.stats.admins}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{orgData.stats.normal_users}</Text>
            <Text style={styles.statLabel}>Normal Users</Text>
          </View>
        </View>

        {/* Subgroup Cards */}
        {orgData.subgroups.map((sg: SubgroupCard) => (
          <TouchableOpacity
            key={sg.id}
            style={styles.subgroupCard}
            onPress={() =>
              navigation.navigate('AdminHubSubgroupDetail', {
                clubId: selectedClubId!,
                subgroupId: sg.id,
                subgroupName: sg.name,
              })
            }
            activeOpacity={0.7}
          >
            {/* Arrow at top-right */}
            <View style={styles.subgroupArrowWrap}>
              <ChevronRightIcon size={16} color="#8E8E93" />
            </View>
            <View style={styles.subgroupCardRow}>
              {/* Logo */}
              {sg.logo_image ? (
                <Image source={{ uri: resolveImageUrl(sg.logo_image) }} style={styles.subgroupLogo} />
              ) : (
                <View style={[styles.subgroupLogo, styles.subgroupLogoPlaceholder]}>
                  <Text style={styles.subgroupLogoText}>{sg.name.charAt(0)}</Text>
                </View>
              )}

              {/* Name + Members */}
              <View style={styles.subgroupCardInfo}>
                <Text style={styles.subgroupCardName}>{sg.name}</Text>
                <Text style={styles.subgroupCardMembers}>
                  {sg.member_count} ({sg.admin_count}+{sg.normal_count}) Members
                </Text>
              </View>

              {/* Separator */}
              <View style={styles.subgroupCardSeparator} />

              {/* Leads */}
              <View style={styles.subgroupLeadCol}>
                {sg.leads.length > 0 ? (
                  <>
                    <Text style={styles.leadNames}>
                      {sg.leads.map((l) => l.username).join(', ')}
                    </Text>
                    <View style={styles.subgroupLeadRow}>
                      {sg.leads.map((lead) =>
                        lead.profile_image ? (
                          <Image
                            key={lead.id}
                            source={{ uri: resolveImageUrl(lead.profile_image) }}
                            style={styles.leadAvatar}
                          />
                        ) : (
                          <View key={lead.id} style={[styles.leadAvatar, styles.leadAvatarPlaceholder]}>
                            <Text style={styles.leadAvatarText}>{lead.username.charAt(0)}</Text>
                          </View>
                        ),
                      )}
                      <View style={styles.leadBadge}>
                        <Text style={styles.leadBadgeText}>Lead</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={styles.leadNames}>No Lead</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  // --- Event List ---
  const renderEventCard = (event: AdminEvent) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.eventRow}>
        {/* Thumbnail with Edit overlay */}
        <View style={styles.eventThumbWrap}>
          {event.images.length > 0 ? (
            <Image source={{ uri: resolveImageUrl(event.images[0]) }} style={styles.eventThumb} />
          ) : (
            <View style={[styles.eventThumb, styles.eventThumbPlaceholder]} />
          )}
          <TouchableOpacity
            style={styles.editOverlay}
            onPress={() => navigation.navigate('AdminCreateEvent', { eventId: event.id })}
            activeOpacity={0.7}
          >
            <Text style={styles.editOverlayText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.eventInfoCol}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.eventBadgeRow}>
            <View
              style={[
                styles.eventBadge,
                event.event_type === 'official' ? styles.badgeOfficial : styles.badgePrivate,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {event.event_type === 'official' ? 'Official' : 'Private'}
              </Text>
            </View>
            <View
              style={[
                styles.eventBadge,
                event.cost_type === 'free'
                  ? styles.badgeFree
                  : event.cost_type === 'one_n'
                    ? styles.badgeOneN
                    : styles.badgePaid,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {event.cost_type === 'free'
                  ? 'Free'
                  : event.cost_type === 'one_n'
                    ? '1/N'
                    : 'Prepaid'}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.eventStatus,
              event.status === 'open' ? styles.statusOpen : styles.statusExpired,
            ]}
          >
            Status: {event.status === 'open' ? 'Open' : 'Expired'}
          </Text>
        </View>

        {/* Separator + Date + CSV */}
        <View style={styles.eventSeparator} />
        <View style={styles.eventRightCol}>
          <Text style={styles.eventDate}>{formatEventDate(event.event_date)}</Text>
          <TouchableOpacity
            style={styles.csvButton}
            onPress={() => handleExportCsv(event.id, event.title)}
            activeOpacity={0.7}
          >
            <Text style={styles.csvButtonText}>Download CSV Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEventList = () => {
    if (eventsLoading || !eventData) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <>
        {eventData.upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {eventData.upcoming.map(renderEventCard)}
          </>
        )}
        {eventData.past.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {eventData.past.map(renderEventCard)}
          </>
        )}
        {eventData.upcoming.length === 0 && eventData.past.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        )}
      </>
    );
  };

  // --- Task List ---
  const renderTaskCard = (task: AdminTask, isCurrent: boolean) => (
    <View key={task.registration_id} style={styles.taskCard}>
      <View style={styles.taskRow}>
        {/* Left: text content */}
        <View style={styles.taskLeftCol}>
          <Text style={styles.taskText}>
            <Text style={styles.taskUsername}>{task.user.username}</Text>
            {' requested registration for:'}
          </Text>
          <Text style={styles.taskEventTitle}>
            {task.event.title}({formatEventDate(task.event.event_date)})
          </Text>
          <View style={styles.taskBadgeRow}>
            <View
              style={[
                styles.eventBadge,
                task.event.event_type === 'official' ? styles.badgeOfficial : styles.badgePrivate,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {task.event.event_type === 'official' ? 'Official' : 'Private'}
              </Text>
            </View>
            <View
              style={[
                styles.eventBadge,
                task.event.cost_type === 'free'
                  ? styles.badgeFree
                  : task.event.cost_type === 'one_n'
                    ? styles.badgeOneN
                    : styles.badgePaid,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {task.event.cost_type === 'free'
                  ? 'Free'
                  : task.event.cost_type === 'one_n'
                    ? '1/N'
                    : 'Prepaid'}
              </Text>
            </View>
          </View>
          <Text style={styles.taskTimeout}>
            Timeout : {formatTimeout(task.timeout_seconds)}
          </Text>
        </View>

        {/* Separator */}
        <View style={styles.taskSeparator} />

        {/* Right: date + action + details */}
        <View style={styles.taskRightCol}>
          <Text style={styles.taskRelDate}>
            {formatRelativeDate(task.created_at)}
          </Text>
          {isCurrent ? (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprove(task.registration_id)}
              activeOpacity={0.7}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          ) : task.status === 'confirmed' ? (
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedBadgeText}>Approved</Text>
              <CheckIcon size={12} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.declinedBadge}>
              <Text style={styles.declinedBadgeText}>Declined</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.detailsLink}
            onPress={() =>
              navigation.navigate('EventDetail', { eventId: task.event.id })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.detailsLinkText}>details {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTaskList = () => {
    if (tasksLoading || !taskData) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <>
        <View style={styles.taskSearchContainer}>
          <TextInput
            style={styles.taskSearchInput}
            value={taskSearch}
            onChangeText={(text) => {
              setTaskSearch(text);
            }}
            onSubmitEditing={fetchTasks}
            placeholder="Enter Username or Event Name"
            placeholderTextColor="#C5C5C5"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {taskSearch ? (
            <TouchableOpacity
              onPress={() => { setTaskSearch(''); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          ) : (
            <SearchIcon size={18} color="#8E8E93" />
          )}
        </View>

        {taskData.current.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Current Tasks</Text>
            {taskData.current.map((t) => renderTaskCard(t, true))}
          </>
        )}
        {taskData.history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>History</Text>
            {taskData.history.map((t) => renderTaskCard(t, false))}
          </>
        )}
        {taskData.current.length === 0 && taskData.history.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        )}
      </>
    );
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
          return renderMemberSearch();
        case 'organization':
          return renderOrganization();
      }
    } else {
      switch (eventSubTab) {
        case 'list':
          return renderEventList();
        case 'task':
          return renderTaskList();
      }
    }
  };

  if (clubsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowBackIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADMIN HUB</Text>
        <View style={{ width: 24 }} />
      </View>

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
    backgroundColor: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontFamily: 'Gafata-Regular',
    fontSize: 11,
    color: '#1C1C1E',
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    borderColor: '#E5E5EA',
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
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#8E8E93',
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
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1C1C1E',
    letterSpacing: -0.08,
  },
  segmentTextActive: {
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  secondaryTabTextActive: {
    fontFamily: 'Inter_700Bold',
    color: '#1C1C1E',
  },

  // Scroll
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#8E8E93',
  },

  // Search
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 16,
  },
  taskSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#1C1C1E',
    padding: 0,
  },

  // Search Results
  searchResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  searchAvatarPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAvatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#8E8E93',
  },
  searchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchUsername: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#1C1C1E',
  },
  searchLegalName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  commonGroupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  commonGroupsLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  commonGroupLogos: {
    flexDirection: 'row',
    gap: 4,
  },
  commonGroupLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  commonGroupLogoPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commonGroupLogoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#8E8E93',
  },
  addButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Organization
  orgProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  orgProfileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orgProfileLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
  orgBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orgBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orgBadgeLead: {
    backgroundColor: '#34C759',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orgBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  orgProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  orgAvatarPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgAvatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#8E8E93',
  },
  orgUsername: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#1C1C1E',
    marginLeft: 10,
  },
  orgProfileSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  orgLegalInfo: {
    flex: 1,
  },
  orgLegalName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#1C1C1E',
  },
  orgStudentId: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1C1C1E',
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Subgroup Cards
  subgroupCard: {
    position: 'relative',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  subgroupArrowWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  subgroupCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subgroupLogo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  subgroupLogoPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subgroupLogoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#8E8E93',
  },
  subgroupCardInfo: {
    marginLeft: 10,
  },
  subgroupCardName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1C1C1E',
  },
  subgroupCardMembers: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  subgroupCardSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  subgroupLeadCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  subgroupLeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  leadAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  leadAvatarPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#8E8E93',
  },
  leadNames: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#1C1C1E',
  },
  leadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  leadBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Event Cards (horizontal layout matching Figma)
  eventCard: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
    paddingHorizontal: 0,
    marginLeft: 0,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventThumbWrap: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  eventThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  eventThumbPlaceholder: {
    backgroundColor: '#E8E8ED',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editOverlayText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  eventInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#1C1C1E',
  },
  eventBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  eventBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeOfficial: {
    backgroundColor: '#1C1C1E',
  },
  badgePrivate: {
    backgroundColor: '#34C759',
  },
  badgeFree: {
    backgroundColor: '#34C759',
  },
  badgeOneN: {
    backgroundColor: '#007AFF',
  },
  badgePaid: {
    backgroundColor: '#FF69B4',
  },
  eventBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  eventStatus: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    marginTop: 4,
  },
  statusOpen: {
    color: '#34C759',
  },
  statusExpired: {
    color: '#8E8E93',
  },
  eventSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 50,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 10,
  },
  eventRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
  },
  eventDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  csvButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  csvButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#1C1C1E',
  },

  // Section Title
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },

  // Task Cards (horizontal layout with separator)
  taskCard: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
  },
  taskRow: {
    flexDirection: 'row',
  },
  taskLeftCol: {
    flex: 1,
  },
  taskText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#1C1C1E',
  },
  taskUsername: {
    fontFamily: 'Inter_700Bold',
  },
  taskEventTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#1C1C1E',
    marginTop: 2,
  },
  taskBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  taskTimeout: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#FF383C',
    marginTop: 4,
  },
  taskSeparator: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: '#E5E5EA',
    marginHorizontal: 10,
  },
  taskRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 90,
  },
  taskRelDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
  },
  approveButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  approveButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  detailsLink: {
    marginTop: 6,
  },
  detailsLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approvedBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  declinedBadge: {
    borderWidth: 1,
    borderColor: '#FF383C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  declinedBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#FF383C',
  },

  // Task search
  taskSearchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1C1C1E',
    padding: 0,
  },
  clearButton: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#8E8E93',
    paddingHorizontal: 4,
  },
});
