import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Mode = 'entry_control' | 'override';

interface ModeSegmentedControlProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export default function ModeSegmentedControl({
  mode,
  onModeChange,
}: ModeSegmentedControlProps) {
  return (
    <View style={styles.container}>
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segment, mode === 'entry_control' && styles.segmentActive]}
          onPress={() => onModeChange('entry_control')}
        >
          <Text style={[styles.segmentText, mode === 'entry_control' && styles.segmentTextActive]}>
            Entry Control
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, mode === 'override' && styles.segmentActive]}
          onPress={() => onModeChange('override')}
        >
          <Text style={[styles.segmentText, mode === 'override' && styles.segmentTextActive]}>
            Override
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  segmentTextActive: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#000000',
  },
});
