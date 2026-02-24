import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchAddress, GeocodingResult } from '../../services/geocoding';

interface AddressSearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: {
    address: string;
    latitude: number;
    longitude: number;
    detailAddress?: string;
  }) => void;
}

export default function AddressSearchBottomSheet({
  visible,
  onClose,
  onSelect,
}: AddressSearchBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(null);
  const [detailAddress, setDetailAddress] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setQuery('');
      setResults([]);
      setSelectedResult(null);
      setDetailAddress('');
    }
  }, [visible]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setSelectedResult(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchAddress(text);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, []);

  const handleSelectResult = useCallback((result: GeocodingResult) => {
    setSelectedResult(result);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedResult) return;
    onSelect({
      address: selectedResult.road_address || selectedResult.jibun_address || '',
      latitude: selectedResult.latitude,
      longitude: selectedResult.longitude,
      detailAddress: detailAddress.trim() || undefined,
    });
  }, [selectedResult, detailAddress, onSelect]);

  const renderItem = useCallback(({ item }: { item: GeocodingResult }) => {
    const isSelected = selectedResult?.latitude === item.latitude && selectedResult?.longitude === item.longitude;
    return (
      <TouchableOpacity
        style={[styles.resultItem, isSelected && styles.resultItemSelected]}
        onPress={() => handleSelectResult(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.placeName}>
          {item.name || item.road_address || item.jibun_address}
        </Text>
        {item.road_address && item.name && (
          <Text style={styles.addressSubtext}>{item.road_address}</Text>
        )}
      </TouchableOpacity>
    );
  }, [selectedResult, handleSelectResult]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <Text style={styles.title}>Search Address</Text>

          <View style={styles.searchContainer}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="Enter address or place name"
              placeholderTextColor="#8E8E93"
              returnKeyType="search"
            />
          </View>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
            </View>
          )}

          {!selectedResult ? (
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
              style={styles.resultList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                query.length >= 2 && !isLoading ? (
                  <Text style={styles.emptyText}>No results found</Text>
                ) : null
              }
            />
          ) : (
            <View style={styles.selectedContainer}>
              <View style={styles.selectedAddress}>
                <Text style={styles.selectedLabel}>Selected</Text>
                <Text style={styles.selectedText}>
                  {selectedResult.road_address || selectedResult.jibun_address}
                </Text>
              </View>

              <TextInput
                style={styles.detailInput}
                value={detailAddress}
                onChangeText={setDetailAddress}
                placeholder="Detail address (optional)"
                placeholderTextColor="#8E8E93"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedResult(null)}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 15,
    color: '#1E1E1E',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  resultList: {
    maxHeight: 300,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  resultItemSelected: {
    backgroundColor: '#F0F0F0',
  },
  placeName: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
    color: '#1E1E1E',
    marginBottom: 2,
  },
  addressSubtext: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectedContainer: {
    paddingVertical: 12,
  },
  selectedAddress: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  selectedLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
  },
  selectedText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
    color: '#1E1E1E',
  },
  detailInput: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 15,
    color: '#1E1E1E',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 15,
    color: '#1E1E1E',
  },
  confirmButton: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
