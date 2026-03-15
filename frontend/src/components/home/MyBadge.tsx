import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface MyBadgeProps {
  onPress?: () => void;
  userImage?: string;
  username?: string;
}

export default function MyBadge({ onPress, userImage, username }: MyBadgeProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {userImage ? (
        <Image source={{ uri: userImage }} style={styles.profileImage} />
      ) : (
        <View style={styles.fallbackWrapper}>
          {username ? (
            <Text style={styles.initialText}>{username.charAt(0).toUpperCase()}</Text>
          ) : (
            <>
              <View style={[styles.pill, styles.pillOrange]} />
              <View style={[styles.pill, styles.pillPurple]} />
              <View style={[styles.pill, styles.pillTeal]} />
              <Text style={styles.myText}>MY</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
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
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fallbackWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    width: 27,
    height: 36,
    borderRadius: 30,
  },
  pillOrange: {
    backgroundColor: '#FEAC5E',
    left: 2,
    top: 4,
    transform: [{ rotate: '-20deg' }],
  },
  pillPurple: {
    backgroundColor: '#C779D0',
    left: 9,
    top: 4,
  },
  pillTeal: {
    backgroundColor: '#4BC0C8',
    right: 2,
    top: 4,
    transform: [{ rotate: '20deg' }],
  },
  myText: {
    fontFamily: 'Copperplate-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    zIndex: 1,
  },
  initialText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#555555',
    fontWeight: 'bold',
  },
});
