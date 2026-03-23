import React, { forwardRef, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  useWindowDimensions,
  Linking,
  Clipboard,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, screenPadding, shadows } from '../../constants';
import { resolveImageUrl } from '../../utils/image';

const MapPinIcon = ({ size = 28, color = '#34C759' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size * 1.2} viewBox="0 0 28 34" fill="none">
    <Path
      d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 34 14 34C14 34 28 24.5 28 14C28 6.26801 21.732 0 14 0Z"
      fill={color}
    />
    <Circle cx="14" cy="14" r="6" fill="white" />
  </Svg>
);

const WarningIcon = ({ size = 16, color = '#FF3838' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.27 20.55 2.58 20.73C2.89 20.91 3.25 21 3.62 21H20.38C20.75 21 21.11 20.91 21.42 20.73C21.73 20.55 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.26 3.32 12.95 3.15C12.64 2.98 12.29 2.89 11.93 2.89C11.57 2.89 11.22 2.98 10.91 3.15C10.6 3.32 10.33 3.56 10.15 3.86L10.29 3.86Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export type RegistrationStatus = 'registered' | 'visited' | 'open' | 'requested' | 'closed' | 'upcoming' | 'payment_pending';

export interface EventDetailData {
  id: string | number;
  title: string;
  date: string;
  imageUri?: string;
  isOfficial?: boolean;
  isFree?: boolean;
  isPrepaid?: boolean;
  prepaidAmount?: number;
  hasChangeNotice?: boolean;
  lastUpdate?: string;
  registrationPeriod?: {
    start: string;
    end: string;
  };
  cost?: string;
  address?: string;
  description?: string;
  eventType?: string;
  costType?: string;
  availableSlots?: string | number;
  providedBy?: {
    name: string;
    logo?: string;
  };
  postedBy?: {
    name: string;
    avatar?: string;
  };
  postedOn?: string;
  transitTimes?: {
    publicTransit?: string;
    car?: string;
    walk?: string;
  };
  status?: RegistrationStatus;
  opensAt?: string;
  registrationId?: string;
  paymentDeadline?: Date;
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
}

interface EventDetailBottomSheetProps {
  event: EventDetailData | null;
  onClose?: () => void;
  onRegister?: () => void;
  onCancelRegistration?: () => void;
  onOnePass?: () => void;
  onFindWay?: () => void;
}

const getButtonConfig = (status?: RegistrationStatus, opensAt?: string) => {
  switch (status) {
    case 'registered':
      return {
        text: 'ONEPASS',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        disabled: false,
        action: 'onepass' as const,
        isOnePass: true,
        showCountdown: false,
      };
    case 'open':
      return {
        text: 'Register Now',
        backgroundColor: '#03CA5B',
        textColor: '#FFFFFF',
        disabled: false,
        action: 'register' as const,
        isOnePass: false,
        showCountdown: false,
      };
    case 'requested':
      return {
        text: 'Registration Requested',
        backgroundColor: '#FF8D28',
        textColor: '#FFFFFF',
        disabled: true,
        action: 'none' as const,
        isOnePass: false,
        showCountdown: false,
      };
    case 'payment_pending':
      return {
        text: 'Registration Requested',
        backgroundColor: '#FF8D28',
        textColor: '#FFFFFF',
        disabled: true,
        action: 'none' as const,
        isOnePass: false,
        showCountdown: true,
      };
    case 'visited':
      return {
        text: 'Visited',
        backgroundColor: 'transparent',
        textColor: '#FF3B30',
        borderColor: '#FF3B30',
        disabled: true,
        action: 'none' as const,
        isOnePass: false,
        showCountdown: false,
      };
    case 'closed':
      return {
        text: 'Registration Closed',
        backgroundColor: 'transparent',
        textColor: '#FF3B30',
        borderColor: '#FF3B30',
        disabled: true,
        action: 'none' as const,
        isOnePass: false,
        showCountdown: false,
      };
    case 'upcoming':
      return {
        text: opensAt ? `Opens ${opensAt}` : 'Coming Soon',
        backgroundColor: 'transparent',
        textColor: '#8E8E93',
        borderColor: '#8E8E93',
        disabled: true,
        action: 'none' as const,
        isOnePass: false,
        showCountdown: false,
      };
    default:
      return {
        text: 'Register Now',
        backgroundColor: '#03CA5B',
        textColor: '#FFFFFF',
        disabled: false,
        action: 'register' as const,
        isOnePass: false,
        showCountdown: false,
      };
  }
};

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

const EventDetailBottomSheet = forwardRef<BottomSheetModal, EventDetailBottomSheetProps>(
  ({ event, onClose, onRegister, onCancelRegistration, onOnePass, onFindWay }, ref) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const countdown = useCountdown(event?.paymentDeadline);

    const snapPoints = useMemo(() => ['75%', '95%'], []);
    const [descExpanded, setDescExpanded] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [bankModalVisible, setBankModalVisible] = useState(false);
    const [accountCopied, setAccountCopied] = useState(false);

    const handleCopyAccount = useCallback(() => {
      if (event?.bankAccountNumber) {
        Clipboard.setString(event.bankAccountNumber);
        setAccountCopied(true);
        setTimeout(() => setAccountCopied(false), 2000);
      }
    }, [event?.bankAccountNumber]);

    const handleOpenToss = useCallback(() => {
      Linking.openURL('supertoss://').catch(() => Linking.openURL('https://toss.im'));
    }, []);

    const buttonConfig = useMemo(
      () => getButtonConfig(event?.status, event?.opensAt),
      [event?.status, event?.opensAt]
    );

    const formatCountdown = useCallback(() => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${countdown.hours}h ${pad(countdown.minutes)}min ${pad(countdown.seconds)}sec`;
    }, [countdown]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0}
        />
      ),
      []
    );

    const renderHandle = useCallback(() => (
      <View style={styles.handleContainer}>
        <View style={styles.handleIndicator} />
      </View>
    ), []);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleComponent={renderHandle}
        onDismiss={onClose}
      >
        {event && (
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          {/* Event Image */}
          <TouchableOpacity
            style={styles.imageSection}
            activeOpacity={event.imageUri ? 0.9 : 1}
            onPress={() => { if (event.imageUri) setImageModalVisible(true); }}
          >
            {event.imageUri ? (
              <Image source={{ uri: resolveImageUrl(event.imageUri) }} style={styles.eventImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>Event Image</Text>
              </View>
            )}

            {/* Badges */}
            <View style={styles.badgesRow}>
              {event.isOfficial && (
                <View style={styles.officialBadge}>
                  <Text style={styles.badgeText}>Official</Text>
                </View>
              )}
              {event.isFree && (
                <View style={styles.freeBadge}>
                  <Text style={styles.badgeText}>Free</Text>
                </View>
              )}
              {event.isPrepaid && (
                <View style={styles.prepaidBadge}>
                  <Text style={styles.badgeText}>Prepaid</Text>
                </View>
              )}
              {event.hasChangeNotice && (
                <TouchableOpacity style={styles.changeNoticeBadge}>
                  <Text style={styles.changeNoticeText}>Change Notice</Text>
                  <WarningIcon size={16} color="#FF3838" />
                </TouchableOpacity>
              )}
            </View>

            {/* Change Notice Tooltip */}
            {event.hasChangeNotice && (
              <View style={styles.changeNoticeTooltip}>
                <Text style={styles.tooltipText}>
                  This post has been updated. Please review the event details carefully for changes.
                </Text>
                <Text style={styles.tooltipDate}>
                  Last Update: {event.lastUpdate || 'Aug 25, 2025 12:34 PM'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Content Section */}
          <View style={styles.contentSection}>
            {/* Title and Date */}
            <View style={styles.titleSection}>
              <View style={styles.titleContainer}>
                <Text style={styles.eventTitle}>{event.title}</Text>
              </View>
              <View style={styles.titleDivider} />
              <Text style={styles.eventDate}>{event.date}</Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                {
                  backgroundColor: buttonConfig.backgroundColor,
                  borderWidth: buttonConfig.borderColor ? 1 : 0,
                  borderColor: buttonConfig.borderColor,
                },
                buttonConfig.disabled && styles.registerButtonDisabled,
                buttonConfig.showCountdown && styles.registerButtonWithCountdown,
              ]}
              onPress={
                buttonConfig.action === 'register'
                  ? onRegister
                  : buttonConfig.action === 'onepass'
                  ? onOnePass
                  : event?.status === 'payment_pending' && event.bankAccountNumber
                  ? () => setBankModalVisible(true)
                  : undefined
              }
              disabled={buttonConfig.disabled && event?.status !== 'payment_pending'}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.registerButtonText,
                  { color: buttonConfig.textColor },
                ]}
              >
                {buttonConfig.text}
              </Text>
              {buttonConfig.showCountdown && (
                <Text style={styles.countdownText}>{formatCountdown()}</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Link - shown when registered or requested */}
            {(event.status === 'registered' || event.status === 'requested') && (
              <TouchableOpacity
                style={styles.cancelLinkContainer}
                onPress={onCancelRegistration}
              >
                <Text style={styles.cancelLinkText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {/* Period and Cost */}
            <View style={styles.periodCostSection}>
              <Text style={styles.periodText}>
                Period | <Text style={styles.periodBold}>{event.registrationPeriod?.start || 'Aug 25, 2025'}</Text>
                {' '}1:59PM~ <Text style={styles.periodBold}>{event.registrationPeriod?.end || 'Aug 30, 2025'}</Text> 3:59PM
              </Text>
              <Text style={styles.costText}>
                Cost: <Text style={styles.costFree}>{event.cost || 'FREE'}</Text>
              </Text>
            </View>

            {/* Address Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Address</Text>
              <View style={styles.addressContent}>
                <View style={styles.addressMapThumbnail}>
                  <MapPinIcon size={20} color="#34C759" />
                </View>
                <Text style={styles.addressText}>
                  {event.address || '2F, Minju House, 30-14 Jongam-ro 3-gil, Seongbuk-gu, Seoul, Republic of Korea'}
                </Text>
              </View>
              <TouchableOpacity style={styles.findWayButton} onPress={onFindWay}>
                <Text style={styles.findWayText}>Find a way</Text>
              </TouchableOpacity>
            </View>

            {/* Description Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text
                style={styles.descriptionText}
                numberOfLines={descExpanded ? undefined : 8}
              >
                {event.description || 'No description provided.'}
              </Text>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => setDescExpanded((v) => !v)}
              >
                <Text style={styles.viewMoreText}>
                  {descExpanded ? 'view less' : 'view more'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Event Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>EVENT TYPE:</Text>
                <View style={[styles.officialBadgeSmall, {
                  backgroundColor: event.eventType === 'official' ? colors.black : '#D4A574',
                }]}>
                  <Text style={styles.badgeTextSmall}>
                    {event.eventType === 'official' ? 'Official' : event.eventType === 'private' ? 'Private' : event.eventType || 'Official'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>COST TYPE:</Text>
                <View style={[styles.freeBadgeSmall, {
                  backgroundColor:
                    event.costType === 'free' ? colors.success :
                    event.costType === 'prepaid' ? '#A855F7' :
                    event.costType === 'one_n' ? '#3B82F6' :
                    colors.success,
                }]}>
                  <Text style={styles.badgeTextSmall}>
                    {event.costType === 'free' ? 'Free' :
                     event.costType === 'prepaid' ? 'Prepaid' :
                     event.costType === 'one_n' ? '1/N' :
                     event.costType || 'Free'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>REGISTRATION PERIOD:</Text>
                <Text style={styles.detailValue}>
                  {event.registrationPeriod?.start || 'Aug 25, 2025'} 1:59PM~ {event.registrationPeriod?.end || 'Aug 30, 2025'} 3:59PM
                </Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>AVAILABLE SLOTS:</Text>
                <Text style={[styles.detailValue, styles.detailValueGreen]}>
                  {event.availableSlots || 'Unlimited'}
                </Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PROVIDED BY:</Text>
                <View style={styles.providerRow}>
                  {event.providedBy?.logo && (
                    <Image source={{ uri: resolveImageUrl(event.providedBy.logo) }} style={styles.providerLogo} />
                  )}
                  <Text style={styles.detailValueBold}>
                    {event.providedBy?.name || '45th KUBA'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>POSTED BY:</Text>
                <View style={styles.providerRow}>
                  {event.postedBy?.avatar && (
                    <Image source={{ uri: resolveImageUrl(event.postedBy.avatar) }} style={styles.posterAvatar} />
                  )}
                  <Text style={styles.detailValueBold}>
                    {event.postedBy?.name || 'minju5'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>POSTED ON:</Text>
                <Text style={styles.detailValue}>
                  {event.postedOn || 'Aug 20, 2025'}
                </Text>
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: insets.bottom + 20 }} />
          </View>
        </BottomSheetScrollView>
        )}

      {/* Photo Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.photoModalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          />
          {event?.imageUri && (
            <Image
              source={{ uri: resolveImageUrl(event.imageUri) }}
              style={{
                width: screenWidth,
                height: screenWidth * (4 / 3),
                maxHeight: screenHeight * 0.88,
              }}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            style={[styles.photoModalClose, { top: insets.top + 12 }]}
            onPress={() => setImageModalVisible(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.photoModalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Bank Account Modal */}
      <Modal
        visible={bankModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bankModalOverlay}
          activeOpacity={1}
          onPress={() => setBankModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.bankModalCard}>
              <Text style={styles.bankModalTitle}>Payment Account</Text>
              {event?.bankName && (
                <Text style={styles.bankModalBankName}>{event.bankName}</Text>
              )}
              {event?.accountHolderName && (
                <Text style={styles.bankModalHolder}>{event.accountHolderName}</Text>
              )}
              {event?.bankAccountNumber && (
                <TouchableOpacity style={styles.bankModalAccountRow} onPress={handleCopyAccount}>
                  <Text style={styles.bankModalAccountNumber}>{event.bankAccountNumber}</Text>
                  <Text style={styles.bankModalCopyLabel}>{accountCopied ? 'Copied!' : 'Copy'}</Text>
                </TouchableOpacity>
              )}
              {event?.prepaidAmount && (
                <Text style={styles.bankModalAmount}>
                  {event.prepaidAmount.toLocaleString('en-US')} KRW
                </Text>
              )}
              <TouchableOpacity style={styles.bankModalTossButton} onPress={handleOpenToss}>
                <Text style={styles.bankModalTossText}>Open Toss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bankModalDoneButton} onPress={() => setBankModalVisible(false)}>
                <Text style={styles.bankModalDoneText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      </BottomSheetModal>
    );
  }
);

EventDetailBottomSheet.displayName = 'EventDetailBottomSheet';

export default EventDetailBottomSheet;

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.white,
  },
  handleContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.white,
  },

  // Image Section
  imageSection: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
    backgroundColor: colors.gray50,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.gray500,
  },
  badgesRow: {
    position: 'absolute',
    top: 11,
    left: screenPadding.horizontal + 9,
    right: screenPadding.horizontal + 9,
    flexDirection: 'row',
    gap: 5,
  },
  officialBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 9,
    height: 21,
    borderRadius: 64,
    justifyContent: 'center',
    ...shadows.md,
  },
  freeBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 17,
    height: 21,
    borderRadius: 64,
    justifyContent: 'center',
  },
  prepaidBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 12,
    height: 21,
    borderRadius: 64,
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.white,
  },
  changeNoticeBadge: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'rgba(255, 56, 60, 0.5)',
    paddingLeft: 3,
    paddingRight: 3,
    height: 16,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeNoticeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FF3838',
  },
  changeNoticeTooltip: {
    position: 'absolute',
    top: 34,
    right: screenPadding.horizontal,
    width: 172,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    ...shadows.md,
  },
  tooltipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.gray500,
    textAlign: 'center',
  },

  // Content Section
  contentSection: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 24,
    paddingHorizontal: screenPadding.horizontal,
  },

  // Title Section
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.black,
  },
  titleDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.gray300,
    marginHorizontal: 12,
  },
  eventDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.gray600,
  },

  // Register Button
  registerButton: {
    backgroundColor: '#03CA5B',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    marginBottom: 8,
  },
  registerButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonWithCountdown: {
    height: 50,
    paddingVertical: 8,
  },
  registerButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.white,
    letterSpacing: -0.2,
  },
  countdownText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.white,
    marginTop: 2,
  },
  cancelLinkContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  cancelLinkText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.error,
    textDecorationLine: 'underline',
  },

  // Period and Cost
  periodCostSection: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  periodText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 18,
  },
  periodBold: {
    fontFamily: 'Inter-SemiBold',
  },
  costText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.success,
  },
  costFree: {
    fontFamily: 'Inter-SemiBold',
  },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    padding: 16,
    marginBottom: 16,
    ...shadows.lg,
  },
  cardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: colors.black,
    marginBottom: 12,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressMapThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 5,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.black,
  },
  findWayButton: {
    height: 36,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findWayText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.black,
  },
  descriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  viewMoreButton: {
    height: 36,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.black,
  },

  // Details Section
  detailsSection: {
    paddingTop: 8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  detailLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.gray500,
    letterSpacing: 0.3,
    flex: 1,
  },
  detailValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.black,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 8,
  },
  detailValueBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.black,
  },
  detailValueGreen: {
    color: colors.success,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray100,
  },
  officialBadgeSmall: {
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
  },
  freeBadgeSmall: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
  },
  badgeTextSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: colors.white,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerLogo: {
    width: 17,
    height: 17,
    borderRadius: 2.5,
    borderWidth: 0.1,
    borderColor: colors.black,
  },
  posterAvatar: {
    width: 14.5,
    height: 14.5,
    borderRadius: 7.25,
  },

  // Photo Modal
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },

  // Bank Modal
  bankModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bankModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: 300,
    gap: 6,
  },
  bankModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  bankModalBankName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1C1C1E',
  },
  bankModalHolder: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  bankModalAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bankModalAccountNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1C1C1E',
    letterSpacing: 0.5,
  },
  bankModalCopyLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#3B82F6',
  },
  bankModalAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#000000',
    marginTop: 4,
  },
  bankModalTossButton: {
    marginTop: 12,
    backgroundColor: '#3182F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  bankModalTossText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bankModalDoneButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  bankModalDoneText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
});
