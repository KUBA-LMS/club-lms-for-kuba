import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EventType = 'official' | 'private';
type CostType = 'free' | 'prepaid' | 'one_n';

interface TypeSelectorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: EventType | CostType) => void;
  type: 'event' | 'cost';
  selectedValue?: EventType | CostType;
  costAmount?: number;
  onCostAmountChange?: (amount: number | undefined) => void;
}

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'official', label: 'Official', color: '#000000' },
  { value: 'private', label: 'Private', color: '#D4A574' },
];

const COST_TYPES: { value: CostType; label: string; color: string }[] = [
  { value: 'free', label: 'Free', color: '#34C759' },
  { value: 'prepaid', label: 'Prepaid', color: '#A855F7' },
  { value: 'one_n', label: '1/N', color: '#3B82F6' },
];

export default function TypeSelectorBottomSheet({
  visible,
  onClose,
  onSelect,
  type,
  selectedValue,
  costAmount,
  onCostAmountChange,
}: TypeSelectorBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const options = type === 'event' ? EVENT_TYPES : COST_TYPES;
  const priceInputRef = useRef<TextInput>(null);
  const showPriceInput = type === 'cost' && (selectedValue === 'prepaid' || selectedValue === 'one_n');

  useEffect(() => {
    if (showPriceInput) {
      setTimeout(() => priceInputRef.current?.focus(), 300);
    }
  }, [showPriceInput]);

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={handleOverlayPress}>
        <Pressable
          style={[styles.container, { paddingBottom: insets.bottom + 16 }]}
          onPress={() => Keyboard.dismiss()}
        >
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  selectedValue === option.value && styles.optionItemSelected,
                ]}
                onPress={() => onSelect(option.value)}
              >
                <View style={[styles.badge, { backgroundColor: option.color }]}>
                  <Text style={styles.badgeText}>{option.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {showPriceInput && (
            <View style={styles.priceInputContainer}>
              <TextInput
                ref={priceInputRef}
                style={styles.priceInput}
                value={costAmount?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  onCostAmountChange?.(isNaN(num) ? undefined : num);
                }}
                placeholder="Enter amount"
                placeholderTextColor="#8E8E93"
                keyboardType="number-pad"
              />
              <Text style={styles.currencyLabel}>KRW</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    marginBottom: 12,
  },
  doneButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  doneButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  optionsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  optionItem: {
    opacity: 0.6,
  },
  optionItemSelected: {
    opacity: 1,
  },
  badge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 32,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C5C5C5',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
  },
  priceInput: {
    flex: 1,
    fontFamily: 'OpenSans-Regular',
    fontSize: 15,
    color: '#1E1E1E',
    padding: 0,
  },
  currencyLabel: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 8,
  },
});
