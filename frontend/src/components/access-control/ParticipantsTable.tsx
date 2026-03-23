import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Participant, TicketStatus } from '../../types/accessControl';

export interface ParticipantsTableHandle {
  scrollToUser: (userId: string) => void;
}

interface ParticipantsTableProps {
  participants: Participant[];
  selectedParticipantId?: string;
  onSelectParticipant: (participant: Participant) => void;
  mode: 'entry_control' | 'override';
  highlightedId?: string;
  highlightColor?: string;
}

const ROW_HEIGHT = 37;

const STATUS_COLORS: Record<TicketStatus, string> = {
  registered: '#000000',
  requested: '#FF8D28',
  checked_in: '#34C759',
  not_applied: '#FF383C',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  registered: 'Registered',
  requested: 'Requested',
  checked_in: 'Checked-in',
  not_applied: 'Not Applied',
};

const ROW_BORDER_COLORS: Record<string, string> = {
  entry_approved: '#34C759',
  entry_denied_pending: '#FF383C',
  double_checked_in: '#FFCC00',
  registered: '#000000',
  requested: '#FF8D28',
};

const ParticipantsTable = forwardRef<ParticipantsTableHandle, ParticipantsTableProps>(
  function ParticipantsTable(
    { participants, selectedParticipantId, onSelectParticipant, mode, highlightedId, highlightColor },
    ref,
  ) {
    const scrollRef = useRef<ScrollView>(null);
    const hasData = participants.length > 0;

    useImperativeHandle(ref, () => ({
      scrollToUser(userId: string) {
        const idx = participants.findIndex((p) => p.user_id === userId);
        if (idx >= 0 && scrollRef.current) {
          scrollRef.current.scrollTo({ y: idx * ROW_HEIGHT, animated: true });
        }
      },
    }));

    const renderRow = useCallback(
      (p: Participant, index: number) => {
        const isHighlighted = highlightedId === p.user_id;
        const isSelected = selectedParticipantId === p.user_id;
        const statusColor = STATUS_COLORS[p.ticket_status] || '#000000';
        const borderColor =
          isHighlighted && highlightColor
            ? highlightColor
            : isSelected
              ? ROW_BORDER_COLORS[p.ticket_status] || '#000000'
              : undefined;

        return (
          <TouchableOpacity
            key={p.user_id}
            style={[
              styles.row,
              borderColor ? { borderLeftWidth: 3, borderLeftColor: borderColor } : null,
              isSelected && styles.rowSelected,
            ]}
            onPress={() => onSelectParticipant(p)}
          >
            <Text style={[styles.cell, styles.noCol]}>{index + 1}</Text>
            <Text style={[styles.cell, styles.nameCol]} numberOfLines={1}>
              {p.legal_name}
            </Text>
            <Text style={[styles.cell, styles.groupCol]} numberOfLines={1}>
              {p.clubs.map((c) => c.name).join(', ') || '-'}
            </Text>
            <Text style={[styles.cell, styles.statusCol, { color: statusColor }]}>
              {p.ticket_status === 'checked_in' || p.ticket_status === 'registered'
                ? '\u2713 '
                : ''}
              {STATUS_LABELS[p.ticket_status]}
            </Text>
          </TouchableOpacity>
        );
      },
      [highlightedId, highlightColor, selectedParticipantId, onSelectParticipant],
    );

    return (
      <View style={styles.container}>
        <View style={[styles.headerRow, !hasData && styles.headerRowEmpty]}>
          <Text style={[styles.headerCell, styles.noCol]}>No.</Text>
          <Text style={[styles.headerCell, styles.nameCol]}>Legal Name</Text>
          <Text style={[styles.headerCell, styles.groupCol]}>Related Groups</Text>
          <Text style={[styles.headerCell, styles.statusCol]}>Check-in</Text>
        </View>
        {hasData ? (
          <ScrollView ref={scrollRef} style={styles.body}>
            {participants.map((p, i) => renderRow(p, i))}
          </ScrollView>
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No participants</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {participants.length}/{participants.length} participants
          </Text>
        </View>
      </View>
    );
  },
);

export default ParticipantsTable;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    maxHeight: 340,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerRowEmpty: {
    backgroundColor: '#C5C5C5',
  },
  headerCell: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  body: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  rowSelected: {
    backgroundColor: '#F5F5F5',
  },
  cell: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#000000',
  },
  noCol: {
    width: 32,
  },
  nameCol: {
    flex: 1,
  },
  groupCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  statusCol: {
    width: 80,
    textAlign: 'right',
  },
  emptyRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  footer: {
    backgroundColor: '#F9F9F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
});
