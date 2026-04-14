import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AccessControlHeaderProps {
  onBack: () => void;
}

export default function AccessControlHeader({ onBack }: AccessControlHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>ACCESS CONTROL</Text>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
  },
  backText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#000000',
  },
  title: {
    fontFamily: 'Gafata-Regular',
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 2,
  },
});
