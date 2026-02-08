import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../constants';

export type RegistrationModalState =
  | 'loading'
  | 'completed'
  | 'slots_full'
  | 'cancel_confirm'
  | 'cancel_loading'
  | 'cancel_completed'
  | 'prepaid_confirm'
  | 'prepaid_completed'
  | 'error'
  | null;

interface RegistrationModalProps {
  visible: boolean;
  state: RegistrationModalState;
  onClose: () => void;
  onCancelConfirm?: () => void;
  onCancelBack?: () => void;
  onPrepaidConfirm?: () => void;
  onPrepaidBack?: () => void;
  paymentDeadline?: Date;
}

const CheckIcon = ({ size = 80 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={40} r={38} stroke="#4CAF50" strokeWidth={4} />
    <Path
      d="M24 40L35 51L56 30"
      stroke="#4CAF50"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WarningIcon = ({ size = 80 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={40} r={38} stroke="#FF4444" strokeWidth={4} />
    <Path
      d="M40 24V44"
      stroke="#FF4444"
      strokeWidth={4}
      strokeLinecap="round"
    />
    <Circle cx={40} cy={54} r={3} fill="#FF4444" />
  </Svg>
);

// Hook for countdown timer
function useCountdown(targetDate?: Date) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    intervalRef.current = setInterval(calculateTimeLeft, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetDate]);

  return timeLeft;
}

export default function RegistrationModal({
  visible,
  state,
  onClose,
  onCancelConfirm,
  onCancelBack,
  onPrepaidConfirm,
  onPrepaidBack,
  paymentDeadline,
}: RegistrationModalProps) {
  const countdown = useCountdown(paymentDeadline);

  if (!visible || !state) return null;

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.loadingText}>Processing...</Text>
      <Text style={styles.loadingSubtext}>Please do not close this window</Text>
    </View>
  );

  const renderCompleted = () => (
    <View style={styles.dialogContainer}>
      <CheckIcon size={80} />
      <Text style={styles.dialogTitle}>Registration Completed!</Text>
      <Text style={styles.dialogSubtitle}>
        You can check your ticket in the Tickets tab
      </Text>
      <TouchableOpacity style={styles.doneButton} onPress={onClose}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSlotsFull = () => (
    <View style={styles.dialogContainer}>
      <WarningIcon size={80} />
      <Text style={styles.dialogTitle}>Slots full</Text>
      <Text style={styles.dialogSubtitle}>
        This event has reached maximum capacity
      </Text>
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCancelConfirm = () => (
    <View style={styles.dialogContainer}>
      <Text style={styles.dialogTitle}>Confirm cancellation?</Text>
      <Text style={styles.dialogSubtitle}>
        Please be aware that{' '}
        <Text style={styles.warningText}>
          reapplication may not be possible if all seats are filled.
        </Text>
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBackButton}
          onPress={onCancelBack}
        >
          <Text style={styles.cancelBackButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={onCancelConfirm}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCancelCompleted = () => (
    <View style={styles.dialogContainer}>
      <Text style={styles.dialogTitle}>Cancellation Completed!</Text>
      <TouchableOpacity style={styles.doneButton} onPress={onClose}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.dialogContainer}>
      <WarningIcon size={80} />
      <Text style={styles.dialogTitle}>Something went wrong</Text>
      <Text style={styles.dialogSubtitle}>
        Please try again later
      </Text>
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPrepaidConfirm = () => (
    <View style={styles.dialogContainer}>
      <Text style={styles.dialogTitle}>Non-refundable prepaid event</Text>
      <Text style={styles.dialogSubtitle}>
        You must pay within{' '}
        <Text style={styles.warningText}>24 hours</Text>
        {' '}to secure your spot.{'\n'}
        Otherwise, your{' '}
        <Text style={styles.warningText}>deposit will be deducted</Text>
        {' '}and cannot be refunded.
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBackButton}
          onPress={onPrepaidBack}
        >
          <Text style={styles.cancelBackButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={onPrepaidConfirm}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const formatCountdown = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${countdown.hours}h ${pad(countdown.minutes)}min ${pad(countdown.seconds)}sec`;
  };

  const renderPrepaidCompleted = () => (
    <View style={styles.dialogContainer}>
      <CheckIcon size={80} />
      <Text style={styles.dialogTitle}>Your reservation is complete.</Text>
      <Text style={styles.dialogSubtitle}>
        Please complete the payment by the deadline
      </Text>
      <TouchableOpacity style={styles.paymentDeadlineButton} disabled>
        <Text style={styles.paymentDeadlineButtonText}>Registration Requested</Text>
        <Text style={styles.countdownText}>{formatCountdown()}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.doneButton} onPress={onClose}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (state) {
      case 'loading':
      case 'cancel_loading':
        return renderLoading();
      case 'completed':
        return renderCompleted();
      case 'slots_full':
        return renderSlotsFull();
      case 'cancel_confirm':
        return renderCancelConfirm();
      case 'cancel_completed':
        return renderCancelCompleted();
      case 'prepaid_confirm':
        return renderPrepaidConfirm();
      case 'prepaid_completed':
        return renderPrepaidCompleted();
      case 'error':
        return renderError();
      default:
        return null;
    }
  };

  const isLoadingState = state === 'loading' || state === 'cancel_loading';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          isLoadingState ? styles.overlayDark : styles.overlayLight,
        ]}
      >
        {renderContent()}
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const dialogWidth = Math.min(width - 48, 286);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 24,
  },
  loadingSubtext: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  dialogContainer: {
    width: dialogWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5.6 },
    shadowOpacity: 0.25,
    shadowRadius: 5.6,
    elevation: 6,
  },
  dialogTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
    color: colors.black,
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: colors.black,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningText: {
    color: '#FF8D28',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelBackButton: {
    backgroundColor: '#FF383C',
    paddingVertical: 8,
    paddingHorizontal: 23,
    borderRadius: 7,
    width: 98,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBackButtonText: {
    fontFamily: 'Inter',
    fontSize: 11.2,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  proceedButton: {
    backgroundColor: colors.black,
    paddingVertical: 8,
    paddingHorizontal: 23,
    borderRadius: 7,
    width: 98,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontFamily: 'Inter',
    fontSize: 11.2,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: colors.black,
    paddingVertical: 8,
    paddingHorizontal: 23,
    borderRadius: 8,
    width: 248,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButtonText: {
    fontFamily: 'NotoSansKR-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.39,
  },
  backButton: {
    marginTop: 28,
    backgroundColor: '#FF4444',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
    minWidth: 140,
  },
  backButtonText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  paymentDeadlineButton: {
    marginTop: 20,
    backgroundColor: '#FF8D28',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: 248,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentDeadlineButtonText: {
    fontFamily: 'NotoSansKR-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.33,
  },
  countdownText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
  },
});
