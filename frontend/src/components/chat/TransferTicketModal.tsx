import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ArrowRightIcon } from '../icons';
import { TicketBrief } from '../../types/chat';
import * as chatApi from '../../services/chat';

interface TransferTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (ticket: TicketBrief) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TransferTicketModal({
  visible,
  onClose,
  onSelect,
}: TransferTicketModalProps) {
  const [tickets, setTickets] = useState<TicketBrief[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      chatApi
        .getMyTickets()
        .then((res) => {
          setTickets(res.data.filter((t) => !t.is_used));
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [visible]);

  const renderTicketItem = ({ item }: { item: TicketBrief }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => onSelect(item)}
      activeOpacity={0.6}
    >
      <View style={styles.arrowCircle}>
        <ArrowRightIcon size={16} color="#8B5CF6" />
      </View>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {item.event_title || 'Event Ticket'}
        </Text>
        <Text style={styles.ticketDate}>
          {item.event_date ? formatDate(item.event_date) : formatDate(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Transfer Ticket</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#8E8E93" style={{ marginVertical: 40 }} />
          ) : tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tickets available</Text>
            </View>
          ) : (
            <FlatList
              data={tickets}
              renderItem={renderTicketItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}

          <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '70%',
    padding: 20,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#000000',
    marginBottom: 16,
    marginLeft: 4,
  },
  list: {
    maxHeight: 300,
  },
  listContent: {
    gap: 2,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#000000',
    marginBottom: 2,
  },
  ticketDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#8E8E93',
  },
  backButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  backText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
