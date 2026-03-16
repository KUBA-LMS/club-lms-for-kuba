import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { QRCodeIcon, PlusCircleIcon, ExitIcon } from '../icons';
import BarcodeScannerModal from '../onepass/BarcodeScannerModal';
import CreateGroupModal from './CreateGroupModal';
import LeaveGroupModal from './LeaveGroupModal';
import QRCodeModal from './QRCodeModal';
import { colors } from '../../constants';
import { resolveImageUrl } from '../../utils/image';
import {
  getMyGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  MyGroup,
} from '../../services/clubs';
import { wsService } from '../../services/websocket';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface GroupItemProps {
  group: MyGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLeave: (group: { id: string; name: string }) => void;
  onShowQR: (group: { id: string; name: string }) => void;
}

function GroupItem({
  group,
  isExpanded,
  onToggleExpand,
  onLeave,
  onShowQR,
}: GroupItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = useCallback(
    (
      _progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
      });
      return (
        <TouchableOpacity
          style={styles.leaveAction}
          onPress={() => {
            swipeableRef.current?.close();
            onLeave({ id: group.id, name: group.name });
          }}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <ExitIcon size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [group, onLeave],
  );

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
      >
        <View style={styles.groupItemContainer}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            {group.logo_image ? (
              <Image
                source={{ uri: resolveImageUrl(group.logo_image) }}
                style={styles.groupLogo}
              />
            ) : (
              <View style={[styles.groupLogo, styles.groupLogoPlaceholder]}>
                <Text style={styles.groupLogoText} numberOfLines={1}>
                  {group.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {group.role === 'lead' && (
              <View style={styles.leadBadge}>
                <Text style={styles.leadBadgeText}>Lead</Text>
              </View>
            )}
          </View>

          {/* Name + expand toggle */}
          <View style={styles.groupInfo}>
            <Text style={styles.groupName} numberOfLines={1}>
              {group.name}
            </Text>
          </View>

          {/* QR Code button */}
          <TouchableOpacity
            style={styles.qrIconButton}
            onPress={() => onShowQR({ id: group.id, name: group.name })}
            activeOpacity={0.6}
          >
            <QRCodeIcon size={18} color="#000000" />
          </TouchableOpacity>

          {group.subgroups.length > 0 && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={onToggleExpand}
              activeOpacity={0.6}
            >
              <Text style={styles.expandText}>
                {isExpanded ? 'Hide' : 'View'} Subgroups
              </Text>
            </TouchableOpacity>
          )}

          {/* Bottom border */}
          <View style={styles.itemSeparator} />
        </View>
      </Swipeable>

      {/* Subgroups */}
      {isExpanded &&
        group.subgroups.map((sub, idx) => (
          <View
            key={sub.id}
            style={styles.subgroupRow}
          >
            {/* Tree connector */}
            <View style={styles.treeConnector}>
              <View
                style={[
                  styles.treeVertical,
                  idx === group.subgroups.length - 1 && styles.treeVerticalLast,
                ]}
              />
              <View style={styles.treeHorizontal} />
            </View>

            {/* Green dot */}
            <View style={styles.greenDot} />

            {/* Subgroup logo */}
            {sub.logo_image ? (
              <Image
                source={{ uri: resolveImageUrl(sub.logo_image) }}
                style={styles.subgroupLogo}
              />
            ) : (
              <View
                style={[styles.subgroupLogo, styles.subgroupLogoPlaceholder]}
              >
                <Text style={styles.subgroupLogoText} numberOfLines={1}>
                  {sub.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.subgroupName} numberOfLines={1}>
              {sub.name}
            </Text>
          </View>
        ))}
    </>
  );
}

export default function JoinGroupsTab() {
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [leaveTarget, setLeaveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const [qrTarget, setQrTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyGroups();
      setGroups(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // --- WebSocket: real-time group join updates ---
  const groupIdsKey = groups.map((g) => g.id).join(',');
  useEffect(() => {
    if (groups.length === 0) return;

    const unsubs: (() => void)[] = [];
    for (const group of groups) {
      const channel = `club:${group.id}`;
      wsService.subscribe(channel);
      const off = wsService.on(channel, (msg) => {
        if ((msg as any).type === 'member_joined') {
          fetchGroups();
        }
      });
      unsubs.push(() => {
        off();
        wsService.unsubscribe(channel);
      });
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdsKey]);

  // --- QR scan ---
  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      setShowQRScanner(false);

      if (!UUID_REGEX.test(barcode)) {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid group.');
        return;
      }

      try {
        const result = await joinGroup(barcode);
        Alert.alert('Joined!', `You joined ${result.club.name}.`);
        fetchGroups();
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail || 'Failed to join group.';
        Alert.alert('Error', msg);
      }
    },
    [fetchGroups],
  );

  // --- Create group (subgroup under a club) ---
  const handleCreateGroup = useCallback(
    async (name: string, logoUri: string | null, parentId: string) => {
      setIsCreating(true);
      try {
        await createGroup(name, logoUri, parentId);
        setShowCreateModal(false);
        fetchGroups();
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail || 'Failed to create group.';
        Alert.alert('Error', msg);
      } finally {
        setIsCreating(false);
      }
    },
    [fetchGroups],
  );

  // --- Leave group ---
  const handleLeaveConfirm = useCallback(async () => {
    if (!leaveTarget) return;
    setIsLeaving(true);
    try {
      await leaveGroup(leaveTarget.id);
      setGroups((prev) => prev.filter((g) => g.id !== leaveTarget.id));
      setLeaveTarget(null);
    } catch {
      Alert.alert('Error', 'Failed to leave group.');
    } finally {
      setIsLeaving(false);
    }
  }, [leaveTarget]);

  // --- Expand/collapse ---
  const toggleExpand = useCallback((groupId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const renderGroupItem = useCallback(
    ({ item }: { item: MyGroup }) => (
      <GroupItem
        group={item}
        isExpanded={expandedIds.has(item.id)}
        onToggleExpand={() => toggleExpand(item.id)}
        onLeave={setLeaveTarget}
        onShowQR={setQrTarget}
      />
    ),
    [expandedIds, toggleExpand],
  );

  return (
    <View style={styles.container}>
      {/* Action buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => setShowQRScanner(true)}
          activeOpacity={0.7}
        >
          <QRCodeIcon size={20} color="#FFFFFF" />
          <Text style={styles.qrButtonText}>Join by QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButtonWrapper}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#FF8D28', '#00C9DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButton}
          >
            <PlusCircleIcon size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create Group</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Groups list */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.gray500} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No groups yet</Text>
              <Text style={styles.emptySubtext}>
                Join a group by QR code or create one
              </Text>
            </View>
          }
        />
      )}

      {/* QR Scanner */}
      <BarcodeScannerModal
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Create group modal */}
      <CreateGroupModal
        visible={showCreateModal}
        isCreating={isCreating}
        clubs={groups.map((g) => ({ id: g.id, name: g.name, logo_image: g.logo_image }))}
        onBack={() => setShowCreateModal(false)}
        onProceed={handleCreateGroup}
      />

      {/* Leave confirmation modal */}
      <LeaveGroupModal
        visible={leaveTarget !== null}
        groupName={leaveTarget?.name ?? ''}
        isLeaving={isLeaving}
        onBack={() => setLeaveTarget(null)}
        onProceed={handleLeaveConfirm}
      />

      {/* QR Code display modal */}
      <QRCodeModal
        visible={qrTarget !== null}
        groupId={qrTarget?.id ?? ''}
        groupName={qrTarget?.name ?? ''}
        onClose={() => setQrTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    gap: 8,
  },
  qrButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  createButtonWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    gap: 8,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.gray500,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.gray400,
    marginTop: 6,
  },
  listContent: {
    paddingBottom: 20,
  },
  // --- Group item ---
  groupItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  logoWrapper: {
    alignItems: 'center',
    marginRight: 12,
  },
  groupLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  groupLogoPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupLogoText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#8E8E93',
  },
  leadBadge: {
    marginTop: 3,
    backgroundColor: '#34C759',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  leadBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#000000',
  },
  qrIconButton: {
    padding: 8,
    marginRight: 4,
  },
  expandButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.primary,
  },
  itemSeparator: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
  },
  leaveAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  // --- Subgroup ---
  subgroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 36,
    paddingRight: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  treeConnector: {
    width: 20,
    height: '100%',
    position: 'relative',
  },
  treeVertical: {
    position: 'absolute',
    left: 0,
    top: -8,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#C5C5C5',
  },
  treeVerticalLast: {
    bottom: '50%',
  },
  treeHorizontal: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 16,
    height: 1.5,
    backgroundColor: '#C5C5C5',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  subgroupLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 8,
  },
  subgroupLogoPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subgroupLogoText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8E8E93',
  },
  subgroupName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
});
