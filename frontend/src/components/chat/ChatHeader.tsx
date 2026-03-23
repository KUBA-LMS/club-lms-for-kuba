import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowBackIcon } from '../icons';
import Avatar from '../common/Avatar';
import { ChatMember } from '../../types/chat';
import { colors, font } from '../../constants';

interface ChatHeaderProps {
  members: ChatMember[];
  currentUserId: string;
  chatName: string | null;
  isGroup: boolean;
  onBack: () => void;
}

export default function ChatHeader({
  members,
  currentUserId,
  chatName,
  isGroup,
  onBack,
}: ChatHeaderProps) {
  const otherMembers = members.filter((m) => m.id !== currentUserId);
  const displayName = chatName || otherMembers.map((m) => m.username).join(', ');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.6}>
        <ArrowBackIcon size={22} color={colors.text.primary} />
      </TouchableOpacity>

      <View style={styles.centerSection}>
        <View style={styles.avatarSection}>
          {isGroup ? (
            <View style={styles.groupAvatars}>
              {otherMembers.slice(0, 2).map((member, i) => (
                <View
                  key={member.id}
                  style={[
                    styles.groupAvatarWrapper,
                    { marginLeft: i > 0 ? -10 : 0, zIndex: 2 - i },
                  ]}
                >
                  <Avatar uri={member.profile_image} size={36} name={member.username} />
                </View>
              ))}
            </View>
          ) : (
            <Avatar
              uri={otherMembers[0]?.profile_image}
              size={36}
              name={otherMembers[0]?.username || '?'}
            />
          )}
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {isGroup && (
            <Text style={styles.memberCount}>{otherMembers.length} members</Text>
          )}
        </View>
      </View>

      <View style={styles.rightPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 60,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  avatarSection: {
    marginRight: 10,
  },
  groupAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatarWrapper: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 20,
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.text.primary,
  },
  memberCount: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.gray500,
    marginTop: 1,
  },
  rightPlaceholder: {
    width: 40,
  },
});
