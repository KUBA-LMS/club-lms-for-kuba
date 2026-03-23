import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, font } from '../../constants';
import { resolveImageUrl } from '../../utils/image';
import { AdminEvent, AdminEventListResponse } from '../../services/adminHub';

interface EventListSectionProps {
  eventData: AdminEventListResponse | null;
  eventsLoading: boolean;
  onEditEvent: (eventId: string) => void;
  onExportCsv: (eventId: string, eventTitle: string) => void;
}

const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function EventCard({
  event,
  onEditEvent,
  onExportCsv,
}: {
  event: AdminEvent;
  onEditEvent: (eventId: string) => void;
  onExportCsv: (eventId: string, eventTitle: string) => void;
}) {
  return (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.eventRow}>
        {/* Thumbnail with Edit overlay */}
        <View style={styles.eventThumbWrap}>
          {event.images.length > 0 ? (
            <Image source={{ uri: resolveImageUrl(event.images[0])! }} style={styles.eventThumb} />
          ) : (
            <View style={[styles.eventThumb, styles.eventThumbPlaceholder]} />
          )}
          <TouchableOpacity
            style={styles.editOverlay}
            onPress={() => onEditEvent(event.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.editOverlayText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.eventInfoCol}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.eventBadgeRow}>
            <View
              style={[
                styles.eventBadge,
                event.event_type === 'official' ? styles.badgeOfficial : styles.badgePrivate,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {event.event_type === 'official' ? 'Official' : 'Private'}
              </Text>
            </View>
            <View
              style={[
                styles.eventBadge,
                event.cost_type === 'free'
                  ? styles.badgeFree
                  : event.cost_type === 'one_n'
                    ? styles.badgeOneN
                    : styles.badgePaid,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {event.cost_type === 'free'
                  ? 'Free'
                  : event.cost_type === 'one_n'
                    ? '1/N'
                    : 'Prepaid'}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.eventStatus,
              event.status === 'open' ? styles.statusOpen : styles.statusExpired,
            ]}
          >
            Status: {event.status === 'open' ? 'Open' : 'Expired'}
          </Text>
        </View>

        {/* Separator + Date + CSV */}
        <View style={styles.eventSeparator} />
        <View style={styles.eventRightCol}>
          <Text style={styles.eventDate}>{formatEventDate(event.event_date)}</Text>
          <TouchableOpacity
            style={styles.csvButton}
            onPress={() => onExportCsv(event.id, event.title)}
            activeOpacity={0.7}
          >
            <Text style={styles.csvButtonText}>Download CSV Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function EventListSection({
  eventData,
  eventsLoading,
  onEditEvent,
  onExportCsv,
}: EventListSectionProps) {
  if (eventsLoading || !eventData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  return (
    <>
      {eventData.upcoming.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {eventData.upcoming.map((e) => (
            <EventCard key={e.id} event={e} onEditEvent={onEditEvent} onExportCsv={onExportCsv} />
          ))}
        </>
      )}
      {eventData.past.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Past Events</Text>
          {eventData.past.map((e) => (
            <EventCard key={e.id} event={e} onEditEvent={onEditEvent} onExportCsv={onExportCsv} />
          ))}
        </>
      )}
      {eventData.upcoming.length === 0 && eventData.past.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No events found</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray500,
  },
  sectionTitle: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  eventCard: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
    paddingHorizontal: 0,
    marginLeft: 0,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventThumbWrap: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  eventThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  eventThumbPlaceholder: {
    backgroundColor: '#E8E8ED',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editOverlayText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.white,
  },
  eventInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontFamily: font.bold,
    fontSize: 14,
    color: '#1C1C1E',
  },
  eventBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  eventBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeOfficial: {
    backgroundColor: '#1C1C1E',
  },
  badgePrivate: {
    backgroundColor: colors.success,
  },
  badgeFree: {
    backgroundColor: colors.success,
  },
  badgeOneN: {
    backgroundColor: colors.primary,
  },
  badgePaid: {
    backgroundColor: '#FF69B4',
  },
  eventBadgeText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.white,
  },
  eventStatus: {
    fontFamily: font.bold,
    fontSize: 11,
    marginTop: 4,
  },
  statusOpen: {
    color: colors.success,
  },
  statusExpired: {
    color: colors.gray500,
  },
  eventSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 50,
    backgroundColor: colors.gray100,
    marginHorizontal: 10,
  },
  eventRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
  },
  eventDate: {
    fontFamily: font.regular,
    fontSize: 11,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  csvButton: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  csvButtonText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: '#1C1C1E',
  },
});
