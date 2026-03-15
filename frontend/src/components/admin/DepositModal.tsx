import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface DepositModalProps {
  visible: boolean;
  mode: 'topup' | 'deduct';
  username: string;
  onClose: () => void;
  onConfirm: (amount: number, description: string) => void;
}

export default function DepositModal({
  visible,
  mode,
  username,
  onClose,
  onConfirm,
}: DepositModalProps) {
  const [amount, setAmount] = useState('');

  const handleConfirm = () => {
    const num = parseInt(amount, 10);
    if (!num || num <= 0) return;
    const desc =
      mode === 'topup'
        ? `Top up Deposit (${username})`
        : `Deduct Deposit (${username})`;
    onConfirm(mode === 'deduct' ? -num : num, desc);
    setAmount('');
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const isValid = parseInt(amount, 10) > 0;

  const displayValue = mode === 'deduct' && amount ? `-${amount}` : amount;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>
            {mode === 'topup' ? 'Top Up Deposit' : 'Deduct Deposit'}
          </Text>

          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={displayValue}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="Enter Total Amount"
              placeholderTextColor="#C5C5C5"
            />
            <Text style={styles.currencyLabel}>KRW</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.proceedButton, !isValid && styles.proceedButtonDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={!isValid}
            >
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 24,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    padding: 0,
  },
  currencyLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#FF383C',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  proceedButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#000000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    opacity: 0.4,
  },
  proceedButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
