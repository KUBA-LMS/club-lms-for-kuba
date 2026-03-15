import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { OnePassTicket } from '../../types/onepass';

interface EventInfoPanelProps {
  ticket: OnePassTicket;
  onDetailsPress?: () => void;
}

export default function EventInfoPanel({ ticket, onDetailsPress }: EventInfoPanelProps) {
  const { event } = ticket;

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>

      {event.description ? (
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <Text style={styles.description}>
            {event.description}
          </Text>
        </ScrollView>
      ) : null}

      <TouchableOpacity style={styles.detailsButton} onPress={onDetailsPress}>
        <Text style={styles.detailsText}>{'Details  >'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    minHeight: 120,
  },
  title: {
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  scrollArea: {
    maxHeight: 140,
  },
  description: {
    fontFamily: 'Gafata-Regular',
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  detailsButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detailsText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 11,
    color: '#FFFFFF',
  },
});
