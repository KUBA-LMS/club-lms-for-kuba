import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowBackIcon } from '../icons';
import { ChatMember } from '../../types/chat';
import { resolveImageUrl } from '../../utils/image';

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
        <ArrowBackIcon size={22} color="#1C1C1E" />
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
                  {member.profile_image ? (
                    <Image source={{ uri: resolveImageUrl(member.profile_image) }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>
                        {member.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <>
              {otherMembers[0]?.profile_image ? (
                <Image source={{ uri: resolveImageUrl(otherMembers[0].profile_image) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {otherMembers[0]?.username?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
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
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6E6E73',
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1C1C1E',
  },
  memberCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  rightPlaceholder: {
    width: 40,
  },
});
