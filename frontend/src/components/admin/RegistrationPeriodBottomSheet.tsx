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

interface RegistrationPeriodBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (start: Date, end: Date) => void;
  startDate?: Date;
  endDate?: Date;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function RegistrationPeriodBottomSheet({
  visible,
  onClose,
  onSelect,
  startDate,
  endDate,
}: RegistrationPeriodBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const now = new Date();

  const [start, setStart] = useState<Date>(startDate || now);
  const [end, setEnd] = useState<Date>(endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const [startTime, setStartTime] = useState('1:59 PM');
  const [endTime, setEndTime] = useState('3:59 PM');

  useEffect(() => {
    if (startDate) setStart(startDate);
    if (endDate) setEnd(endDate);
  }, [startDate, endDate]);

  const formatDate = (date: Date) => {
    return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleDone = () => {
    onSelect(start, end);
  };

  // Simple date adjustment buttons
  const adjustDate = (type: 'start' | 'end', days: number) => {
    if (type === 'start') {
      const newDate = new Date(start);
      newDate.setDate(newDate.getDate() + days);
      setStart(newDate);
    } else {
      const newDate = new Date(end);
      newDate.setDate(newDate.getDate() + days);
      setEnd(newDate);
    }
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

          <View style={styles.content}>
            {/* Start Date */}
            <View style={styles.dateRow}>
              <Text style={styles.label}>Starts:</Text>
              <View style={styles.dateControls}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustDate('start', -1)}
                >
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateText}>{formatDate(start)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustDate('start', 1)}
                >
                  <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{startTime}</Text>
                </View>
              </View>
            </View>

            {/* End Date */}
            <View style={styles.dateRow}>
              <Text style={styles.label}>Ends:</Text>
              <View style={styles.dateControls}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustDate('end', -1)}
                >
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateText}>{formatDate(end)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustDate('end', 1)}
                >
                  <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{endTime}</Text>
                </View>
              </View>
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
  content: {
    paddingHorizontal: 24,
    gap: 24,
    paddingBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#000000',
    width: 60,
  },
  dateControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 20,
    color: '#000000',
  },
  dateDisplay: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#000000',
  },
  timeDisplay: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timeText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#000000',
  },
});
