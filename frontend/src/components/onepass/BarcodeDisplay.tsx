import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

let Barcode: any = null;
try {
  Barcode = require('react-native-barcode-svg').default;
} catch {
  // fallback if barcode library unavailable
}

const BARCODE_MAX_WIDTH = Dimensions.get('window').width - 48;

interface BarcodeDisplayProps {
  barcode: string;
  userName: string;
  statusText?: string;
  statusColor?: string;
}

function RefreshIcon({ size = 11, color = 'rgba(255,255,255,0.6)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 4v6h6M23 20v-6h-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatBarcodeDigits(barcode: string): string {
  const digits = barcode.replace(/[^0-9]/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  // fallback for legacy hex barcodes
  const hex = barcode.replace(/[^A-F0-9]/gi, '').slice(-11);
  const chars = hex.split('');
  if (chars.length >= 11) {
    return chars.slice(0, 7).join(' ') + '  ' + chars.slice(7).join(' ');
  }
  return chars.join(' ');
}

function FallbackBarcode() {
  const bars = [];
  for (let i = 0; i < 60; i++) {
    const w = Math.random() > 0.5 ? 2 : 1;
    bars.push(
      <Rect key={i} x={i * 5.5} y={0} width={w} height={80} fill="#FFFFFF" />
    );
  }
  return (
    <Svg width={330} height={80}>
      {bars}
    </Svg>
  );
}

export default function BarcodeDisplay({ barcode, userName, statusText, statusColor }: BarcodeDisplayProps) {
  const [timerSeconds, setTimerSeconds] = useState(120);
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(8);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    slideUp.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
  }, [fadeIn, slideUp]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) return 120;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setTimerSeconds(120);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Timer progress 0..1
  const progress = timerSeconds / 120;
  const timerColor = progress > 0.5
    ? 'rgba(255,255,255,0.65)'
    : progress > 0.25
    ? 'rgba(255,200,80,0.8)'
    : 'rgba(255,80,80,0.9)';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.infoRow}>
        <Text style={styles.userName}>{userName.toUpperCase()}</Text>
        <TouchableOpacity
          style={styles.timerContainer}
          onPress={handleRefresh}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <View style={[styles.timerDot, { backgroundColor: timerColor }]} />
          <Text style={[styles.timerText, { color: timerColor }]}>{timerText}</Text>
          <View style={styles.refreshIconWrapper}>
            <RefreshIcon size={10} color={timerColor} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.barcodeWrapper}>
        <View style={styles.barcodeContainer}>
          {Barcode ? (
            <Barcode
              value={barcode.replace(/^[A-Z]+-/, '')}
              format="CODE128"
              singleBarWidth={3}
              height={80}
              lineColor="#FFFFFF"
              backgroundColor="transparent"
              maxWidth={BARCODE_MAX_WIDTH}
            />
          ) : (
            <FallbackBarcode />
          )}
        </View>
      </View>

      <Text style={styles.digits}>{formatBarcodeDigits(barcode)}</Text>

      {statusText ? (
        <Text style={[styles.statusText, { color: statusColor || '#FFFFFF' }]}>
          {statusText}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  timerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  refreshIconWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeWrapper: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  barcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 88,
    paddingVertical: 4,
  },
  digits: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 2,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
});
