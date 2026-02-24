import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { getEvent } from '../../services/events';
import { toggleBookmark } from '../../services/bookmarks';
import { EventWithStatus } from '../../types/event';
import { ArrowBackIcon, StarsIcon, ShareIcon } from '../../components/icons';
import { colors, screenPadding } from '../../constants';

type ScreenRouteProp = RouteProp<MainStackParamList, 'EventDetail'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { eventId } = route.params;

  const [event, setEvent] = useState<EventWithStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEvent(eventId)
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const handleToggleBookmark = useCallback(async () => {
    if (!event) return;
    setEvent((prev) => prev ? { ...prev, is_bookmarked: !prev.is_bookmarked } : prev);
    try {
      await toggleBookmark(event.id);
    } catch {
      setEvent((prev) => prev ? { ...prev, is_bookmarked: !prev.is_bookmarked } : prev);
    }
  }, [event]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowBackIcon size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </View>
    );
  }

  const costLabel = event.cost_type === 'free'
    ? 'FREE'
    : event.cost_amount
      ? `${Number(event.cost_amount).toLocaleString()} KRW`
      : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowBackIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <StarsIcon size={20} color={event.is_bookmarked ? '#FFD700' : '#212121'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Image */}
        <View style={styles.imageSection}>
          {event.images?.[0] ? (
            <Image source={{ uri: event.images[0] }} style={styles.eventImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Event Image</Text>
            </View>
          )}
          <View style={styles.badgesRow}>
            {event.event_type === 'official' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Official</Text>
              </View>
            )}
            {event.cost_type === 'free' && (
              <View style={[styles.badge, styles.freeBadge]}>
                <Text style={styles.badgeText}>Free</Text>
              </View>
            )}
            {event.cost_type === 'prepaid' && (
              <View style={[styles.badge, styles.prepaidBadge]}>
                <Text style={styles.badgeText}>Prepaid</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title & Date */}
        <View style={styles.contentSection}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>

          {/* Info rows */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Period</Text>
              <Text style={styles.infoValue}>
                {formatDate(event.registration_start)} ~ {formatDate(event.registration_end)}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cost</Text>
              <Text style={[styles.infoValue, event.cost_type === 'free' && styles.infoValueGreen]}>
                {costLabel}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Slots</Text>
              <Text style={[styles.infoValue, styles.infoValueGreen]}>
                {event.max_slots - event.current_slots}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Provided by</Text>
              <View style={styles.providerRow}>
                {event.club.logo_image && (
                  <Image source={{ uri: event.club.logo_image }} style={styles.providerLogo} />
                )}
                <Text style={styles.infoValueBold}>{event.club.name}</Text>
              </View>
            </View>
          </View>

          {/* Address */}
          {event.event_location && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Address</Text>
              <Text style={styles.cardText}>{event.event_location}</Text>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.cardText}>{event.description}</Text>
            </View>
          )}

          {/* Participants preview */}
          {event.participants_preview.length > 0 && (
            <View style={styles.participantsSection}>
              <Text style={styles.cardTitle}>Participants</Text>
              <View style={styles.participantsList}>
                {event.participants_preview.map((p) => (
                  <View key={p.id} style={styles.participantItem}>
                    {p.profile_image ? (
                      <Image source={{ uri: p.profile_image }} style={styles.participantAvatar} />
                    ) : (
                      <View style={[styles.participantAvatar, styles.participantAvatarEmpty]}>
                        <Text style={styles.participantInitial}>
                          {p.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.participantName} numberOfLines={1}>{p.username}</Text>
                  </View>
                ))}
                {event.current_slots > event.participants_preview.length && (
                  <Text style={styles.moreParticipants}>
                    +{event.current_slots - event.participants_preview.length} more
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding.horizontal,
    height: 50,
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#8E8E93',
  },
  imageSection: {
    height: 220,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  badgesRow: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 64,
    justifyContent: 'center',
  },
  freeBadge: {
    backgroundColor: colors.success,
  },
  prepaidBadge: {
    backgroundColor: '#A855F7',
  },
  badgeText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  contentSection: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: 20,
  },
  eventTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#000000',
  },
  eventDate: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#595959',
    marginTop: 4,
  },
  infoSection: {
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#000000',
  },
  infoValue: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#000000',
    textAlign: 'right',
  },
  infoValueBold: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
    color: '#000000',
  },
  infoValueGreen: {
    color: colors.success,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  cardText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#000000',
    lineHeight: 20,
  },
  participantsSection: {
    marginTop: 20,
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  participantItem: {
    alignItems: 'center',
    width: 56,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  participantAvatarEmpty: {
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantInitial: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  participantName: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    color: '#595959',
    marginTop: 4,
    textAlign: 'center',
  },
  moreParticipants: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
});
