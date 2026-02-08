import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants';

const KUBA_LOGO = require('../assets/images/kuba-logo.png');

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive scaling based on Figma design (400x926)
  const baseWidth = 400;
  const baseHeight = 926;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  // Responsive font size - clamped for very small/large screens
  const titleFontSize = Math.max(40, Math.min(70 * scale, 90));
  const forFontSize = Math.max(12, Math.min(15 * scale, 18));

  useEffect(() => {
    // Auto finish after splash duration
    if (onFinish) {
      const timer = setTimeout(onFinish, 2500);
      return () => clearTimeout(timer);
    }
  }, [onFinish]);

  // Logo dimensions - responsive
  const logoWidth = Math.min(210 * scale, width * 0.55);
  const logoHeight = logoWidth * (43 / 210);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleFontSize * 1.2 }]}>
            CLUB.{'\n'}LMS
          </Text>
        </View>

        {/* For + KUBA Logo Section */}
        <View style={styles.brandContainer}>
          <Text style={[styles.forText, { fontSize: forFontSize }]}>For:</Text>
          <Image
            source={KUBA_LOGO}
            style={[styles.logo, { width: logoWidth, height: logoHeight }]}
            resizeMode="contain"
          />
        </View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl + spacing.xl,
  },
  title: {
    fontFamily: Platform.select({
      ios: 'PorterSansBlock',
      android: 'porter-sans-inline-block',
      default: 'System',
    }),
    color: colors.black,
    textAlign: 'center',
    letterSpacing: 2,
  },
  brandContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  forText: {
    fontFamily: Platform.select({
      ios: 'Heiti TC',
      android: 'sans-serif-medium',
      default: 'System',
    }),
    color: colors.gray900,
    textAlign: 'center',
  },
  logo: {
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xxxl,
    position: 'absolute',
    bottom: 100,
  },
  loadingDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
