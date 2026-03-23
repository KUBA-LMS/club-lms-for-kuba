import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Participant } from '../../types/accessControl';
import { colors, font } from '../../constants';
import { resolveImageUrl } from '../../utils/image';

interface ParticipantDetailCardProps {
  participant: Participant;
}

const STATUS_COLORS: Record<string, string> = {
  registered: colors.black,
  requested: '#FF8D28',
  checked_in: colors.success,
  not_applied: '#FF383C',
};

const STATUS_LABELS: Record<string, string> = {
  registered: 'Registered',
  requested: 'Requested',
  checked_in: 'Checked-in',
  not_applied: 'Not Applied',
};

export default function ParticipantDetailCard({
  participant,
}: ParticipantDetailCardProps) {
  const statusColor = STATUS_COLORS[participant.ticket_status] || colors.black;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {participant.profile_image ? (
            <Image
              source={{ uri: resolveImageUrl(participant.profile_image) }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {participant.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.nameSection}>
          <Text style={styles.username}>{participant.username}</Text>
          <Text style={styles.legalName}>{participant.legal_name}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {participant.ticket_status === 'checked_in' ||
            participant.ticket_status === 'registered'
              ? '\u2713 '
              : ''}
            {STATUS_LABELS[participant.ticket_status]}
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <DetailRow label="Student ID" value={participant.student_id || '-'} />
        <DetailRow label="Nationality" value={participant.nationality || '-'} />
        <DetailRow label="Gender" value={participant.gender || '-'} />
        <DetailRow
          label="Related Groups"
          value={
            participant.clubs.length > 0
              ? participant.clubs.map((c) => c.name).join(', ')
              : '-'
          }
        />
        {participant.checked_in_at && (
          <DetailRow
            label="Checked-in at"
            value={new Date(participant.checked_in_at).toLocaleTimeString(
              'en-US',
              { hour: '2-digit', minute: '2-digit' }
            )}
          />
        )}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.black,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.semibold,
    fontSize: 20,
    color: colors.gray500,
  },
  nameSection: {
    flex: 1,
  },
  username: {
    fontFamily: font.bold,
    fontSize: 21,
    color: colors.black,
  },
  legalName: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#595959',
    marginTop: 2,
  },
  statusBadge: {
    marginLeft: 8,
  },
  statusText: {
    fontFamily: font.semibold,
    fontSize: 12,
  },
  detailsGrid: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.gray500,
  },
  detailValue: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.black,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
});
