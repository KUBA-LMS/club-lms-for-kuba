import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { ClockIcon, CloseIcon, SearchIcon } from '../icons';
import { colors } from '../../constants';
import { SearchResult } from '../../services/events';
import { SearchHistoryItem } from '../../services/storage';

interface SearchDropdownProps {
  mode: 'history' | 'results';
  results: SearchResult[];
  history: SearchHistoryItem[];
  isLoading: boolean;
  onSelectResult: (item: SearchResult) => void;
  onSelectHistory: (item: SearchHistoryItem) => void;
  onRemoveHistory: (timestamp: number) => void;
  onClearHistory: () => void;
}

export default function SearchDropdown({
  mode,
  results,
  history,
  isLoading,
  onSelectResult,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
}: SearchDropdownProps) {
  const { height: screenHeight } = useWindowDimensions();
  const maxHeight = screenHeight * 0.45;

  if (mode === 'history') {
    return (
      <View style={[styles.container, { maxHeight }]}>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent searches</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={onClearHistory} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearButton}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {history.map((item) => (
                <TouchableOpacity
                  key={item.timestamp}
                  style={styles.row}
                  onPress={() => onSelectHistory(item)}
                  activeOpacity={0.6}
                >
                  <View style={styles.iconContainer}>
                    <ClockIcon size={18} color={colors.gray500} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    {item.address && (
                      <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemoveHistory(item.timestamp)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteButton}
                  >
                    <CloseIcon size={14} color={colors.gray400} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    );
  }

  // Results mode
  return (
    <View style={[styles.container, { maxHeight }]}>
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.gray500} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {results.map((item, index) => (
            <TouchableOpacity
              key={`${item.id}-${index}`}
              style={styles.row}
              onPress={() => onSelectResult(item)}
              activeOpacity={0.6}
            >
              <View style={styles.iconContainer}>
                <SearchIcon size={16} color={colors.gray500} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.type === 'event' ? item.title : item.name}
                </Text>
                {item.type === 'event' && (
                  <Text style={styles.address} numberOfLines={1}>
                    {item.provider} · {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.gray500,
  },
  clearButton: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.primary,
  },
  address: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.gray400,
  },
  loadingState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
