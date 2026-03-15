import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowBackIcon, PlusIcon } from '../../components/icons';
import SegmentedControl from '../../components/community/SegmentedControl';
import ClubFilterRow from '../../components/community/ClubFilterRow';
import ChatListItem from '../../components/community/ChatListItem';
import FriendSearchTab from '../../components/community/FriendSearchTab';
import FriendRequestsTab from '../../components/community/FriendRequestsTab';
import FriendManageTab from '../../components/community/FriendManageTab';
import JoinGroupsTab from '../../components/community/JoinGroupsTab';
import { colors, screenPadding } from '../../constants';
import { MainStackParamList } from '../../navigation/types';
import { useChatList } from '../../hooks/useChat';
import { useMyClubs } from '../../hooks/useMyClubs';
import { Chat } from '../../types/chat';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const SEGMENTS = ['Chats', 'Friends', 'Join Groups'];
const FRIEND_SUB_TABS = ['Search', 'Requests', 'Manage'];

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// --- Sub-tab underline selector ---
function SubTabBar({
  tabs,
  selectedIndex,
  onSelect,
  badgeIndex,
  badgeCount,
}: {
  tabs: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  badgeIndex?: number;
  badgeCount?: number;
}) {
  return (
    <View style={subTabStyles.container}>
      {tabs.map((label, idx) => (
        <TouchableOpacity
          key={label}
          style={subTabStyles.tab}
          onPress={() => onSelect(idx)}
          activeOpacity={0.7}
        >
          <View style={subTabStyles.labelRow}>
            <Text
              style={[
                subTabStyles.label,
                idx === selectedIndex && subTabStyles.labelActive,
              ]}
            >
              {label}
            </Text>
            {idx === badgeIndex && badgeCount != null && badgeCount > 0 && (
              <View style={subTabStyles.badge}>
                <Text style={subTabStyles.badgeText}>{badgeCount}</Text>
              </View>
            )}
          </View>
          {idx === selectedIndex && <View style={subTabStyles.underline} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const subTabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.gray400,
  },
  labelActive: {
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
});

// --- Main Component ---

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [friendSubTab, setFriendSubTab] = useState(0);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  const { clubs } = useMyClubs();

  // Filter club ID: subgroup takes priority over club
  const filterClubId = selectedSubgroupId || selectedClubId;
  const { chats, isLoading, markChatAsRead } = useChatList(filterClubId);

  const handleSelectClub = useCallback((clubId: string | null) => {
    setSelectedClubId(clubId);
    setSelectedSubgroupId(null);
  }, []);

  const handleSelectSubgroup = useCallback((subgroupId: string | null) => {
    setSelectedSubgroupId(subgroupId);
  }, []);

  const handleChatPress = useCallback((chatId: string) => {
    markChatAsRead(chatId);
    navigation.navigate('ChatRoom', { chatId });
  }, [navigation, markChatAsRead]);

  const getChatDisplayName = useCallback((chat: Chat): string => {
    if (chat.name) return chat.name;
    return chat.members.map((m) => m.username).join(', ');
  }, []);

  const getLastMessagePreview = useCallback((chat: Chat): string => {
    if (!chat.last_message) return '';
    const msg = chat.last_message;
    switch (msg.type) {
      case 'payment_request':
      case 'payment_completed':
      case 'ticket_delivered':
        return msg.content;
      case 'ticket':
        return 'Sent you a ticket';
      default:
        return msg.content;
    }
  }, []);

  const isPaymentMessage = useCallback((chat: Chat): boolean => {
    if (!chat.last_message) return false;
    return ['payment_request', 'payment_completed'].includes(chat.last_message.type);
  }, []);

  const renderChatItem = useCallback(({ item }: { item: Chat }) => (
    <ChatListItem
      name={getChatDisplayName(item)}
      lastMessage={getLastMessagePreview(item)}
      timestamp={item.last_message ? formatTimestamp(item.last_message.created_at) : ''}
      isGroup={item.type !== 'direct'}
      unreadCount={item.unread_count}
      paymentIcon={isPaymentMessage(item)}
      onPress={() => handleChatPress(item.id)}
    />
  ), [getChatDisplayName, getLastMessagePreview, isPaymentMessage, handleChatPress]);

  const renderContent = () => {
    // Chats tab
    if (segmentIndex === 0) {
      return (
        <>
          <ClubFilterRow
            clubs={clubs}
            selectedClubId={selectedClubId}
            selectedSubgroupId={selectedSubgroupId}
            onSelectClub={handleSelectClub}
            onSelectSubgroup={handleSelectSubgroup}
          />
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8E8E93" />
            </View>
          ) : (
            <FlatList
              data={chats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
            />
          )}
        </>
      );
    }

    // Friends tab
    if (segmentIndex === 1) {
      const renderFriendContent = () => {
        if (friendSubTab === 0) return <FriendSearchTab />;
        if (friendSubTab === 1)
          return <FriendRequestsTab onRequestCountChange={setRequestCount} />;
        return <FriendManageTab />;
      };

      return (
        <>
          <SubTabBar
            tabs={FRIEND_SUB_TABS}
            selectedIndex={friendSubTab}
            onSelect={setFriendSubTab}
            badgeIndex={1}
            badgeCount={requestCount}
          />
          {renderFriendContent()}
        </>
      );
    }

    // Join Groups tab
    return <JoinGroupsTab />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <ArrowBackIcon size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>COMMUNITY</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('CreateGroupChat')}
          activeOpacity={0.6}
        >
          <PlusIcon size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <SegmentedControl
          segments={SEGMENTS}
          selectedIndex={segmentIndex}
          onSelect={setSegmentIndex}
        />
      </View>

      {/* Content by segment */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPadding.horizontal,
    height: 50,
  },
  headerButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Platform.select({
      ios: 'PorterSansBlock',
      android: 'porter-sans-inline-block',
    }),
    fontSize: 20,
    color: '#000000',
    letterSpacing: -0.08,
    textAlign: 'center',
  },
  segmentContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.gray500,
  },
  placeholderSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.gray400,
    marginTop: 8,
  },
});
