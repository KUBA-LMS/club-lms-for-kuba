import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { StarsIcon, ShareIcon, LoaderIcon } from '../icons';
import Svg, { Path } from 'react-native-svg';
import { UserBrief } from '../../types/auth';

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

const CheckIcon = ({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <Path
      d="M11.6667 3.5L5.25 9.91667L2.33333 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const getStatusConfig = (status: RegistrationStatus, opensAt?: string) => {
  switch (status) {
    case 'registered':
      return {
        label: 'Registered',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        borderColor: '#000000',
        filled: true,
      };
    case 'open':
      return {
        label: 'Registration Open',
        backgroundColor: '#34C759',
        textColor: '#FFFFFF',
        borderColor: '#34C759',
        filled: true,
      };
    case 'requested':
      return {
        label: 'Registration Requested',
        backgroundColor: '#FF8D28',
        textColor: '#FFFFFF',
        borderColor: '#FF8D28',
        filled: true,
      };
    case 'visited':
      return {
        label: 'Visited',
        backgroundColor: 'transparent',
        textColor: '#FF3B30',
        borderColor: '#FF3B30',
        filled: false,
      };
    case 'closed':
      return {
        label: 'Registration Closed',
        backgroundColor: 'transparent',
        textColor: '#FF3B30',
        borderColor: '#FF3B30',
        filled: false,
      };
    case 'upcoming':
      return {
        label: opensAt ? `Opens at ${opensAt}` : 'Coming Soon',
        backgroundColor: 'transparent',
        textColor: '#8E8E93',
        borderColor: '#8E8E93',
        filled: false,
      };
    default:
      return {
        label: '',
        backgroundColor: 'transparent',
        textColor: '#000000',
        borderColor: '#000000',
        filled: false,
      };
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
  const statusConfig = getStatusConfig(status, opensAt);
  const displayedParticipants = participants.slice(0, 3);
  const extraCount = participantCount > displayedParticipants.length
    ? participantCount - displayedParticipants.length
    : 0;

  const renderActionButton = () => {
    const buttonColor = statusConfig.filled ? statusConfig.backgroundColor : statusConfig.borderColor;

    if (status === 'registered') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: buttonColor }]}
          onPress={onAction}
        >
          <CheckIcon size={14} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }

    if (status === 'requested') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: buttonColor }]}
          onPress={onAction}
        >
          <LoaderIcon size={14} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: statusConfig.filled ? buttonColor : buttonColor }
        ]}
        onPress={onAction}
      >
        <Text style={styles.infoButtonText}>i</Text>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.topSection}>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.eventImage} />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {providerLogo && (
              <Image source={{ uri: providerLogo }} style={styles.providerLogo} />
            )}
          </View>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.provider}>Provided by: {provider}</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusConfig.backgroundColor,
              borderColor: statusConfig.borderColor,
              borderWidth: statusConfig.filled ? 0 : 1,
            }
          ]}
        >
          <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={onBookmark}>
          <StarsIcon size={16} color={isBookmarked ? '#FFD700' : '#212121'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onShare}>
          <ShareIcon size={14} color="#000000" />
        </TouchableOpacity>

        {renderActionButton()}
      </View>

      <View style={styles.participantsSection}>
        <View style={styles.avatarStack}>
          {displayedParticipants.length > 0
            ? displayedParticipants.map((p, index) => (
                p.profile_image ? (
                  <Image
                    key={p.id}
                    source={{ uri: p.profile_image }}
                    style={[
                      styles.avatarCircle,
                      { marginLeft: index === 0 ? 0 : -5 }
                    ]}
                  />
                ) : (
                  <View
                    key={p.id}
                    style={[
                      styles.avatarCircle,
                      styles.avatarInitial,
                      { marginLeft: index === 0 ? 0 : -5 }
                    ]}
                  >
                    <Text style={styles.avatarInitialText}>
                      {p.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )
              ))
            : [0, 1, 2].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.avatarCircle,
                    { marginLeft: index === 0 ? 0 : -5 }
                  ]}
                />
              ))
          }
        </View>
        <Text style={styles.participantsText}>
          <Text style={styles.participantsBold}>
            {displayedParticipants.length > 0
              ? displayedParticipants.map(p => p.username).join(', ')
              : ''}
          </Text>
          {extraCount > 0 && (
            <Text style={styles.participantsBold}> +{extraCount}</Text>
          )}
          {participantCount > 0 ? ' participating' : 'No participants yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageContainer: {
    width: 80,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  providerLogo: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 0.1,
    borderColor: '#000000',
  },
  date: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  provider: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 12,
    color: '#494949',
    marginTop: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    height: 19,
    paddingHorizontal: 6,
    borderRadius: 5,
    justifyContent: 'center',
    flex: 1,
  },
  statusText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 35,
    height: 19,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 8,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E8E93',
  },
  avatarInitialText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  participantsText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#000000',
  },
  participantsBold: {
    fontFamily: 'OpenSans-Bold',
    fontWeight: '700',
  },
});
