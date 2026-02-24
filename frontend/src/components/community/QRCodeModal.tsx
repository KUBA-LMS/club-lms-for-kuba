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
}

export default function QRCodeModal({
  visible,
  groupId,
  groupName,
  onClose,
}: QRCodeModalProps) {
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

          {/* QR Code */}
          <View style={styles.qrContainer}>
            {QRCode && groupId ? (
              <QRCode
                value={groupId}
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
    fontFamily: 'OpenSans-Bold',
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
    fontFamily: 'OpenSans-Bold',
    fontSize: 24,
    color: '#8E8E93',
  },
  subtitle: {
    fontFamily: 'OpenSans-Regular',
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
    fontFamily: 'OpenSans-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
