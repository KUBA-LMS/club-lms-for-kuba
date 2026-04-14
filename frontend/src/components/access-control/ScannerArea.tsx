import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import { Vibration } from 'react-native';

interface ScannerAreaProps {
  isActive: boolean;
  onBarcodeScanned: (barcode: string) => void;
}

function InlineCameraInner({ onBarcodeScanned }: { onBarcodeScanned: (barcode: string) => void }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const scannedRef = useRef(false);
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const triggerFlash = useCallback(() => {
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [flashOpacity]);

  const codeScanner = useCodeScanner({
    codeTypes: ['code-128'],
    onCodeScanned: (codes) => {
      if (scannedRef.current) return;
      const value = codes[0]?.value;
      if (!value) return;
      scannedRef.current = true;
      Vibration.vibrate(40);
      triggerFlash();
      onBarcodeScanned(value);
      setTimeout(() => {
        scannedRef.current = false;
      }, 1500);
    },
  });

  const handleManualInput = useCallback(() => {
    Alert.prompt(
      'Manual Barcode Input',
      'Enter barcode string for testing',
      (text) => {
        if (text && text.trim()) {
          onBarcodeScanned(text.trim());
        }
      },
      'plain-text',
    );
  }, [onBarcodeScanned]);

  if (!hasPermission) {
    return (
      <View style={styles.cameraFallback}>
        <Text style={styles.fallbackText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.cameraFallback}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.cameraContainer}
      onLongPress={handleManualInput}
      activeOpacity={1}
    >
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />
      <View style={styles.scanLineOverlay}>
        <View style={styles.redLine} />
      </View>
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
        pointerEvents="none"
      />
      <View style={styles.manualHint}>
        <Text style={styles.manualHintText}>Long press to enter manually</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ScannerArea({ isActive, onBarcodeScanned }: ScannerAreaProps) {
  if (!isActive) {
    return (
      <View style={styles.container}>
        <View style={styles.inactiveArea}>
          <Text style={styles.inactiveText}>Please select an event first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <InlineCameraInner onBarcodeScanned={onBarcodeScanned} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inactiveArea: {
    width: '100%',
    height: 200,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  cameraContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  scanLineOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#FF383C',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  manualHint: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualHintText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  cameraFallback: {
    width: '100%',
    height: 200,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#FFFFFF',
  },
  permissionButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  permissionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
