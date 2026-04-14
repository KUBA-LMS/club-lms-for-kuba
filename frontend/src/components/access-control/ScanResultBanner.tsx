import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScanResult } from '../../types/accessControl';
import { colors, font } from '../../constants';

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
    backgroundColor: colors.success,
    textColor: colors.white,
  },
  entry_denied_pending: {
    text: 'ENTRY DENIED',
    backgroundColor: '#FF383C',
    textColor: colors.white,
  },
  entry_denied_no_ticket: {
    text: 'ENTRY DENIED',
    backgroundColor: '#FF383C',
    textColor: colors.white,
  },
  double_checked_in: {
    text: 'Double Checked-in',
    backgroundColor: '#FFCC00',
    textColor: colors.black,
  },
  waiting: {
    text: 'WAITING SCAN',
    backgroundColor: colors.gray100,
    textColor: colors.gray500,
  },
  no_event: {
    text: 'SELECT EVENT FIRST',
    backgroundColor: colors.gray100,
    textColor: colors.gray500,
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
    fontFamily: font.semibold,
    fontSize: 18,
    letterSpacing: 1,
  },
});
