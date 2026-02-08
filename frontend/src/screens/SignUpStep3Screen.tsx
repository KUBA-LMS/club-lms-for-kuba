import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, layout, screenPadding } from '../constants';

// Progress Bar component
function ProgressBar({ progress, totalSteps }: { progress: number; totalSteps: number }) {
  const percentage = (progress / totalSteps) * 100;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.bar}>
        <View style={[progressStyles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    width: 250,
    height: 8,
  },
  bar: {
    flex: 1,
    backgroundColor: '#e6dfd4',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#00c0e8',
    borderRadius: 8,
  },
});

// Picker Modal component
interface PickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onDone: () => void;
}

function PickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onDone,
}: PickerModalProps) {
  const insets = useSafeAreaInsets();
  const selectedIndex = options.indexOf(selectedValue);

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = item === selectedValue;
    const distance = Math.abs(index - selectedIndex);

    let fontSize = 15;
    let opacity = 0.5;
    if (isSelected) {
      fontSize = 20;
      opacity = 1;
    } else if (distance === 1) {
      fontSize = 15;
      opacity = 0.7;
    }

    return (
      <TouchableOpacity
        style={pickerStyles.option}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            pickerStyles.optionText,
            { fontSize, opacity },
            isSelected && pickerStyles.selectedText,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDone}
    >
      <View style={pickerStyles.overlay}>
        <TouchableOpacity style={pickerStyles.backdrop} onPress={onDone} />
        <View style={[pickerStyles.container, { paddingBottom: insets.bottom + 20 }]}>
          {/* Done Button */}
          <View style={pickerStyles.header}>
            <TouchableOpacity style={pickerStyles.doneButton} onPress={onDone}>
              <Text style={pickerStyles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={pickerStyles.listContainer}>
            {/* Separator lines */}
            <View style={pickerStyles.separatorTop} />
            <View style={pickerStyles.separatorBottom} />

            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={pickerStyles.listContent}
              initialScrollIndex={selectedIndex > 0 ? selectedIndex : 0}
              getItemLayout={(_, index) => ({
                length: 40,
                offset: 40 * index,
                index,
              })}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#f2f2f2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  doneButton: {
    backgroundColor: '#0088ff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
  },
  listContainer: {
    height: 200,
    position: 'relative',
  },
  separatorTop: {
    position: 'absolute',
    top: 80,
    left: 80,
    right: 80,
    height: 1,
    backgroundColor: '#c5c5c5',
    zIndex: 1,
  },
  separatorBottom: {
    position: 'absolute',
    top: 120,
    left: 80,
    right: 80,
    height: 1,
    backgroundColor: '#c5c5c5',
    zIndex: 1,
  },
  listContent: {
    paddingVertical: 60,
  },
  option: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
  },
  selectedText: {
    fontWeight: '500',
  },
});

// Nationality options
const NATIONALITIES = [
  'South Korea',
  'United States',
  'China',
  'Japan',
  'Singapore',
  'Vietnam',
  'Thailand',
  'Indonesia',
  'Malaysia',
  'Philippines',
  'India',
  'Germany',
  'France',
  'United Kingdom',
  'Canada',
  'Australia',
  'Other',
];

// Gender options
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

type SignUpStep3NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep3'>;
type SignUpStep3RouteProp = RouteProp<AuthStackParamList, 'SignUpStep3'>;

export default function SignUpStep3Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep3NavigationProp>();
  const route = useRoute<SignUpStep3RouteProp>();
  const { username, name, profileImage } = route.params;

  const [studentId, setStudentId] = useState('');
  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');
  const [focusedField, setFocusedField] = useState<'studentId' | 'nationality' | 'gender' | null>(null);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Responsive scaling
  const baseWidth = 402;
  const scale = Math.min(width / baseWidth, 1.2);
  const inputWidth = Math.min(313 * scale, width - 80);

  // Validate student ID (10 digits for KU student ID)
  const isStudentIdValid = /^\d{10}$/.test(studentId);
  const isFormValid = isStudentIdValid && nationality !== '' && gender !== '';

  const handleNext = () => {
    if (isFormValid) {
      navigation.navigate('SignUpStep4', {
        username,
        name,
        profileImage,
        studentId,
        nationality,
        gender,
      });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartOver = () => {
    navigation.navigate('Login');
  };

  const handleNationalityPress = () => {
    setFocusedField('nationality');
    setShowNationalityPicker(true);
  };

  const handleGenderPress = () => {
    setFocusedField('gender');
    setShowGenderPicker(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { width: inputWidth + 40 }]}>
          {/* Back Button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <ProgressBar progress={3} totalSteps={5} />
            <Text style={styles.stepText}>Create Account{'\n'}3/5</Text>
          </View>

          {/* Start Over Button */}
          <TouchableOpacity onPress={handleStartOver} style={styles.startOverButton}>
            <Text style={styles.startOverIcon}>↺</Text>
            <Text style={styles.startOverText}>start{'\n'}over</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontSize: Math.max(24, 30 * scale) }]}>
            CLUB.{'\n'}LMS
          </Text>
        </View>

        {/* Content Section */}
        <View style={[styles.contentContainer, { width: inputWidth }]}>
          {/* Heading */}
          <Text style={[styles.heading, { fontSize: Math.max(24, 30 * scale) }]}>
            Fill out basic info
          </Text>

          {/* Help Link */}
          <View style={styles.helpRow}>
            <Text style={styles.helpText}>Help?   </Text>
            <TouchableOpacity onPress={() => { /* TODO: Open user guide */ }}>
              <Text style={styles.guideLink}>Read user guide</Text>
            </TouchableOpacity>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {/* Student ID Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputField,
                  focusedField === 'studentId' && styles.inputFieldFocused,
                ]}
              >
                {(focusedField === 'studentId' || studentId) && (
                  <Text style={styles.inputLabel}>Enter student ID(KU)</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    (focusedField === 'studentId' || studentId) && styles.inputWithLabel,
                  ]}
                  placeholder={focusedField === 'studentId' || studentId ? '' : 'Enter student ID(KU)'}
                  placeholderTextColor="#1e1e1e"
                  value={studentId}
                  onChangeText={setStudentId}
                  onFocus={() => setFocusedField('studentId')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Nationality Picker */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={[
                  styles.inputField,
                  focusedField === 'nationality' && styles.inputFieldFocused,
                ]}
                onPress={handleNationalityPress}
                activeOpacity={0.7}
              >
                {nationality ? (
                  <>
                    <Text style={styles.inputLabel}>Select Nationality</Text>
                    <Text style={[styles.input, styles.inputWithLabel, styles.pickerValue]}>
                      {nationality}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.placeholderText}>Select Nationality</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Gender Picker */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={[
                  styles.inputField,
                  focusedField === 'gender' && styles.inputFieldFocused,
                ]}
                onPress={handleGenderPress}
                activeOpacity={0.7}
              >
                {gender ? (
                  <>
                    <Text style={styles.inputLabel}>Select Gender</Text>
                    <Text style={[styles.input, styles.inputWithLabel, styles.pickerValue]}>
                      {gender}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.placeholderText}>Select Gender</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              isFormValid ? styles.nextButtonActive : styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={!isFormValid}
          >
            <Text style={[
              styles.nextButtonText,
              isFormValid ? styles.nextButtonTextActive : styles.nextButtonTextDisabled,
            ]}>
              Next  →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Nationality Picker Modal */}
      <PickerModal
        visible={showNationalityPicker}
        title="Select Nationality"
        options={NATIONALITIES}
        selectedValue={nationality || NATIONALITIES[0]}
        onSelect={(value) => setNationality(value)}
        onDone={() => {
          if (!nationality) setNationality(NATIONALITIES[0]);
          setShowNationalityPicker(false);
          setFocusedField(null);
        }}
      />

      {/* Gender Picker Modal */}
      <PickerModal
        visible={showGenderPicker}
        title="Select Gender"
        options={GENDERS}
        selectedValue={gender || GENDERS[0]}
        onSelect={(value) => setGender(value)}
        onDone={() => {
          if (!gender) setGender(GENDERS[0]);
          setShowGenderPicker(false);
          setFocusedField(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: screenPadding.horizontal,
  },
  backButton: {
    padding: spacing.sm,
  },
  backArrow: {
    fontSize: 24,
    color: colors.black,
    fontWeight: '300',
  },
  progressSection: {
    alignItems: 'center',
    flex: 1,
  },
  stepText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 10,
    color: colors.black,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  startOverButton: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  startOverIcon: {
    fontSize: 20,
    color: colors.black,
  },
  startOverText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 8,
    color: colors.black,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg + spacing.sm,
  },
  title: {
    fontFamily: Platform.select({
      ios: 'PorterSansBlock',
      android: 'porter-sans-inline-block',
      default: 'System',
    }),
    color: colors.black,
    textAlign: 'center',
    lineHeight: 36,
  },
  contentContainer: {
    alignItems: 'flex-start',
  },
  heading: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Bold',
      android: 'OpenSans-Bold',
      default: 'System',
    }),
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  helpText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 12,
    color: colors.black,
  },
  guideLink: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Bold',
      android: 'OpenSans-Bold',
      default: 'System',
    }),
    fontSize: 12,
    fontWeight: '700',
    color: colors.status.requested,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    gap: spacing.sm + spacing.xxs,
    width: '100%',
    marginBottom: screenPadding.horizontal,
  },
  inputWrapper: {
    marginTop: spacing.sm + spacing.xxs,
  },
  inputField: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: layout.borderRadius.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  inputFieldFocused: {
    borderColor: colors.black,
  },
  inputLabel: {
    position: 'absolute',
    top: 6,
    left: spacing.md,
    fontSize: 10,
    color: colors.gray900,
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
  },
  inputWithLabel: {
    paddingTop: spacing.sm + spacing.xxs,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.gray900,
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
  },
  pickerValue: {
    paddingTop: spacing.sm + spacing.xxs,
  },
  nextButton: {
    height: 40,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing.sm + spacing.xxs,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  nextButtonActive: {
    backgroundColor: colors.success,
  },
  nextButtonText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 16,
  },
  nextButtonTextDisabled: {
    color: colors.white,
  },
  nextButtonTextActive: {
    color: colors.white,
  },
});
