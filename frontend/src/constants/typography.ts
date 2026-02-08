import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
});

export const typography = {
  // Headings
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  } as TextStyle,

  h2: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  } as TextStyle,

  h3: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  } as TextStyle,

  h4: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,

  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,

  // Labels
  label: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  } as TextStyle,

  labelSmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  } as TextStyle,

  // Caption
  caption: {
    fontFamily,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
  } as TextStyle,

  // Button
  button: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,

  buttonSmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  } as TextStyle,
};

export const fontSize = {
  xs: 10,
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
