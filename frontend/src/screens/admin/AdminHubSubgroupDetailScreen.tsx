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
import { ArrowBackIcon, ChevronRightIcon } from '../../components/icons';
import { SubgroupMember, getSubgroupMembers } from '../../services/adminHub';

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
            <Image source={{ uri: member.profile_image }} style={styles.avatar} />
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
          <ChevronRightIcon size={16} color="#8E8E93" />
        )}
      </Wrapper>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subgroupName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
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
    backgroundColor: '#FFFFFF',
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
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#1C1C1E',
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
    backgroundColor: '#F8F9FA',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#8E8E93',
  },
  adminOverlay: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: '#007AFF',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  adminOverlayText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  leadOverlay: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: '#34C759',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  leadOverlayText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  nameCol: {
    marginLeft: 10,
    flex: 1,
  },
  memberUsername: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#1C1C1E',
  },
  managedCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 10,
  },
  depositCol: {
    alignItems: 'flex-end',
  },
  depositLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  depositAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#1C1C1E',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
});
