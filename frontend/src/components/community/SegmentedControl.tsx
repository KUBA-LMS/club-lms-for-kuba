import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { colors, font } from '../../constants';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function SegmentedControl({
  segments,
  selectedIndex,
  onSelect,
}: SegmentedControlProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const segmentWidth = useRef(0);
  const containerWidth = useRef(0);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    containerWidth.current = e.nativeEvent.layout.width;
    segmentWidth.current = containerWidth.current / segments.length;
    translateX.setValue(selectedIndex * segmentWidth.current);
  };

  useEffect(() => {
    if (segmentWidth.current > 0) {
      Animated.spring(translateX, {
        toValue: selectedIndex * segmentWidth.current,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }).start();
    }
  }, [selectedIndex, translateX]);

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${100 / segments.length}%` as any,
            transform: [{ translateX }],
          },
        ]}
      />
      {segments.map((label, index) => (
        <TouchableOpacity
          key={label}
          style={styles.segment}
          activeOpacity={0.7}
          onPress={() => onSelect(index)}
        >
          <Text
            style={[
              styles.label,
              selectedIndex === index && styles.labelSelected,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 100,
    backgroundColor: '#F0F0F5',
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.gray500,
    letterSpacing: -0.08,
  },
  labelSelected: {
    fontFamily: font.semibold,
    color: colors.white,
  },
});
