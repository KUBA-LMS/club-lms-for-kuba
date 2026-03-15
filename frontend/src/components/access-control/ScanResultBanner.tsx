import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScanResult } from '../../types/accessControl';

interface ScanResultBannerProps {
  scanResult: ScanResult | null;
  hasEvent: boolean;
}

const BANNER_CONFIG: Record<
  string,
  { text: string; backgroundColor: string; textColor: string }
> = {
  entry_approved: {
    text: 'ENTRY APPROVED',
    backgroundColor: '#34C759',
    textColor: '#FFFFFF',
  },
  entry_denied_pending: {
    text: 'ENTRY DENIED',
    backgroundColor: '#FF383C',
    textColor: '#FFFFFF',
  },
  entry_denied_no_ticket: {
    text: 'ENTRY DENIED',
    backgroundColor: '#FF383C',
    textColor: '#FFFFFF',
  },
  double_checked_in: {
    text: 'Double Checked-in',
    backgroundColor: '#FFCC00',
    textColor: '#000000',
  },
  waiting: {
    text: 'WAITING SCAN',
    backgroundColor: '#E5E5EA',
    textColor: '#8E8E93',
  },
  no_event: {
    text: 'SELECT EVENT FIRST',
    backgroundColor: '#E5E5EA',
    textColor: '#8E8E93',
  },
};

export default function ScanResultBanner({
  scanResult,
  hasEvent,
}: ScanResultBannerProps) {
  let configKey: string;
  if (!hasEvent) {
    configKey = 'no_event';
  } else if (!scanResult) {
    configKey = 'waiting';
  } else {
    configKey = scanResult;
  }

  const config = BANNER_CONFIG[configKey];

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    letterSpacing: 1,
  },
});
