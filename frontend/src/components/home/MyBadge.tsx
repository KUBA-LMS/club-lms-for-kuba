import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface MyBadgeProps {
  onPress?: () => void;
}

export default function MyBadge({ onPress }: MyBadgeProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.badgeWrapper}>
        <View style={[styles.pill, styles.pillOrange]} />
        <View style={[styles.pill, styles.pillPurple]} />
        <View style={[styles.pill, styles.pillTeal]} />
        <Text style={styles.text}>MY</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  badgeWrapper: {
    width: 51,
    height: 44,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    width: 27,
    height: 36,
    borderRadius: 30,
  },
  pillOrange: {
    backgroundColor: '#FEAC5E',
    left: 0,
    top: 4,
    transform: [{ rotate: '-20deg' }],
  },
  pillPurple: {
    backgroundColor: '#C779D0',
    left: 12,
    top: 4,
  },
  pillTeal: {
    backgroundColor: '#4BC0C8',
    right: 0,
    top: 4,
    transform: [{ rotate: '20deg' }],
  },
  text: {
    fontFamily: 'Copperplate-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    zIndex: 1,
  },
});
