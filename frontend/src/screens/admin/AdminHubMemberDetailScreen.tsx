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
import { ArrowBackIcon } from '../../components/icons';
import { SubgroupMember, getSubgroupMembers } from '../../services/adminHub';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RouteType = RouteProp<MainStackParamList, 'AdminHubMemberDetail'>;

export default function AdminHubMemberDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
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
        <Image source={{ uri: member.profile_image }} style={styles.avatar} />
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{adminUsername}</Text>
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
  nameCol: {
    marginLeft: 10,
    flex: 1,
  },
  memberUsername: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#1C1C1E',
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
