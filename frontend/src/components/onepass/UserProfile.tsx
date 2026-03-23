import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../../utils/image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface UserProfileProps {
  name: string;
  profileImage?: string;
}

export default function UserProfile({ name, profileImage }: UserProfileProps) {
  const ringOpacity = useSharedValue(0.4);
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );
  }, [fadeIn, ringOpacity]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.avatarWrapper}>
        <Animated.View style={[styles.glowRing, ringStyle]} />
        <View style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: resolveImageUrl(profileImage) }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
      {name ? (
        <Text style={styles.name} numberOfLines={1}>{name.toUpperCase()}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 4,
    gap: 4,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  imageContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  name: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
  },
});
