import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

let QRCode: any = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch {
  // react-native-qrcode-svg not available
}

interface QRCodeModalProps {
  visible: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function QRCodeModal({
  visible,
  groupId,
  groupName,
  onClose,
  isAdmin = false,
}: QRCodeModalProps) {
  const [inviteAsAdmin, setInviteAsAdmin] = React.useState(false);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = 0.8;
      opacity.value = 0;
    }
  }, [visible, scale, opacity]);

  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, animatedCard]}>
          {/* Group Name */}
          <Text style={styles.title} numberOfLines={2}>
            {groupName}
          </Text>

          {/* Admin invite toggle */}
          {isAdmin && (
            <TouchableOpacity
              style={[
                styles.adminToggle,
                inviteAsAdmin && styles.adminToggleActive,
              ]}
              onPress={() => setInviteAsAdmin((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.adminToggleText,
                inviteAsAdmin && styles.adminToggleTextActive,
              ]}>
                Invite as Admin
              </Text>
            </TouchableOpacity>
          )}

          {/* QR Code */}
          <View style={styles.qrContainer}>
            {QRCode && groupId ? (
              <QRCode
                value={JSON.stringify({ club_id: groupId, role: inviteAsAdmin ? 'admin' : 'member' })}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR</Text>
              </View>
            )}
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Scan to join this group</Text>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
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
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: '#8E8E93',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 20,
  },
  closeButton: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  adminToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    marginBottom: 16,
  },
  adminToggleActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  adminToggleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#8E8E93',
  },
  adminToggleTextActive: {
    color: '#FFFFFF',
  },
});
