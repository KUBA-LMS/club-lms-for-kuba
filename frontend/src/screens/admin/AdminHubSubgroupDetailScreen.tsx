import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { ChevronRightIcon } from '../../components/icons';
import AdminHeader from '../../components/admin/AdminHeader';
import { SubgroupMember, getSubgroupMembers } from '../../services/adminHub';
import { resolveImageUrl } from '../../utils/image';
import { colors, font } from '../../constants';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RouteType = RouteProp<MainStackParamList, 'AdminHubSubgroupDetail'>;

export default function AdminHubSubgroupDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { clubId, subgroupId, subgroupName } = route.params;

  const [members, setMembers] = useState<SubgroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSubgroupMembers(clubId, subgroupId, 1, 100);
        setMembers(res.data);
      } catch (error) {
        console.error('Failed to fetch subgroup members:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId, subgroupId]);

  const hasManagedMembers = (member: SubgroupMember) =>
    member.is_admin && member.managed_member_count != null && member.managed_member_count > 0;

  const renderMemberCard = (member: SubgroupMember) => {
    const canDrillDown = hasManagedMembers(member);
    const Wrapper = canDrillDown ? TouchableOpacity : View;
    const wrapperProps = canDrillDown
      ? {
          onPress: () =>
            navigation.navigate('AdminHubMemberDetail', {
              clubId,
              adminUserId: member.id,
              adminUsername: member.username,
            }),
          activeOpacity: 0.7,
        }
      : {};

    return (
      <Wrapper key={member.id} style={styles.memberCard} {...(wrapperProps as any)}>
        {/* Avatar with badge overlay */}
        <View style={styles.avatarWrap}>
          {member.profile_image ? (
            <Image source={{ uri: resolveImageUrl(member.profile_image) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {member.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {member.is_admin && (
            <View style={styles.adminOverlay}>
              <Text style={styles.adminOverlayText}>Admin</Text>
            </View>
          )}
          {member.club_role === 'lead' && (
            <View style={styles.leadOverlay}>
              <Text style={styles.leadOverlayText}>Lead</Text>
            </View>
          )}
        </View>

        {/* Name + managed count */}
        <View style={styles.nameCol}>
          <Text style={styles.memberUsername}>{member.username}</Text>
          {canDrillDown && (
            <Text style={styles.managedCount}>
              {member.managed_member_count} ({member.managed_admin_count ?? 0}+
              {member.managed_normal_count ?? 0}) Members
            </Text>
          )}
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Deposit */}
        <View style={styles.depositCol}>
          <Text style={styles.depositLabel}>Deposit</Text>
          <Text style={styles.depositAmount}>
            {Number(member.deposit_balance).toLocaleString()} KRW
          </Text>
        </View>

        {/* Arrow for drill-down */}
        {canDrillDown && (
          <ChevronRightIcon size={16} color={colors.gray500} />
        )}
      </Wrapper>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title="SUBGROUP" subtitle={subgroupName} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {members.map(renderMemberCard)}
          {members.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No members in this subgroup</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    backgroundColor: colors.surface,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  avatarWrap: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.bold,
    fontSize: 18,
    color: colors.gray500,
  },
  adminOverlay: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: colors.primary,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  adminOverlayText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.white,
  },
  leadOverlay: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: colors.success,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  leadOverlayText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.white,
  },
  nameCol: {
    marginLeft: 10,
    flex: 1,
  },
  memberUsername: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.gray900,
  },
  managedCount: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: colors.gray100,
    marginHorizontal: 10,
  },
  depositCol: {
    alignItems: 'flex-end',
  },
  depositLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
  },
  depositAmount: {
    fontFamily: font.bold,
    fontSize: 18,
    color: colors.gray900,
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray500,
  },
});
