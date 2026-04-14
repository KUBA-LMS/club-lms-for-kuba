import React, { useState } from 'react';
import {
  View,
  Text,
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
import { colors, font } from '../constants';
import { CheckIcon } from '../components/icons';
import SignUpHeader from '../components/auth/SignUpHeader';
import AnimatedButton from '../components/auth/AnimatedButton';
import HelpLink from '../components/auth/HelpLink';

interface PickerModalProps {
  visible: boolean;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onDone: () => void;
}

function PickerModal({ visible, options, selectedValue, onSelect, onDone }: PickerModalProps) {
  const insets = useSafeAreaInsets();
  const selectedIndex = Math.max(0, options.indexOf(selectedValue));

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = item === selectedValue;
    const distance = Math.abs(index - selectedIndex);

    let fontSize = 15;
    let opacity = 0.5;
    if (isSelected) {
      fontSize = 20;
      opacity = 1;
    } else if (distance === 1) {
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <View style={pickerStyles.overlay}>
        <TouchableOpacity style={pickerStyles.backdrop} onPress={onDone} />
        <View style={[pickerStyles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={pickerStyles.header}>
            <TouchableOpacity style={pickerStyles.doneButton} onPress={onDone}>
              <Text style={pickerStyles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.listContainer}>
            <View style={pickerStyles.separatorTop} />
            <View style={pickerStyles.separatorBottom} />
            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={pickerStyles.listContent}
              initialScrollIndex={selectedIndex > 0 ? selectedIndex : 0}
              getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      default: 'System',
    }),
    letterSpacing: 0.2,
  },
  listContainer: { height: 220, position: 'relative' },
  separatorTop: {
    position: 'absolute',
    top: 88,
    left: 60,
    right: 60,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    zIndex: 1,
  },
  separatorBottom: {
    position: 'absolute',
    top: 132,
    left: 60,
    right: 60,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    zIndex: 1,
  },
  listContent: { paddingVertical: 88 },
  option: { height: 44, justifyContent: 'center', alignItems: 'center' },
  optionText: {
    color: '#0A0A0A',
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    letterSpacing: 0.1,
  },
  selectedText: {
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      default: 'System',
    }),
  },
});

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

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

type SignUpStep3NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep3'>;
type SignUpStep3RouteProp = RouteProp<AuthStackParamList, 'SignUpStep3'>;

export default function SignUpStep3Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep3NavigationProp>();
  const route = useRoute<SignUpStep3RouteProp>();
  const { username, name, email, profileImage } = route.params;

  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');
  const [focusedField, setFocusedField] = useState<'nationality' | 'gender' | null>(null);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const contentWidth = Math.min(354, width - 48);

  const isFormValid = nationality !== '';

  const handleNext = () => {
    if (isFormValid) {
      navigation.navigate('SignUpStep4', {
        username,
        name,
        email,
        profileImage,
        nationality,
        gender: gender || undefined,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SignUpHeader step={3} totalSteps={5} width={contentWidth} />

        <View style={[styles.body, { width: contentWidth }]}>
          <Text style={styles.heading}>Fill out basic info.</Text>

          {/* Nationality */}
          <View style={styles.field}>
            <TouchableOpacity
              style={[
                styles.inputField,
                focusedField === 'nationality' && styles.inputFieldActive,
              ]}
              onPress={() => {
                setFocusedField('nationality');
                setShowNationalityPicker(true);
              }}
              activeOpacity={0.7}
            >
              {nationality ? (
                <>
                  <Text style={styles.floatingLabel}>Nationality</Text>
                  <Text style={styles.valueText}>{nationality}</Text>
                </>
              ) : (
                <Text style={styles.placeholderText}>Select Nationality</Text>
              )}
              {nationality !== '' && (
                <View style={styles.trailingIcon}>
                  <CheckIcon size={18} color={colors.successDark} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Gender (optional) */}
          <View style={styles.field}>
            <TouchableOpacity
              style={[
                styles.inputField,
                focusedField === 'gender' && styles.inputFieldActive,
              ]}
              onPress={() => {
                setFocusedField('gender');
                setShowGenderPicker(true);
              }}
              activeOpacity={0.7}
            >
              {gender ? (
                <>
                  <Text style={styles.floatingLabel}>Gender (Optional)</Text>
                  <Text style={styles.valueText}>{gender}</Text>
                </>
              ) : (
                <Text style={styles.placeholderText}>Select Gender (Optional)</Text>
              )}
              {gender !== '' && (
                <View style={styles.trailingIcon}>
                  <CheckIcon size={18} color={colors.successDark} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <AnimatedButton
            style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid}
          >
            <Text style={[styles.nextButtonText, !isFormValid && styles.nextButtonTextDisabled]}>
              Next  →
            </Text>
          </AnimatedButton>

          <HelpLink context="step3" />
        </View>
      </ScrollView>

      <PickerModal
        visible={showNationalityPicker}
        options={NATIONALITIES}
        selectedValue={nationality || NATIONALITIES[0]}
        onSelect={(v) => setNationality(v)}
        onDone={() => {
          if (!nationality) setNationality(NATIONALITIES[0]);
          setShowNationalityPicker(false);
          setFocusedField(null);
        }}
      />

      <PickerModal
        visible={showGenderPicker}
        options={GENDERS}
        selectedValue={gender || GENDERS[0]}
        onSelect={(v) => setGender(v)}
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
  body: {
    alignItems: 'stretch',
    marginTop: 32,
  },
  heading: {
    fontFamily: Platform.select({
      ios: font.bold,
      android: font.bold,
      default: 'System',
    }),
    fontSize: 28,
    fontWeight: '700',
    color: colors.brandText,
    lineHeight: 36,
    marginBottom: 32,
  },
  field: {
    marginBottom: 14,
  },
  inputField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  inputFieldActive: {
    borderColor: colors.brandText,
  },
  floatingLabel: {
    position: 'absolute',
    top: 4,
    left: 16,
    fontSize: 10,
    color: colors.gray600,
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
  },
  valueText: {
    fontSize: 14,
    color: colors.brandText,
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    paddingTop: 6,
    paddingRight: 30,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.gray500,
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
  },
  trailingIcon: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    width: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  nextButtonDisabled: {
    backgroundColor: '#D4D4D4',
  },
  nextButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.brandText,
  },
  nextButtonTextDisabled: {
    color: colors.gray600,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  helpText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.brandText,
  },
  guideLink: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.brandText,
    textDecorationLine: 'underline',
  },
});
