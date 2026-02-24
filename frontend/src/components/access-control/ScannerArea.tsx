import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';

let CameraView: any = null;
let useCameraPermissions: any = null;

try {
  const expoCamera = require('expo-camera');
  CameraView = expoCamera.CameraView;
  useCameraPermissions = expoCamera.useCameraPermissions;
} catch {
  // expo-camera not available (e.g. on web)
}

interface ScannerAreaProps {
  isActive: boolean;
  onBarcodeScanned: (barcode: string) => void;
}

function InlineCamera({ onBarcodeScanned }: { onBarcodeScanned: (barcode: string) => void }) {
  const [scanned, setScanned] = useState(false);

  const handleScan = useCallback(
    (result: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      onBarcodeScanned(result.data);
      setTimeout(() => setScanned(false), 2000);
    },
    [scanned, onBarcodeScanned],
  );

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

  if (!CameraView || !useCameraPermissions) {
    return (
      <TouchableOpacity style={styles.cameraFallback} onPress={handleManualInput}>
        <Text style={styles.fallbackText}>Camera not available</Text>
        <Text style={styles.tapHint}>Tap to enter barcode manually</Text>
      </TouchableOpacity>
    );
  }

  return (
    <InlineCameraInner
      onBarcodeScanned={handleScan}
      onManualInput={handleManualInput}
      scanned={scanned}
    />
  );
}

function InlineCameraInner({
  onBarcodeScanned,
  onManualInput,
  scanned,
}: {
  onBarcodeScanned: (result: { data: string }) => void;
  onManualInput: () => void;
  scanned: boolean;
}) {
  const [permission, requestPermission] = useCameraPermissions!();

  if (!permission) {
    return (
      <View style={styles.cameraFallback}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.cameraFallback}>
        <Text style={styles.fallbackText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.cameraContainer}
      onLongPress={onManualInput}
      activeOpacity={1}
    >
      <CameraView
        style={styles.camera}
        facing="front"
        barcodeScannerSettings={{
          barcodeTypes: ['code128', 'code39', 'code93', 'ean13', 'ean8', 'qr'],
        }}
        onBarcodeScanned={onBarcodeScanned}
      />
      <View style={styles.scanLineOverlay}>
        <View style={styles.redLine} />
      </View>
      {scanned && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedText}>Processing...</Text>
        </View>
      )}
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
      <InlineCamera onBarcodeScanned={onBarcodeScanned} />
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
    height: 120,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  cameraContainer: {
    width: '100%',
    height: 120,
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
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  manualHint: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualHintText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  cameraFallback: {
    width: '100%',
    height: 120,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#FFFFFF',
  },
  tapHint: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  permissionButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  permissionButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
