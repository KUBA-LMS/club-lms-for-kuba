import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { ChevronDownIcon, TrashIcon } from '../icons';
import { AdminMember, DepositTransactionInfo } from '../../services/adminHub';
import { colors, font } from '../../constants';
import Avatar from '../common/Avatar';

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
          <Avatar uri={member.profile_image} size={44} name={member.username} />
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
          <TrashIcon size={18} color={colors.error} />
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
            trackColor={{ false: colors.gray100, true: colors.success }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.gray100}
          />
        </View>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>Lead</Text>
          <Switch
            value={member.club_role === 'lead'}
            onValueChange={() => onToggleLead(member.id)}
            trackColor={{ false: colors.gray100, true: colors.success }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.gray100}
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
                <ChevronDownIcon size={14} color={colors.gray500} />
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
                          { color: tx.amount >= 0 ? colors.success : colors.error },
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
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  nameSection: {
    marginLeft: 10,
  },
  username: {
    fontFamily: font.bold,
    fontSize: 21,
    color: colors.text.primary,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: colors.gray100,
    marginHorizontal: 12,
  },
  legalSection: {
    flex: 1,
  },
  legalName: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.text.primary,
  },
  studentId: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  infoBox: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  infoLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
  },
  infoValue: {
    fontFamily: font.bold,
    fontSize: 12,
    color: colors.text.primary,
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
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  depositRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  depositBox: {
    flex: 1,
    backgroundColor: colors.gray900,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  depositLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray400,
  },
  depositAmount: {
    fontFamily: font.bold,
    fontSize: 20,
    color: colors.white,
  },
  deductCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUpCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontFamily: font.bold,
    fontSize: 24,
    color: colors.white,
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
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.gray500,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray50,
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
    fontFamily: font.bold,
    fontSize: 12,
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  historyBalance: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
  },
  historyDate: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
  },
  historyAmount: {
    fontFamily: font.bold,
    fontSize: 14,
  },
});
