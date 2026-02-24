import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { TrashIcon } from '../icons';
import { ChatMember } from '../../types/chat';

interface RequestSplitModalProps {
  visible: boolean;
  members: ChatMember[];
  currentUserId: string;
  onClose: () => void;
  onProceed: (amount: number, participantIds: string[]) => void;
}

export default function RequestSplitModal({
  visible,
  members,
  currentUserId,
  onClose,
  onProceed,
}: RequestSplitModalProps) {
  const [amountText, setAmountText] = useState('');
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const participants = useMemo(() => {
    return members.filter((m) => !excludedIds.has(m.id));
  }, [members, excludedIds]);

  const amount = parseInt(amountText, 10) || 0;
  const splitAmount = participants.length > 0 ? Math.ceil(amount / participants.length) : 0;

  const handleRemoveMember = (memberId: string) => {
    if (memberId === currentUserId) return; // Can't remove self
    if (participants.length <= 2) {
      Alert.alert('', 'At least 2 participants required');
      return;
    }
    setExcludedIds((prev) => new Set(prev).add(memberId));
  };

  const handleProceed = () => {
    if (amount <= 0) return;
    const otherParticipantIds = participants
      .filter((m) => m.id !== currentUserId)
      .map((m) => m.id);
    onProceed(amount, otherParticipantIds);
  };

  const canProceed = amount > 0 && participants.length >= 2;

  const renderMemberItem = ({ item }: { item: ChatMember }) => {
    const isMe = item.id === currentUserId;

    return (
      <View style={styles.memberRow}>
        <View style={styles.memberLeft}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.memberAvatar} />
          ) : (
            <View style={[styles.memberAvatar, styles.memberAvatarPlaceholder]} />
          )}
          <Text style={[styles.memberName, isMe && styles.memberNameMe]}>
            {isMe ? 'Me' : item.username}
          </Text>
        </View>
        <View style={styles.memberRight}>
          <Text style={styles.splitAmountText}>
            {amount > 0 ? `${splitAmount.toLocaleString()} KRW` : '-'}
          </Text>
          {!isMe && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMember(item.id)}
              activeOpacity={0.6}
            >
              <TrashIcon size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Request 1/N</Text>

          {/* Amount input */}
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0"
              placeholderTextColor="#C5C5C5"
              keyboardType="number-pad"
              maxLength={10}
            />
            <Text style={styles.currencyLabel}>KRW</Text>
          </View>

          {/* TO section */}
          <Text style={styles.toLabel}>TO:</Text>
          <FlatList
            data={participants}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            style={styles.memberList}
            scrollEnabled={participants.length > 5}
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.proceedButton, !canProceed && styles.proceedButtonDisabled]}
              onPress={handleProceed}
              disabled={!canProceed}
              activeOpacity={0.7}
            >
              <Text style={[styles.proceedText, !canProceed && styles.proceedTextDisabled]}>
                Proceed
              </Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '80%',
    padding: 20,
  },
  title: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  amountInput: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 32,
    color: '#000000',
    textAlign: 'right',
    minWidth: 80,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  currencyLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#8E8E93',
  },
  toLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 10,
  },
  memberList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  memberAvatarPlaceholder: {
    backgroundColor: '#FF9500',
  },
  memberName: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 15,
    color: '#000000',
  },
  memberNameMe: {
    color: '#00C0E8',
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitAmountText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#000000',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  proceedButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  proceedText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  proceedTextDisabled: {
    color: '#8E8E93',
  },
});
