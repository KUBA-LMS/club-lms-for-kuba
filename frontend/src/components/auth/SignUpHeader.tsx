import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, font } from '../../constants';
import { ArrowBackIcon } from '../icons';

interface SignUpHeaderProps {
  step: number;
  totalSteps: number;
  width: number;
}

export default function SignUpHeader({ step, totalSteps, width }: SignUpHeaderProps) {
  const navigation = useNavigation();
  const targetPercentage = Math.min(100, Math.max(0, (step / totalSteps) * 100));
  const prevStep = useRef(step - 1);
  const progressAnim = useRef(new Animated.Value(((prevStep.current) / totalSteps) * 100)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: targetPercentage,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    prevStep.current = step;
  }, [targetPercentage, progressAnim, step]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <ArrowBackIcon size={22} color={colors.brandText} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: animatedWidth }]} />
        </View>
      </View>
      <Text style={styles.stepText}>{`Create Account\n${step}/${totalSteps}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#D4D4D4',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: 999,
  },
  stepText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 14,
    color: colors.brandText,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
