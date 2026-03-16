import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { StarsIcon, ShareIcon } from '../icons';
import Svg, { Path } from 'react-native-svg';
import { UserBrief } from '../../types/auth';
import { resolveImageUrl } from '../../utils/image';

export type RegistrationStatus =
  | 'registered'
  | 'visited'
  | 'open'
  | 'requested'
  | 'closed'
  | 'upcoming';

interface EventCardProps {
  title: string;
  date: string;
  provider: string;
  providerLogo?: string;
  imageUri?: string;
  status: RegistrationStatus;
  opensAt?: string;
  participants?: UserBrief[];
  participantCount?: number;
  isBookmarked?: boolean;
  onPress?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onAction?: () => void;
}

const ChevronRightIcon = ({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LoaderIcon = ({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <Path
      d="M7 1.16667V3.5M7 10.5V12.8333M2.69583 2.69583L4.34167 4.34167M9.65833 9.65833L11.3042 11.3042M1.16667 7H3.5M10.5 7H12.8333M2.69583 11.3042L4.34167 9.65833M9.65833 4.34167L11.3042 2.69583"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const getStatusConfig = (status: RegistrationStatus, opensAt?: string) => {
  switch (status) {
    case 'registered':
      return { label: 'Registered', color: '#000000' };
    case 'open':
      return { label: 'Registration Open', color: '#34C759' };
    case 'requested':
      return { label: 'Registration Requested', color: '#FF8D28' };
    case 'visited':
      return { label: 'Visited', color: '#FF3B30' };
    case 'closed':
      return { label: 'Registration Closed', color: '#FF3B30' };
    case 'upcoming':
      return { label: opensAt ? `Opens ${opensAt}` : 'Coming Soon', color: '#8E8E93' };
    default:
      return { label: '', color: '#8E8E93' };
  }
};

export default function EventCard({
  title,
  date,
  provider,
  providerLogo,
  imageUri,
  status,
  opensAt,
  participants = [],
  participantCount = 0,
  isBookmarked = false,
  onPress,
  onBookmark,
  onShare,
  onAction,
}: EventCardProps) {
  const { width } = useWindowDimensions();
  const statusConfig = getStatusConfig(status, opensAt);
  const displayedParticipants = participants.slice(0, 3);
  const extraCount = participantCount > displayedParticipants.length
    ? participantCount - displayedParticipants.length
    : 0;

  const renderActionIcon = () => {
    if (status === 'requested') {
      return <LoaderIcon size={14} color="#FFFFFF" />;
    }
    return <ChevronRightIcon size={16} color="#FFFFFF" />;
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.container, { width }]}>
      {/* Title + Date row */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      {/* Full-width image */}
      <View style={styles.imageWrapper}>
        {imageUri ? (
          <Image source={{ uri: resolveImageUrl(imageUri) }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        {/* Bookmark overlay */}
        <TouchableOpacity style={styles.bookmarkOverlay} onPress={onBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={styles.bookmarkBg}>
            <StarsIcon size={18} color={isBookmarked ? '#FFD700' : '#FFFFFF'} filled={isBookmarked} />
          </View>
        </TouchableOpacity>
        {/* Page dots overlay */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
        </View>
      </View>

      {/* Participants */}
      <View style={styles.participantsRow}>
        <View style={styles.avatarStack}>
          {displayedParticipants.length > 0
            ? displayedParticipants.map((p, index) => (
                p.profile_image ? (
                  <Image
                    key={p.id}
                    source={{ uri: resolveImageUrl(p.profile_image) }}
                    style={[styles.avatar, { marginLeft: index === 0 ? 0 : -8 }]}
                  />
                ) : (
                  <View
                    key={p.id}
                    style={[styles.avatar, styles.avatarFallback, { marginLeft: index === 0 ? 0 : -8 }]}
                  >
                    <Text style={styles.avatarInitial}>{p.username.charAt(0).toUpperCase()}</Text>
                  </View>
                )
              ))
            : [0, 1, 2].map((i) => (
                <View key={i} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -8 }]} />
              ))
          }
        </View>
        <Text style={styles.participantsText} numberOfLines={1}>
          {displayedParticipants.length > 0 ? (
            <>
              <Text style={styles.participantsBold}>
                {displayedParticipants.map(p => p.username).join(', ')}
              </Text>
              {extraCount > 0 && <Text style={styles.participantsBold}> +{extraCount}</Text>}
              <Text> friends participating</Text>
            </>
          ) : (
            <Text style={{ color: '#8E8E93' }}>No participants yet</Text>
          )}
        </Text>
      </View>

      {/* Status bar */}
      <View style={styles.statusBarRow}>
        <View style={[styles.statusBar, { backgroundColor: statusConfig.color }]}>
          <Text style={styles.statusBarText} numberOfLines={1}>{statusConfig.label}</Text>
        </View>
        <TouchableOpacity style={styles.shareArea} onPress={onShare}>
          <ShareIcon size={14} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.arrowBtn, { backgroundColor: statusConfig.color }]}
          onPress={onAction}
        >
          {renderActionIcon()}
        </TouchableOpacity>
      </View>

      {/* Provided by */}
      <View style={styles.providedByRow}>
        <Text style={styles.providedByLabel}>Provided by: </Text>
        {providerLogo && (
          <Image source={{ uri: resolveImageUrl(providerLogo) }} style={styles.providerLogo} />
        )}
        <Text style={styles.providerName}>{provider}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 48,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginRight: 8,
    lineHeight: 24,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#000000',
    flexShrink: 0,
    marginTop: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA',
  },
  bookmarkOverlay: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  bookmarkBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D9D9D9',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E8E93',
  },
  avatarInitial: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  participantsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#000000',
    flex: 1,
  },
  participantsBold: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },
  statusBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 36,
  },
  statusBar: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusBarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  shareArea: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtn: {
    width: 44,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
  },
  providedByLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#AEAEB2',
  },
  providerLogo: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#C5C5C5',
    marginRight: 4,
  },
  providerName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#000000',
  },
});
