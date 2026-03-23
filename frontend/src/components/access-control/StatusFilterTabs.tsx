import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TicketStatus } from '../../types/accessControl';
import { colors, font } from '../../constants';

interface StatusFilterTabsProps {
  activeFilter: TicketStatus;
  onFilterChange: (filter: TicketStatus) => void;
  counts: Record<string, number>;
}

const FILTERS: { key: TicketStatus; label: string; color: string }[] = [
  { key: 'registered', label: 'Registered', color: colors.black },
  { key: 'requested', label: 'Requested', color: colors.status.requested },
  { key: 'checked_in', label: 'Checked-in', color: colors.success },
  { key: 'not_applied', label: 'Not Applied', color: '#FF383C' },
];

export default function StatusFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: StatusFilterTabsProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.tab,
              isActive && { backgroundColor: filter.color },
            ]}
            onPress={() => onFilterChange(filter.key)}
          >
            <Text
              style={[
                styles.tabText,
                isActive
                  ? styles.tabTextActive
                  : { color: filter.color },
              ]}
            >
              {filter.label} ({counts[filter.key] ?? 0})
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.gray50,
  },
  tabText: {
    fontFamily: font.semibold,
    fontSize: 11,
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.white,
  },
});
