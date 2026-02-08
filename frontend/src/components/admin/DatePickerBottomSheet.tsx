import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DatePickerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate?: Date;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DatePickerBottomSheet({
  visible,
  onClose,
  onSelect,
  selectedDate,
}: DatePickerBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(selectedDate?.getMonth() ?? new Date().getMonth());
  const [day, setDay] = useState(selectedDate?.getDate() ?? new Date().getDate());
  const [year, setYear] = useState(selectedDate?.getFullYear() ?? new Date().getFullYear());

  useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate.getMonth());
      setDay(selectedDate.getDate());
      setYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);

  const handleDone = () => {
    const date = new Date(year, month, day);
    onSelect(date);
  };

  // Generate arrays for picker
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            {/* Month */}
            <View style={styles.pickerColumn}>
              {MONTHS.map((m, index) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pickerItem, month === index && styles.pickerItemSelected]}
                  onPress={() => setMonth(index)}
                >
                  <Text style={[styles.pickerText, month === index && styles.pickerTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Day */}
            <View style={styles.pickerColumn}>
              {days.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pickerItem, day === d && styles.pickerItemSelected]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.pickerText, day === d && styles.pickerTextSelected]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Year */}
            <View style={styles.pickerColumn}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, year === y && styles.pickerItemSelected]}
                  onPress={() => setYear(y)}
                >
                  <Text style={[styles.pickerText, year === y && styles.pickerTextSelected]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    marginBottom: 16,
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
  pickerContainer: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: 24,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickerItemSelected: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  pickerText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#8E8E93',
  },
  pickerTextSelected: {
    fontFamily: 'OpenSans-Bold',
    color: '#000000',
  },
});
