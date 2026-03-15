import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { OnePassScreenState } from '../../types/onepass';

interface ActionButtonsProps {
  screenState: OnePassScreenState;
  onAutoSelectionToggle: () => void;
}

function SmallPillButton({
  label,
  onPress,
  color = '#FFFFFF',
  width = 100,
  dotColor,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  width?: number;
  dotColor?: string;
}) {
  return (
    <TouchableOpacity style={[styles.pill, { width }]} onPress={onPress}>
      <Svg style={[styles.pillBorder, { width }]} viewBox={`0 0 ${width} 14`}>
        <Rect
          x={0.5}
          y={0.5}
          width={width - 1}
          height={13}
          rx={7}
          stroke={color}
          strokeWidth={0.5}
          fill="none"
        />
      </Svg>
      <View style={styles.pillContent}>
        {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
        <Text style={[styles.pillText, { color }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ActionButtons({
  screenState,
  onAutoSelectionToggle,
}: ActionButtonsProps) {
  // Auto selection state: no buttons needed
  if (screenState === 'auto_selection') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <SmallPillButton
          label="AUTO SELECTION"
          onPress={onAutoSelectionToggle}
          color="#FFFFFF"
          width={84}
          dotColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  pill: {
    height: 14,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBorder: {
    position: 'absolute',
    height: 14,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  pillText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 11,
  },
});
