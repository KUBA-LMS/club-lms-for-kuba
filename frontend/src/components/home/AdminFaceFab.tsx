import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

interface AdminFaceFabProps {
  isOpen: boolean;
  onToggle: () => void;
  onCreateEvent: () => void;
  onAccessControl: () => void;
}

// Expressions: 0=smile, 1=wink, 2=surprise, 3=thinking, 4=smile(loop)
function AnimatedFace({ isOpen }: { isOpen: boolean }) {
  const expr = useSharedValue(0);
  const ease = { duration: 800, easing: Easing.inOut(Easing.ease) };

  useEffect(() => {
    if (isOpen) return;
    expr.value = 0;
    expr.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withDelay(2500, withTiming(1, ease)),
        withDelay(2000, withTiming(2, ease)),
        withDelay(2000, withTiming(3, ease)),
        withDelay(2000, withTiming(4, ease)),
      ),
      -1,
      false,
    );
  }, [isOpen, expr]);

  // -- LEFT EYE --
  // smile: 4.5x4.5 circle, wink: 7x1.5 line, surprise: 6x6 big, thinking: 4.5 shifted
  const leftEyeStyle = useAnimatedStyle(() => {
    const v = expr.value;
    const w = interpolate(v, [0, 1, 2, 3, 4], [4.5, 7, 6, 4.5, 4.5], Extrapolation.CLAMP);
    const h = interpolate(v, [0, 1, 2, 3, 4], [4.5, 1.8, 6, 4.5, 4.5], Extrapolation.CLAMP);
    return {
      width: w,
      height: h,
      borderRadius: Math.min(w, h) / 2,
      transform: [
        { translateX: interpolate(v, [0, 1, 2, 3, 4], [0, 0, 0, 2, 0], Extrapolation.CLAMP) },
        { translateY: interpolate(v, [0, 1, 2, 3, 4], [0, 0.5, -0.5, 0, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  // -- RIGHT EYE --
  const rightEyeStyle = useAnimatedStyle(() => {
    const v = expr.value;
    const w = interpolate(v, [0, 1, 2, 3, 4], [4.5, 4.5, 6, 4.5, 4.5], Extrapolation.CLAMP);
    const h = interpolate(v, [0, 1, 2, 3, 4], [4.5, 4.5, 6, 4.5, 4.5], Extrapolation.CLAMP);
    return {
      width: w,
      height: h,
      borderRadius: Math.min(w, h) / 2,
      transform: [
        { translateX: interpolate(v, [0, 1, 2, 3, 4], [0, 0, 0, 2, 0], Extrapolation.CLAMP) },
        { translateY: interpolate(v, [0, 1, 2, 3, 4], [0, 0, -0.5, 0, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  // -- LEFT EYEBROW --
  const leftBrowStyle = useAnimatedStyle(() => {
    const v = expr.value;
    return {
      opacity: interpolate(v, [0, 0.3, 4], [1, 1, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(v, [0, 1, 2, 3, 4], [0, -0.5, 0, 2, 0], Extrapolation.CLAMP) },
        { translateY: interpolate(v, [0, 1, 2, 3, 4], [0, -1.5, -3, 0.5, 0], Extrapolation.CLAMP) },
        { rotate: `${interpolate(v, [0, 1, 2, 3, 4], [-10, -18, -5, 12, -10], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  // -- RIGHT EYEBROW --
  const rightBrowStyle = useAnimatedStyle(() => {
    const v = expr.value;
    return {
      opacity: interpolate(v, [0, 0.3, 4], [1, 1, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(v, [0, 1, 2, 3, 4], [0, 0.5, 0, 2, 0], Extrapolation.CLAMP) },
        { translateY: interpolate(v, [0, 1, 2, 3, 4], [0, 0, -3, -2, 0], Extrapolation.CLAMP) },
        { rotate: `${interpolate(v, [0, 1, 2, 3, 4], [10, 10, 5, -8, 10], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  // -- MOUTH (single View morphing via animated border/size/radius) --
  const mouthStyle = useAnimatedStyle(() => {
    const v = expr.value;
    // 0=smile, 1=wink(smile), 2=surprise, 3=thinking, 4=smile(loop)
    const w = interpolate(v, [0, 1, 2, 3, 4], [10, 10, 6, 8, 10], Extrapolation.CLAMP);
    const h = interpolate(v, [0, 1, 2, 3, 4], [5, 5, 7, 1.5, 5], Extrapolation.CLAMP);
    const topBW = interpolate(v, [0, 1, 2, 3, 4], [0, 0, 1.8, 0, 0], Extrapolation.CLAMP);
    const sideBW = interpolate(v, [0, 1, 2, 3, 4], [1.5, 1.5, 1.8, 0, 1.5], Extrapolation.CLAMP);
    const blR = interpolate(v, [0, 1, 2, 3, 4], [5, 5, 3.5, 1, 5], Extrapolation.CLAMP);
    const brR = interpolate(v, [0, 1, 2, 3, 4], [5, 5, 3.5, 1, 5], Extrapolation.CLAMP);
    const tlR = interpolate(v, [0, 1, 2, 3, 4], [0, 0, 3.5, 1, 0], Extrapolation.CLAMP);
    const trR = interpolate(v, [0, 1, 2, 3, 4], [0, 0, 3.5, 1, 0], Extrapolation.CLAMP);
    return {
      width: w,
      height: h,
      borderBottomWidth: 1.8,
      borderTopWidth: topBW,
      borderLeftWidth: sideBW,
      borderRightWidth: sideBW,
      borderColor: '#FFFFFF',
      backgroundColor: 'transparent',
      borderBottomLeftRadius: blR,
      borderBottomRightRadius: brR,
      borderTopLeftRadius: tlR,
      borderTopRightRadius: trR,
      transform: [
        { translateX: interpolate(v, [0, 1, 2, 3, 4], [0, 0, 0, 1.5, 0], Extrapolation.CLAMP) },
        { rotate: `${interpolate(v, [0, 1, 2, 3, 4], [0, 0, 0, -10, 0], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  if (isOpen) {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M6 6L18 18M18 6L6 18"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <View style={f.container}>
      {/* Left eyebrow */}
      <Animated.View style={[f.leftBrow, leftBrowStyle]} />
      {/* Right eyebrow */}
      <Animated.View style={[f.rightBrow, rightBrowStyle]} />
      {/* Left eye */}
      <Animated.View style={[f.leftEye, leftEyeStyle]} />
      {/* Right eye */}
      <Animated.View style={[f.rightEye, rightEyeStyle]} />

      {/* Mouth */}
      <View style={f.mouthWrap}>
        <Animated.View style={mouthStyle} />
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  leftEye: {
    position: 'absolute',
    left: 3,
    top: 9,
    backgroundColor: '#FFFFFF',
  },
  rightEye: {
    position: 'absolute',
    right: 3,
    top: 9,
    backgroundColor: '#FFFFFF',
  },
  leftBrow: {
    position: 'absolute',
    left: 2,
    top: 5,
    width: 7,
    height: 1.8,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  rightBrow: {
    position: 'absolute',
    right: 2,
    top: 5,
    width: 7,
    height: 1.8,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  mouthWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function AdminFaceFab({
  isOpen,
  onToggle,
  onCreateEvent,
  onAccessControl,
}: AdminFaceFabProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.fab, isOpen && styles.fabActive]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <AnimatedFace isOpen={isOpen} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onCreateEvent}
            activeOpacity={0.8}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>+</Text>
            </View>
            <Text style={styles.menuLabel}>Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onAccessControl}
            activeOpacity={0.8}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>A</Text>
            </View>
            <Text style={styles.menuLabel}>Access Control</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    top: 52,
    right: 0,
    gap: 8,
    alignItems: 'flex-end',
    zIndex: 100,
    width: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  menuLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#212121',
    flexShrink: 0,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  fabActive: {
    backgroundColor: '#FF3B30',
  },
});
