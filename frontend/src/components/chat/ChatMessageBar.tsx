import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import { PlusIcon, SendArrowIcon } from '../icons';

interface ChatMessageBarProps {
  onSend: (text: string) => void;
  onTransferTicket: () => void;
  onRequestSplit: () => void;
  isSending?: boolean;
}

export default function ChatMessageBar({
  onSend,
  onTransferTicket,
  onRequestSplit,
  isSending,
}: ChatMessageBarProps) {
  const [text, setText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  // Local dedup guard: React Native's TouchableOpacity still fires onPress
  // even when `disabled` is true, so we gate the handler ourselves.
  const sendingRef = useRef(false);

  const toggleActions = () => {
    if (showActions) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowActions(false));
    } else {
      setShowActions(true);
      Keyboard.dismiss();
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || sendingRef.current) return;
    sendingRef.current = true;
    setText('');
    try {
      onSend(trimmed);
    } finally {
      // Release the local guard on the next tick; parent's ``isSending`` prop
      // then takes over to block further sends while the network call runs.
      setTimeout(() => {
        sendingRef.current = false;
      }, 0);
    }
  };

  const handleAction = (action: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      setShowActions(false);
      action();
    });
  };

  const actionsHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  return (
    <View style={styles.wrapper}>
      {showActions && (
        <Animated.View style={[styles.actionsPanel, { height: actionsHeight }]}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleAction(onTransferTicket)}
            activeOpacity={0.6}
          >
            <View style={[styles.actionDot, { backgroundColor: '#8B5CF6' }]} />
            <Animated.Text style={styles.actionLabel}>Transfer Ticket</Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleAction(onRequestSplit)}
            activeOpacity={0.6}
          >
            <View style={[styles.actionDot, { backgroundColor: '#FFB800' }]} />
            <Animated.Text style={styles.actionLabel}>1/N</Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <View style={styles.bar}>
        <TouchableOpacity style={styles.plusButton} onPress={toggleActions} activeOpacity={0.6}>
          <PlusIcon size={22} color={showActions ? '#8E8E93' : '#000000'} />
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={2000}
            onFocus={() => {
              if (showActions) {
                Animated.timing(slideAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: false,
                }).start(() => setShowActions(false));
              }
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!text.trim() || isSending}
          activeOpacity={0.6}
        >
          <SendArrowIcon size={32} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  actionsPanel: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  plusButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 120,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
    padding: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
