import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import AdminHeader from '../../components/admin/AdminHeader';
import { SubgroupMember, getSubgroupMembers } from '../../services/adminHub';
import { resolveImageUrl } from '../../utils/image';
import { colors, font } from '../../constants';

type RouteType = RouteProp<MainStackParamList, 'AdminHubMemberDetail'>;

export default function AdminHubMemberDetailScreen() {
  const route = useRoute<RouteType>();
  const { clubId, adminUserId, adminUsername } = route.params;

  const [members, setMembers] = useState<SubgroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch members managed by this admin
        // For now, reuse subgroup members endpoint filtered by admin
        const res = await getSubgroupMembers(clubId, adminUserId, 1, 100);
        setMembers(res.data);
      } catch (error) {
        console.error('Failed to fetch managed members:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId, adminUserId]);

  const renderMemberCard = (member: SubgroupMember) => (
    <View key={member.id} style={styles.memberCard}>
      {/* Avatar */}
      {member.profile_image ? (
        <Image source={{ uri: resolveImageUrl(member.profile_image) }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {member.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Username */}
      <View style={styles.nameCol}>
        <Text style={styles.memberUsername}>{member.username}</Text>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title="MEMBER" subtitle={adminUsername} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {members.map(renderMemberCard)}
          {members.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No members found</Text>
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
  nameCol: {
    marginLeft: 10,
    flex: 1,
  },
  memberUsername: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.gray900,
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
