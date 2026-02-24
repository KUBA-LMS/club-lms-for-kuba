import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EventSearchItem } from '../../types/accessControl';

interface EventSearchDropdownProps {
  results: EventSearchItem[];
  onSelect: (event: EventSearchItem) => void;
  searchQuery: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function EventSearchDropdown({
  results,
  onSelect,
  searchQuery,
}: EventSearchDropdownProps) {
  if (results.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No events found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {results.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.item}
          onPress={() => onSelect(event)}
        >
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
    marginHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  eventTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  eventDate: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#595959',
    marginLeft: 12,
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
