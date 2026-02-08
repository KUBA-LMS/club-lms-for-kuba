import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { GroupsIcon } from '../icons';
import { colors } from '../../constants';

interface GroupsButtonProps {
  onPress?: () => void;
}

export default function GroupsButton({ onPress }: GroupsButtonProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <GroupsIcon size={25} color={colors.gray900} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
