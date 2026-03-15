import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
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

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

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

  const monthRef = useRef<ScrollView>(null);
  const dayRef = useRef<ScrollView>(null);
  const yearRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate.getMonth());
      setDay(selectedDate.getDate());
      setYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);

  // Scroll to selected items when modal opens
  const baseYear = new Date().getFullYear();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        monthRef.current?.scrollTo({ y: month * ITEM_HEIGHT, animated: false });
        dayRef.current?.scrollTo({ y: (day - 1) * ITEM_HEIGHT, animated: false });
        yearRef.current?.scrollTo({ y: (year - baseYear) * ITEM_HEIGHT, animated: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, month, day, year, baseYear]);

  const handleDone = () => {
    const date = new Date(year, month, day);
    onSelect(date);
  };

  const years = Array.from({ length: 10 }, (_, i) => baseYear + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Padding to center the first and last items
  const padCount = Math.floor(VISIBLE_ITEMS / 2);

  const handleMonthScroll = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < MONTHS.length) setMonth(index);
  };

  const handleDayScroll = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < days.length) setDay(index + 1);
  };

  const handleYearScroll = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < years.length) setYear(years[index]);
  };

  const snapToItem = (ref: React.RefObject<ScrollView | null>, index: number) => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

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
            {/* Highlight bar for selected row */}
            <View style={styles.selectionHighlight} pointerEvents="none" />

            {/* Month */}
            <ScrollView
              ref={monthRef}
              style={styles.pickerColumn}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * padCount,
              }}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                handleMonthScroll(index * ITEM_HEIGHT);
              }}
              onScrollEndDrag={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                snapToItem(monthRef, index);
                handleMonthScroll(index * ITEM_HEIGHT);
              }}
            >
              {MONTHS.map((m, index) => (
                <TouchableOpacity
                  key={m}
                  style={styles.pickerItem}
                  onPress={() => {
                    setMonth(index);
                    snapToItem(monthRef, index);
                  }}
                >
                  <Text style={[
                    styles.pickerText,
                    month === index && styles.pickerTextSelected,
                  ]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Day */}
            <ScrollView
              ref={dayRef}
              style={styles.pickerColumn}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * padCount,
              }}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                handleDayScroll(index * ITEM_HEIGHT);
              }}
              onScrollEndDrag={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                snapToItem(dayRef, index);
                handleDayScroll(index * ITEM_HEIGHT);
              }}
            >
              {days.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.pickerItem}
                  onPress={() => {
                    setDay(d);
                    snapToItem(dayRef, d - 1);
                  }}
                >
                  <Text style={[
                    styles.pickerText,
                    day === d && styles.pickerTextSelected,
                  ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Year */}
            <ScrollView
              ref={yearRef}
              style={styles.pickerColumn}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * padCount,
              }}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                handleYearScroll(index * ITEM_HEIGHT);
              }}
              onScrollEndDrag={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                snapToItem(yearRef, index);
                handleYearScroll(index * ITEM_HEIGHT);
              }}
            >
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={styles.pickerItem}
                  onPress={() => {
                    setYear(y);
                    snapToItem(yearRef, y - baseYear);
                  }}
                >
                  <Text style={[
                    styles.pickerText,
                    year === y && styles.pickerTextSelected,
                  ]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    marginBottom: 8,
    height: 36,
    justifyContent: 'flex-start',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    paddingHorizontal: 24,
    position: 'relative',
  },
  selectionHighlight: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    height: ITEM_HEIGHT,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#8E8E93',
  },
  pickerTextSelected: {
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});
