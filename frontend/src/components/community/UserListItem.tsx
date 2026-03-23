import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, font } from '../../constants';
import { resolveImageUrl } from '../../utils/image';
import Avatar from '../common/Avatar';

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
      <Avatar uri={avatar} size={50} name={username} style={{ marginRight: 13 }} />
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
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: colors.black,
    marginBottom: 4,
  },
  groupsLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.black,
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
    borderColor: colors.white,
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
    fontFamily: font.semibold,
    fontSize: 11,
    color: colors.white,
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
