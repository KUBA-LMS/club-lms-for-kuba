import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

let Barcode: any = null;
try {
  Barcode = require('react-native-barcode-svg').default;
} catch {
  // fallback if barcode library unavailable
}

interface BarcodeDisplayProps {
  barcode: string;
  userName: string;
  statusText?: string;
  statusColor?: string;
}

function RefreshIcon({ size = 10, color = '#FFFFFF' }) {
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
  const digits = barcode.replace(/[^A-F0-9]/gi, '').slice(-11);
  // Format as "X X X X X X X  X X X X" (double space in middle)
  const chars = digits.split('');
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

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <Text style={styles.userName}>{userName.toUpperCase()}</Text>
        <View style={styles.timerContainer}>
          <View style={styles.timerDot} />
          <Text style={styles.timerText}>{timerText} </Text>
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <RefreshIcon size={10} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.barcodeContainer}>
        {Barcode ? (
          <Barcode
            value={barcode.slice(0, 20)}
            format="CODE128"
            singleBarWidth={2}
            height={80}
            lineColor="#FFFFFF"
            backgroundColor="transparent"
            maxWidth={340}
          />
        ) : (
          <FallbackBarcode />
        )}
      </View>

      <Text style={styles.digits}>{formatBarcodeDigits(barcode)}</Text>

      {statusText ? (
        <Text style={[styles.statusText, { color: statusColor || '#FFFFFF' }]}>
          {statusText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#FFFFFF',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  timerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#FFFFFF',
  },
  barcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  digits: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
