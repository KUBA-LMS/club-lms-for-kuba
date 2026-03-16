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

interface ChatListItemProps {
  avatar?: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  isGroup?: boolean;
  unreadCount?: number;
  paymentIcon?: boolean;
  onPress: () => void;
}

function GroupAvatar() {
  return (
    <View style={styles.groupAvatarContainer}>
      <View style={[styles.groupCircle, styles.groupCircleBack]}>
        <Text style={styles.groupCircleInitial}>G</Text>
      </View>
    </View>
  );
}

export default function ChatListItem({
  avatar,
  name,
  lastMessage,
  timestamp,
  isGroup,
  unreadCount = 0,
  paymentIcon,
  onPress,
}: ChatListItemProps) {
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.avatarContainer}>
        {isGroup ? (
          <GroupAvatar />
        ) : avatar ? (
          <Image source={{ uri: resolveImageUrl(avatar) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {paymentIcon && (
              <View style={styles.dollarBadge} />
            )}
          </View>
          <View style={styles.rightSection}>
            <Text style={styles.timestamp}>{timestamp}</Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text
          style={[
            styles.message,
            hasUnread && styles.messageUnread,
          ]}
          numberOfLines={1}
        >
          {lastMessage}
        </Text>
      </View>
      <View style={styles.separator} />

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#6E6E73',
  },
  groupAvatarContainer: {
    width: 50,
    height: 50,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCircleBack: {},
  groupCircleInitial: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#6E6E73',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1C1C1E',
    flexShrink: 1,
  },
  dollarBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#FFB800',
    marginLeft: 5,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.gray500,
  },
  unreadBadge: {
    backgroundColor: '#34C759',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.gray500,
  },
  messageUnread: {
    fontFamily: 'Inter-Medium',
    color: '#1C1C1E',
  },
  separator: {
    position: 'absolute',
    left: 84,
    right: 20,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F5',
  },
});
