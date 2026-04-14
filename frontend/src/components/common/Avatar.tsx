import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { colors, font } from '../../constants';
import { resolveImageUrl } from '../../utils/image';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  name?: string;
  style?: ViewStyle;
  borderWidth?: number;
  borderColor?: string;
}

export default function Avatar({
  uri,
  size = 40,
  name,
  style,
  borderWidth,
  borderColor,
}: AvatarProps) {
  const resolvedUri = resolveImageUrl(uri);
  const radius = size / 2;
  const fontSize = Math.max(size * 0.4, 11);

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    ...(borderWidth != null && { borderWidth }),
    ...(borderColor != null && { borderColor }),
  };

  if (resolvedUri) {
    const imageStyle: ImageStyle = { ...baseStyle, ...(style as any) };
    return <Image source={{ uri: resolvedUri }} style={imageStyle} />;
  }

  const containerStyle: ViewStyle = { ...baseStyle, ...style };

  const initial = name ? name.charAt(0).toUpperCase() : '';

  return (
    <View style={[styles.placeholder, containerStyle]}>
      {initial ? (
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: font.bold,
    color: colors.gray500,
  },
});
