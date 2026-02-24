import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Participant } from '../../types/accessControl';

interface ParticipantDetailCardProps {
  participant: Participant;
}

const STATUS_COLORS: Record<string, string> = {
  registered: '#000000',
  requested: '#FF8D28',
  checked_in: '#34C759',
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
  const statusColor = STATUS_COLORS[participant.ticket_status] || '#000000';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {participant.profile_image ? (
            <Image
              source={{ uri: participant.profile_image }}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 16,
    shadowColor: '#000',
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
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#8E8E93',
  },
  nameSection: {
    flex: 1,
  },
  username: {
    fontFamily: 'Inter-Bold',
    fontSize: 21,
    color: '#000000',
  },
  legalName: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#595959',
    marginTop: 2,
  },
  statusBadge: {
    marginLeft: 8,
  },
  statusText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
  },
  detailsGrid: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  detailValue: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
    color: '#000000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
});
