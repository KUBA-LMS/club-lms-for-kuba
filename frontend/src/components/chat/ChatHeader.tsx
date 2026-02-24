import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowBackIcon } from '../icons';
import { ChatMember } from '../../types/chat';

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
        <ArrowBackIcon size={24} color="#000000" />
      </TouchableOpacity>

      <View style={styles.avatarSection}>
        {isGroup ? (
          <View style={styles.groupAvatars}>
            {otherMembers.slice(0, 3).map((member, i) => (
              <View
                key={member.id}
                style={[
                  styles.groupAvatarWrapper,
                  { marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i },
                ]}
              >
                {member.profile_image ? (
                  <Image source={{ uri: member.profile_image }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]} />
                )}
              </View>
            ))}
          </View>
        ) : (
          <>
            {otherMembers[0]?.profile_image ? (
              <Image source={{ uri: otherMembers[0].profile_image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </>
        )}
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {isGroup && otherMembers.length > 2 && (
          <Text style={styles.memberCount}>+{otherMembers.length - 2} friends</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF9500',
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 17,
    color: '#000000',
  },
  memberCount: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
});
