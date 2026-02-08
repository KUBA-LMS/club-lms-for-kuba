import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
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
}: TypeSelectorBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const options = type === 'event' ? EVENT_TYPES : COST_TYPES;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
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
});
