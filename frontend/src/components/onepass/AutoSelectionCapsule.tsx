import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import OnePassLogo from '../icons/OnePassLogo';

function ChevronDown({ size = 18, color = 'rgba(255,255,255,0.7)' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function AutoSelectionCapsule() {
  const chevronY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.25);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    // Chevron bouncing down animation
    chevronY.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );
  }, [chevronY, glowOpacity, glowScale]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chevronY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Glow ring behind capsule */}
      <Animated.View style={[styles.glowRing, glowStyle]} pointerEvents="none" />

      <View style={styles.capsule}>
        <View style={styles.logoContainer}>
          <OnePassLogo width={80} height={46} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>AUTO{'\n'}SELECTION</Text>

        <Text style={styles.subtitle}>SLIDE DOWN TO VIEW TICKETS</Text>

        <Animated.View style={[styles.chevronStack, chevronStyle]}>
          <ChevronDown size={18} color="rgba(255,255,255,0.8)" />
          <ChevronDown size={18} color="rgba(255,255,255,0.45)" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  glowRing: {
    position: 'absolute',
    width: 290,
    height: 380,
    borderRadius: 145,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
  },
  capsule: {
    width: 270,
    height: 360,
    borderRadius: 135,
    backgroundColor: '#0A0A0A',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 80,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.4,
    letterSpacing: 1.2,
  },
  chevronStack: {
    marginTop: 16,
    alignItems: 'center',
    gap: -6,
  },
});
