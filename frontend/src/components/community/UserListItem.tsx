import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../../constants';
import { resolveImageUrl } from '../../utils/image';

interface CommonGroup {
  name: string;
  imageUri: string;
}

interface UserListItemProps {
  avatar?: string;
  username: string;
  commonGroups: CommonGroup[];
  isSelected: boolean;
  selectedOrder?: number;
  onToggle: () => void;
}

export default function UserListItem({
  avatar,
  username,
  commonGroups,
  isSelected,
  selectedOrder,
  onToggle,
}: UserListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.6}
    >
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: resolveImageUrl(avatar) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.groupsLabel}>Groups in common:</Text>
        <View style={styles.badgeRow}>
          {commonGroups.map((group) => (
            <Image
              key={group.name}
              source={{ uri: resolveImageUrl(group.imageUri) }}
              style={styles.groupBadge}
            />
          ))}
        </View>
      </View>
      <View style={styles.checkboxContainer}>
        {isSelected ? (
          <View style={styles.checkboxSelected}>
            <Text style={styles.checkboxNumber}>
              {selectedOrder ?? 1}
            </Text>
          </View>
        ) : (
          <View style={styles.checkboxUnselected} />
        )}
      </View>
      <View style={styles.separator} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    paddingHorizontal: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    marginRight: 13,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E5EA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: '#000000',
    marginBottom: 4,
  },
  groupsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  groupBadge: {
    width: 65,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  checkboxContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.gray100,
  },
  checkboxSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  separator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
  },
});
