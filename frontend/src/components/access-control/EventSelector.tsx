import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

interface EventSelectorProps {
  selectedEventTitle?: string;
  isSearchMode: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onPress: () => void;
  onClearSearch: () => void;
}

export default function EventSelector({
  selectedEventTitle,
  isSearchMode,
  searchQuery,
  onSearchQueryChange,
  onPress,
  onClearSearch,
}: EventSelectorProps) {
  if (isSearchMode) {
    return (
      <View style={styles.container}>
        <View style={styles.searchPill}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder="Search Event or Provider"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoFocus
          />
          <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
            <Text style={styles.clearText}>X</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pill} onPress={onPress}>
        <Text style={styles.pillText} numberOfLines={1}>
          {selectedEventTitle || 'Search Event or Provider'}
        </Text>
        <Text style={styles.searchIcon}>Q</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pill: {
    backgroundColor: '#000000',
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pillText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  searchIcon: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  searchPill: {
    backgroundColor: '#000000',
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});
