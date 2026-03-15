import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

export default function AutoSelectionCapsule() {
  const arrowOpacity = useSharedValue(1);

  useEffect(() => {
    arrowOpacity.value = withRepeat(
      withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [arrowOpacity]);

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.capsule}>
        <View style={styles.logoContainer}>
          <View style={styles.ticketFrame}>
            <Svg style={styles.ticketBorder} viewBox="0 0 65 15">
              <Rect
                x={0.5}
                y={0.5}
                width={64}
                height={14}
                rx={7}
                stroke="white"
                strokeWidth={0.5}
                fill="none"
              />
            </Svg>
            <Text style={styles.oneText}>ONE</Text>
            <Text style={styles.passText}>PASS</Text>
          </View>
          <Text style={styles.numberText}>1</Text>
        </View>

        <Text style={styles.title}>AUTO{'\n'}SELECTION</Text>

        <Text style={styles.subtitle}>SLIDE DOWN TO{'\n'}VIEW TICKETS</Text>

        <Animated.View style={[styles.arrowContainer, arrowStyle]}>
          <Text style={styles.arrows}>{'>'}</Text>
          <Text style={styles.arrows}>{'>'}</Text>
          <Text style={styles.arrows}>{'>'}</Text>
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
  capsule: {
    width: 285,
    height: 385,
    borderRadius: 150,
    backgroundColor: '#000000',
    borderWidth: 0.5,
    borderColor: '#C5C5C5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 30 },
        shadowOpacity: 0.7,
        shadowRadius: 40,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 40,
    width: 65,
    marginBottom: 20,
  },
  ticketFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 15,
    width: 65,
    marginTop: 18,
  },
  ticketBorder: {
    position: 'absolute',
    width: 65,
    height: 15,
  },
  oneText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 11,
    color: '#FFFFFF',
    position: 'absolute',
    left: 4,
  },
  passText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 11,
    color: '#FFFFFF',
    position: 'absolute',
    right: 3,
  },
  numberText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 50,
    color: '#FFFFFF',
    position: 'absolute',
    top: -12,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Gafata-Regular',
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Gafata-Regular',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 40,
  },
  arrowContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  arrows: {
    fontFamily: 'Gafata-Regular',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 18,
    transform: [{ rotate: '90deg' }],
  },
});
