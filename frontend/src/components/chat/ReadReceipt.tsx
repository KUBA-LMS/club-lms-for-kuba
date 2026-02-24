import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface ReadReceiptProps {
  count: number;
}

export default function ReadReceipt({ count }: ReadReceiptProps) {
  if (count <= 0) return null;

  return <Text style={styles.text}>{count}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 11,
    color: '#00C0E8',
    marginRight: 4,
  },
});
