import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OnePassScreenState } from '../../types/onepass';

interface ActionButtonsProps {
  screenState: OnePassScreenState;
  onAutoSelectionToggle: () => void;
}

export default function ActionButtons({
  screenState,
  onAutoSelectionToggle,
}: ActionButtonsProps) {
  if (screenState === 'auto_selection') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.pill}
          onPress={onAutoSelectionToggle}
          activeOpacity={0.7}
        >
          <View style={styles.dot} />
          <Text style={styles.pillText}>AUTO SELECTION</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 10,
    gap: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
