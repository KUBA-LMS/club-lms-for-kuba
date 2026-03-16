import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { OnePassTicket } from '../../types/onepass';

interface EventInfoPanelProps {
  ticket: OnePassTicket;
  onDetailsPress?: () => void;
}

function CalendarIcon({ size = 12, color = 'rgba(255,255,255,0.4)' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRight({ size = 12, color = 'rgba(255,255,255,0.5)' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function EventInfoPanel({ ticket, onDetailsPress }: EventInfoPanelProps) {
  const { event } = ticket;
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(12);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
    slideUp.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
  }, [fadeIn, slideUp]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const dateText = formatEventDate(event.event_date);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          {dateText ? (
            <View style={styles.dateRow}>
              <CalendarIcon />
              <Text style={styles.dateText}>{dateText}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.detailsButton} onPress={onDetailsPress} activeOpacity={0.7}>
          <Text style={styles.detailsText}>Details</Text>
          <ChevronRight />
        </TouchableOpacity>
      </View>

      {event.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  titleBlock: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  detailsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    lineHeight: 18,
  },
});
