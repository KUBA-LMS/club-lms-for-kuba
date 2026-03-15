import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Platform,
} from 'react-native';
import { ChevronDownIcon, TrashIcon } from '../icons';
import { AdminMember, DepositTransactionInfo } from '../../services/adminHub';

interface MemberCardProps {
  member: AdminMember;
  onToggleAdmin: (userId: string) => void;
  onToggleLead: (userId: string) => void;
  onRemove: (userId: string) => void;
  onTopUp: (userId: string) => void;
  onDeduct: (userId: string) => void;
}

export default function MemberCard({
  member,
  onToggleAdmin,
  onToggleLead,
  onRemove,
  onTopUp,
  onDeduct,
}: MemberCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatAmount = (amount: number) => {
    if (amount >= 0) return `+${amount.toLocaleString()}`;
    return amount.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${y}${mo}${da} ${h}:${mi}`;
  };

  return (
    <View style={styles.card}>
      {/* Top row: avatar + username + trash */}
      <View style={styles.topRow}>
        <View style={styles.profileSection}>
          {member.profile_image ? (
            <Image source={{ uri: member.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {member.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.nameSection}>
            <Text style={styles.username}>{member.username}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.legalSection}>
            {member.legal_name && (
              <Text style={styles.legalName}>{member.legal_name}</Text>
            )}
            {member.student_id && (
              <Text style={styles.studentId}>#{member.student_id}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onRemove(member.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <TrashIcon size={18} color="#FF383C" />
        </TouchableOpacity>
      </View>

      {/* Info fields */}
      <View style={styles.infoRow}>
        {member.nationality && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Nationality</Text>
            <Text style={styles.infoValue}>{member.nationality}</Text>
          </View>
        )}
        {member.gender && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{member.gender}</Text>
          </View>
        )}
      </View>

      {/* Role toggles */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>Admin</Text>
          <Switch
            value={member.is_admin}
            onValueChange={() => onToggleAdmin(member.id)}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E5EA"
          />
        </View>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>Lead</Text>
          <Switch
            value={member.club_role === 'lead'}
            onValueChange={() => onToggleLead(member.id)}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E5EA"
          />
        </View>
      </View>

      {/* Deposit section */}
      <View style={styles.depositRow}>
        <View style={styles.depositBox}>
          <Text style={styles.depositLabel}>Deposit</Text>
          <Text style={styles.depositAmount}>
            {Number(member.deposit.balance).toLocaleString()} KRW
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deductCircle}
          onPress={() => onDeduct(member.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.circleText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topUpCircle}
          onPress={() => onTopUp(member.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.circleText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Expandable deposit history */}
      <View style={styles.depositSection}>

        {/* Expandable transaction history */}
        {member.deposit.recent_transactions.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.historyToggle}
              onPress={() => setExpanded(!expanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.historyToggleText}>Transaction History</Text>
              <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon size={14} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            {expanded && (
              <View style={styles.historyList}>
                {member.deposit.recent_transactions.map((tx: DepositTransactionInfo) => (
                  <View key={tx.id} style={styles.historyItem}>
                    <View style={styles.historyRow1}>
                      <Text style={styles.historyDesc} numberOfLines={1}>
                        {tx.description}
                      </Text>
                      <Text
                        style={[
                          styles.historyAmount,
                          { color: tx.amount >= 0 ? '#34C759' : '#FF383C' },
                        ]}
                      >
                        {formatAmount(tx.amount)}
                      </Text>
                    </View>
                    <View style={styles.historyRow2}>
                      <Text style={styles.historyBalance}>
                        Deposit: {Number(tx.balance_after).toLocaleString()}
                      </Text>
                      <Text style={styles.historyDate}>{formatDate(tx.created_at)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#8E8E93',
  },
  nameSection: {
    marginLeft: 10,
  },
  username: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    color: '#000000',
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: '#C5C5C5',
    marginHorizontal: 12,
  },
  legalSection: {
    flex: 1,
  },
  legalName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#000000',
  },
  studentId: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  infoValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#000000',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
    paddingVertical: 4,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#000000',
  },
  depositRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  depositBox: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  depositLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#AEAEB2',
  },
  depositAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  deductCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUpCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF383C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  depositSection: {
    marginTop: 4,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },
  historyToggleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  historyRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  historyDesc: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  historyBalance: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  historyDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  historyAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
});
