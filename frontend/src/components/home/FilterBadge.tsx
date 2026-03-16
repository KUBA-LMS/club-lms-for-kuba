import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { colors } from '../../constants';
import { resolveImageUrl } from '../../utils/image';

interface FilterBadgeProps {
  label: string;
  icon?: React.ReactNode;
  imageUri?: string;
  isActive?: boolean;
  onPress?: () => void;
}

export default function FilterBadge({
  label,
  icon,
  imageUri,
  isActive = false,
  onPress,
}: FilterBadgeProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      {imageUri && (
        <Image source={{ uri: resolveImageUrl(imageUri) }} style={styles.image} />
      )}
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  containerActive: {
    backgroundColor: '#1C1C1E',
  },
  iconWrapper: {
    width: 16,
    height: 16,
  },
  image: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.primary,
  },
  labelActive: {
    color: colors.white,
  },
});
