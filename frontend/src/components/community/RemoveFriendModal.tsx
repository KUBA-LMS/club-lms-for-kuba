import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface RemoveFriendModalProps {
  visible: boolean;
  username: string;
  isRemoving: boolean;
  onBack: () => void;
  onProceed: () => void;
}

export default function RemoveFriendModal({
  visible,
  username,
  isRemoving,
  onBack,
  onProceed,
}: RemoveFriendModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.message}>
            Remove <Text style={styles.bold}>{username}</Text>
            {'\n'}from your Friend List?
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              disabled={isRemoving}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={onProceed}
              activeOpacity={0.7}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.proceedButtonText}>Proceed</Text>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  message: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  bold: {
    fontFamily: 'OpenSans-Bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  proceedButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
