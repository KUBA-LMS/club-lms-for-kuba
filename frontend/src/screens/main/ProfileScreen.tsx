import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/auth';
import { MainStackParamList } from '../../navigation/types';
import {
  getMyRegistrations,
  RegistrationItem,
  getMyClubs,
  MyClubItem,
  getSettlementHistory,
  SettlementHistoryItem,
} from '../../services/user';
import {
  ArrowBackIcon,
  GearIcon,
  EditPencilIcon,
  ChevronDownIcon,
  CheckIcon,
  AlertTriangleIcon,
} from '../../components/icons';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<MainStackParamList>;

// --- Helpers ---

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimestamp = (dateString: string) => {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}${mo}${day} ${h}:${min}`;
};

interface StatusInfo {
  label: string;
  color: string;
  bgColor?: string;
  showCheck?: boolean;
  showAlert?: boolean;
}

function getStatusInfo(reg: RegistrationItem): StatusInfo {
  const eventDate = new Date(reg.event.event_date);
  const now = new Date();
  const isPast = eventDate < now;

  switch (reg.status) {
    case 'checked_in':
      return { label: 'Participated', color: colors.primary };
    case 'confirmed':
      if (isPast) {
        return {
          label: 'No-show',
          color: colors.error,
          bgColor: '#FFF4F4',
          showAlert: true,
        };
      }
      return { label: 'Registered', color: colors.black, showCheck: true };
    case 'pending':
      return {
        label: 'Requested',
        color: colors.warning,
        bgColor: 'rgba(255,141,40,0.3)',
      };
    case 'cancelled':
      return { label: 'Cancelled', color: colors.gray700 };
    default:
      return { label: reg.status, color: '#8E8E93' };
  }
}

// --- Main Component ---

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const typedUser = user as User | null;

  // Data state
  const [clubs, setClubs] = useState<MyClubItem[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<SettlementHistoryItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);

  // UI state
  const [settlementExpanded, setSettlementExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, s, r] = await Promise.all([
          getMyClubs(),
          getSettlementHistory(1, 20),
          getMyRegistrations(1, 50),
        ]);
        if (cancelled) return;
        setClubs(c);
        setSettlements(s.data);
        setRegistrations(r.data);
        if (c.length > 0) setSelectedClubId(c[0].id);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSettlement = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSettlementExpanded((p) => !p);
  }, []);

  const handleClubSelect = useCallback((id: string) => {
    setSelectedClubId(id);
  }, []);

  const initial = typedUser?.username?.charAt(0).toUpperCase() || 'U';

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ marginTop: 100 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My PAGE</Text>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <GearIcon size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Club Selector Row */}
        {clubs.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.clubScroll}
            contentContainerStyle={styles.clubScrollContent}
          >
            {clubs.map((club) => {
              const sel = club.id === selectedClubId;
              return (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubItem}
                  onPress={() => handleClubSelect(club.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.clubImage,
                      sel && styles.clubImageSelected,
                    ]}
                  >
                    {club.logo_image ? (
                      <Image
                        source={{ uri: club.logo_image }}
                        style={styles.clubLogo}
                      />
                    ) : (
                      <Text style={styles.clubInitial}>
                        {club.name.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[styles.clubName, sel && styles.clubNameSelected]}
                    numberOfLines={1}
                  >
                    {club.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Profile Card - Figma: border 1px #C5C5C5, borderRadius 10, h=95 */}
        <View style={styles.profileCard}>
          {/* Left zone: Avatar top-left, Username right of avatar, Edit bottom-left */}
          <View style={styles.profileLeft}>
            {/* Avatar - Figma: 56x56 at (14,14) */}
            <View style={styles.avatar}>
              {typedUser?.profile_image ? (
                <Image
                  source={{ uri: typedUser.profile_image }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{initial}</Text>
              )}
            </View>

            {/* Username - Figma: centered between avatar right edge and divider */}
            <View style={styles.usernameWrap}>
              <Text
                style={styles.username}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {typedUser?.username || 'User'}
              </Text>
            </View>

            {/* Edit - Figma: bottom-left below avatar */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.7}
            >
              <EditPencilIcon size={8} color="#000" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Vertical Divider - Figma: h=70 at x=194 */}
          <View style={styles.profileDivider} />

          {/* Right: Legal Name, Role, Student ID - Figma: right-aligned */}
          <View style={styles.profileRight}>
            <Text style={styles.legalName} numberOfLines={1}>
              {typedUser?.legal_name || ''}
            </Text>
            {typedUser?.role === 'admin' && (
              <Text style={styles.roleText}>Admin</Text>
            )}
            <Text style={styles.studentId}>
              #{typedUser?.student_id || ''}
            </Text>
          </View>
        </View>

        {/* Settlement History Card */}
        <TouchableOpacity
          style={[
            styles.depositCard,
            settlementExpanded && styles.depositCardExpanded,
          ]}
          onPress={toggleSettlement}
          activeOpacity={0.85}
        >
          <View style={styles.depositTop}>
            <View>
              <Text style={styles.depositLabel}>Settlement History</Text>
              <Text style={styles.depositAmount}>
                {settlements.length} record{settlements.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View
              style={[
                styles.chevron,
                settlementExpanded && styles.chevronFlipped,
              ]}
            >
              <ChevronDownIcon size={14} color="#000" />
            </View>
          </View>

          {settlementExpanded && (
            <View style={styles.txList}>
              {settlements.length === 0 ? (
                <Text style={styles.txEmpty}>No settlement history</Text>
              ) : (
                settlements.map((item, i) => {
                  const amt = Number(item.amount);
                  const isSent = item.direction === 'sent';
                  return (
                    <View key={item.id}>
                      <View style={styles.txRow}>
                        <View style={styles.txLeft}>
                          <Text style={styles.txDesc} numberOfLines={1}>
                            {isSent ? 'Sent to' : 'Received from'} {item.counterpart.username}
                          </Text>
                          <Text style={styles.txTime}>
                            {formatTimestamp(item.created_at)}
                          </Text>
                        </View>
                        <View style={styles.txRight}>
                          <Text
                            style={[
                              styles.txAmt,
                              { color: isSent ? colors.error : colors.primary },
                            ]}
                          >
                            {isSent ? '-' : '+'}{amt.toLocaleString()} KRW
                          </Text>
                          <Text style={styles.txBal}>
                            {item.status === 'confirmed' ? 'Confirmed' : item.status}
                          </Text>
                        </View>
                      </View>
                      {i < settlements.length - 1 && (
                        <View style={styles.txDivider} />
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* History Section - Figma: white card, borderRadius 30, shadow */}
        <View style={styles.historyOuter}>
          <View style={styles.historyCard}>
            {/* Figma: "History" Open_Sans:Bold 20px black */}
            <Text style={styles.historyTitle}>History</Text>

            {registrations.length === 0 ? (
              <Text style={styles.historyEmpty}>No registrations yet</Text>
            ) : (
              registrations.map((reg, idx) => {
                const si = getStatusInfo(reg);
                const poster = reg.event.images?.[0];

                return (
                  <View key={reg.id}>
                    <TouchableOpacity
                      style={[
                        styles.historyItem,
                        si.bgColor
                          ? { backgroundColor: si.bgColor }
                          : undefined,
                      ]}
                      onPress={() =>
                        navigation.navigate('EventDetail', {
                          eventId: reg.event.id,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      {/* Ticket thumbnail - Figma: 50x48, border 0.5px #C5C5C5, borderRadius 10 */}
                      <View style={styles.ticketThumb}>
                        {poster ? (
                          <Image
                            source={{ uri: poster }}
                            style={styles.ticketThumbImg}
                          />
                        ) : (
                          <View style={styles.ticketThumbEmpty}>
                            <Text style={styles.ticketThumbLetter}>
                              {reg.event.title.charAt(0)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Info area */}
                      <View style={styles.historyInfo}>
                        {/* Figma: Open_Sans:Regular 13px black */}
                        <Text
                          style={styles.historyEventTitle}
                          numberOfLines={1}
                        >
                          {reg.event.title}
                        </Text>

                        {/* Date row with pipe separator */}
                        <View style={styles.historyDateRow}>
                          <View style={styles.historyPipe} />
                          {/* Figma: Open_Sans:Regular 13px black */}
                          <Text style={styles.historyDate}>
                            {formatDate(reg.event.event_date)}
                          </Text>
                        </View>

                        {/* Status row */}
                        <View style={styles.historyStatusRow}>
                          {/* Figma: "Status:" Open_Sans:Regular 13px */}
                          <Text style={styles.historyStatusLabel}>Status:</Text>
                          {/* Figma: Open_Sans:Bold 13px, color varies */}
                          <Text
                            style={[
                              styles.historyStatusVal,
                              { color: si.color },
                            ]}
                          >
                            {si.label}
                          </Text>
                          {si.showCheck && (
                            <View style={styles.checkIconWrap}>
                              <CheckIcon size={16} color="#000" />
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Alert triangle for No-show */}
                      {si.showAlert && (
                        <View style={styles.alertIcon}>
                          <AlertTriangleIcon size={28} color={colors.error} />
                        </View>
                      )}

                      {/* Details link - Figma: 9px */}
                      <Text style={styles.detailsLink}>{'Details  >'}</Text>
                    </TouchableOpacity>

                    {idx < registrations.length - 1 && (
                      <View style={styles.historyDivider} />
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },

  // Header - Figma: "My PAGE" Porter_Sans_Block 20px center, tracking -0.08
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 50,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Platform.select({
      ios: 'PorterSansBlock',
      android: 'porter-sans-inline-block',
    }),
    fontSize: 20,
    color: '#000000',
    letterSpacing: -0.08,
    textAlign: 'center',
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C5C5C5',
  },

  // Club row - Figma: horizontal scroll, 50x50 clubs, selected=cyan border
  clubScroll: {
    flexGrow: 0,
    marginTop: 5,
  },
  clubScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
  },
  clubItem: {
    alignItems: 'center',
    width: 64,
  },
  clubImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  clubImageSelected: {
    borderWidth: 2,
    borderColor: '#00C0E8',
  },
  clubLogo: {
    width: '100%',
    height: '100%',
  },
  clubInitial: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000',
  },
  // Figma: club name Open_Sans 8px center, tracking -0.08
  clubName: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  clubNameSelected: {
    fontFamily: 'Inter-SemiBold',
  },

  // Profile Card - Figma: border 1px #C5C5C5, borderRadius 10, h=95, w=355
  profileCard: {
    flexDirection: 'row',
    marginHorizontal: 25,
    marginTop: 12,
    height: 95,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  // Left zone: 194px wide, uses absolute positioning to match Figma
  profileLeft: {
    width: 194,
    position: 'relative',
  },
  // Figma: avatar 56x56 circle at (14, 14)
  avatar: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    color: '#000',
  },
  // Figma: username centered between avatar right (76px) and divider (194px)
  usernameWrap: {
    position: 'absolute',
    left: 76,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontFamily: 'Inter-Bold',
    fontSize: 25,
    color: '#000000',
    textAlign: 'center',
  },
  // Figma: Edit button at bottom-left (14, 71), bg rgba(255,255,255,0.5)
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    position: 'absolute',
    bottom: 6,
    left: 14,
  },
  editBtnText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
  },
  // Figma: vertical divider h=70 centered vertically
  profileDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#C5C5C5',
    marginVertical: 12,
  },
  // Right zone: legal name, role, student ID - all right-aligned
  profileRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingVertical: 10,
  },
  // Figma: Open_Sans:Regular 13px black
  legalName: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#000000',
    textAlign: 'right',
  },
  // Figma: "Sup. leechan4" Open_Sans:Regular 13px #00C0E8
  roleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#00C0E8',
    textAlign: 'right',
    marginTop: 1,
  },
  // Figma: student ID Open_Sans:Regular 15px #595959
  studentId: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.gray700,
    textAlign: 'right',
    marginTop: 2,
  },

  // Deposit Card - Figma: bg #F8F9FA, borderRadius 20
  depositCard: {
    marginHorizontal: 19,
    marginTop: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  // Figma: expanded bg #E5E5E5
  depositCardExpanded: {
    backgroundColor: '#E5E5E5',
  },
  depositTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Figma: "Deposit" Open_Sans:Bold 15px #595959
  depositLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.gray700,
  },
  // Figma: amount Open_Sans:Bold 30px black
  depositAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 30,
    color: '#000000',
    marginTop: -2,
  },
  chevron: {
    padding: 4,
  },
  chevronFlipped: {
    transform: [{ rotate: '180deg' }],
  },

  // Transaction list (expanded deposit)
  txList: {
    marginTop: 8,
    paddingTop: 4,
  },
  txEmpty: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.gray700,
    textAlign: 'center',
    paddingVertical: 12,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  txLeft: {
    flex: 1,
    marginRight: 12,
  },
  // Figma: description Open_Sans:Bold 10px black
  txDesc: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#000000',
  },
  txTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.gray700,
    marginTop: 6,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmt: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  txBal: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
    marginTop: 2,
  },
  txBalBold: {
    fontFamily: 'Inter-SemiBold',
  },
  txDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C5C5C5',
  },

  // History section
  historyOuter: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  // Figma: white card borderRadius 30, shadow 15px 15px 50px rgba(0,0,0,0.15)
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    ...shadows.lg,
  },
  // Figma: "History" Open_Sans:Bold 20px black
  historyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#000000',
    marginBottom: 8,
    marginLeft: 4,
  },
  historyEmpty: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 40,
  },

  // History item - Figma: h=84 per item
  historyItem: {
    flexDirection: 'row',
    minHeight: 84,
    paddingVertical: 10,
    position: 'relative',
  },
  // Figma: ticket 50x48, border 0.5px #C5C5C5, borderRadius 10
  ticketThumb: {
    width: 50,
    height: 48,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#C5C5C5',
    overflow: 'hidden',
    marginTop: 8,
    marginLeft: 4,
  },
  ticketThumbImg: {
    width: '100%',
    height: '100%',
  },
  ticketThumbEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketThumbLetter: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#8E8E93',
  },

  historyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    paddingRight: 40,
  },
  // Figma: event title Open_Sans:Regular 13px black
  historyEventTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#000000',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  // Figma: small vertical pipe separator 10px
  historyPipe: {
    width: StyleSheet.hairlineWidth,
    height: 10,
    backgroundColor: '#C5C5C5',
    marginRight: 6,
  },
  // Figma: date Open_Sans:Regular 13px black
  historyDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#000000',
  },
  historyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  // Figma: "Status:" Open_Sans:Regular 13px
  historyStatusLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#000000',
    marginRight: 4,
  },
  // Figma: status value Open_Sans:Bold 13px
  historyStatusVal: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  checkIconWrap: {
    marginLeft: 4,
  },
  alertIcon: {
    position: 'absolute',
    right: 50,
    top: 16,
  },
  // Figma: "Details  >" 9px
  detailsLink: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.gray500,
    position: 'absolute',
    right: 4,
    bottom: 8,
  },
  historyDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C5C5C5',
  },
});
