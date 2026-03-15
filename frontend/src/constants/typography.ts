import { TextStyle } from 'react-native';

// Inter font family keys (loaded in App.tsx)
export const font = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const typography = {
  // Headings
  h1: {
    fontFamily: font.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  } as TextStyle,

  h2: {
    fontFamily: font.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  } as TextStyle,

  h3: {
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  } as TextStyle,

  h4: {
    fontFamily: font.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  body: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  bodySmall: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,

  // Labels
  label: {
    fontFamily: font.semibold,
    fontSize: 14,
    lineHeight: 18,
  } as TextStyle,

  labelSmall: {
    fontFamily: font.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  } as TextStyle,

  // Caption (minimum 11px for accessibility)
  caption: {
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 15,
  } as TextStyle,

  captionMedium: {
    fontFamily: font.medium,
    fontSize: 11,
    lineHeight: 15,
  } as TextStyle,

  // Button
  button: {
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.1,
  } as TextStyle,

  buttonSmall: {
    fontFamily: font.semibold,
    fontSize: 14,
    lineHeight: 18,
  } as TextStyle,

  // Navigation / Header
  navTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  } as TextStyle,

  // Section labels (uppercase small caps style)
  sectionLabel: {
    fontFamily: font.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  } as TextStyle,
};

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
