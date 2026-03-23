import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';
import { MainStackParamList } from '../../navigation/types';
import { ArrowBackIcon } from '../../components/icons';
import * as userApi from '../../services/user';
import { colors } from '../../constants/colors';
import { font } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const KOREAN_BANKS = [
  'KB Kookmin', 'Shinhan', 'Woori', 'Hana', 'NH NongHyup',
  'KakaoBank', 'Toss Bank', 'SC First', 'IBK Industrial',
  'MG Saemaul', 'Suhyup', 'Daegu', 'Busan', 'Gyeongnam',
  'Gwangju', 'Jeonbuk', 'Jeju', 'Post Office', 'Shinhyup', 'Citi',
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();

  const [notifEvents, setNotifEvents] = useState(true);
  const [notifChat, setNotifChat] = useState(true);

  // Bank account state
  const [bankAccount, setBankAccount] = useState<userApi.BankAccountResponse | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [bankSaving, setBankSaving] = useState(false);

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    userApi.getBankAccount()
      .then(setBankAccount)
      .catch(() => {})
      .finally(() => setBankLoading(false));
  }, []);

  const handleOpenBankModal = useCallback(() => {
    setSelectedBank(bankAccount?.bank_name || '');
    setAccountNumber(bankAccount?.bank_account_number || '');
    setHolderName(bankAccount?.account_holder_name || '');
    setShowBankModal(true);
  }, [bankAccount]);

  const handleSaveBankAccount = useCallback(async () => {
    if (!selectedBank || !accountNumber.trim() || !holderName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setBankSaving(true);
    try {
      const updated = await userApi.updateBankAccount({
        bank_name: selectedBank,
        bank_account_number: accountNumber.trim(),
        account_holder_name: holderName.trim(),
      });
      setBankAccount(updated);
      setShowBankModal(false);
    } catch {
      Alert.alert('Error', 'Failed to save bank account');
    } finally {
      setBankSaving(false);
    }
  }, [selectedBank, accountNumber, holderName]);

  const handleDeleteBankAccount = useCallback(() => {
    Alert.alert('Delete Account', 'Remove your bank account info?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.deleteBankAccount();
            setBankAccount({ bank_name: null, bank_account_number: null, account_holder_name: null });
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setPasswordSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be removed. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await authService.deleteAccount();
                      await logout();
                    } catch {
                      Alert.alert('Error', 'Failed to delete account');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [logout]);

  const handleLogout = useCallback(() => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) doLogout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  }, [logout]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.groupLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>Event Updates</Text>
            <Switch
              value={notifEvents}
              onValueChange={setNotifEvents}
              trackColor={{ false: colors.gray100, true: colors.success }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowText}>Chat Messages</Text>
            <Switch
              value={notifChat}
              onValueChange={setNotifChat}
              trackColor={{ false: colors.gray100, true: colors.success }}
            />
          </View>
        </View>

        <Text style={styles.groupLabel}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.rowText}>Edit Profile</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => setShowPasswordModal(true)}>
            <Text style={styles.rowText}>Change Password</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>Settlement Account</Text>
        <View style={styles.card}>
          {bankLoading ? (
            <View style={styles.row}>
              <ActivityIndicator size="small" color={colors.gray500} />
            </View>
          ) : bankAccount?.bank_name ? (
            <>
              <TouchableOpacity style={styles.row} onPress={handleOpenBankModal}>
                <View>
                  <Text style={styles.rowText}>{bankAccount.bank_name}</Text>
                  <Text style={styles.bankDetail}>
                    {bankAccount.bank_account_number} ({bankAccount.account_holder_name})
                  </Text>
                </View>
                <Text style={styles.arrow}>{'>'}</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row} onPress={handleDeleteBankAccount}>
                <Text style={[styles.rowText, { color: colors.error }]}>Remove Account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.row} onPress={handleOpenBankModal}>
              <Text style={styles.rowText}>Register Bank Account</Text>
              <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.groupLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>App Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://robust-haumea-616.notion.site/Terms-of-Service-32c78b1d4e7780b1af86e186f61ccde4')}>
            <Text style={styles.rowText}>Terms of Service</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://robust-haumea-616.notion.site/Privacy-Policy-32c78b1d4e7780e6910ae55ba43b39dd')}>
            <Text style={styles.rowText}>Privacy Policy</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bank account modal */}
      <Modal visible={showBankModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>
              {bankAccount?.bank_name ? 'Edit Bank Account' : 'Register Bank Account'}
            </Text>

            <Text style={styles.inputLabel}>Bank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankPicker}>
              {KOREAN_BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[
                    styles.bankChip,
                    selectedBank === bank && styles.bankChipSelected,
                  ]}
                  onPress={() => setSelectedBank(bank)}
                >
                  <Text
                    style={[
                      styles.bankChipText,
                      selectedBank === bank && styles.bankChipTextSelected,
                    ]}
                  >
                    {bank}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account number"
              placeholderTextColor={colors.gray400}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter holder name"
              placeholderTextColor={colors.gray400}
              value={holderName}
              onChangeText={setHolderName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBankModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveBankAccount}
                disabled={bankSaving}
              >
                {bankSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change password modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor={colors.gray400}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 8 characters"
              placeholderTextColor={colors.gray400}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.gray400}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleChangePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Change</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: '#1C1C1E',
  },
  headerDivider: {
    height: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  groupLabel: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 28,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowText: {
    fontFamily: font.regular,
    fontSize: 16,
    color: '#1C1C1E',
  },
  rowValue: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.gray500,
  },
  arrow: {
    fontFamily: font.regular,
    fontSize: 18,
    color: colors.gray300,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray50,
    marginLeft: 18,
  },
  logoutBtn: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  logoutText: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.white,
  },
  bankDetail: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontFamily: font.semibold,
    fontSize: 18,
    color: colors.black,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.gray500,
    marginBottom: 6,
    marginTop: 12,
  },
  bankPicker: {
    flexDirection: 'row',
    maxHeight: 40,
    marginBottom: 4,
  },
  bankChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    marginRight: 8,
  },
  bankChipSelected: {
    backgroundColor: colors.primary,
  },
  bankChipText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.black,
  },
  bankChipTextSelected: {
    color: colors.white,
    fontFamily: font.semibold,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.black,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.black,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.white,
  },
  deleteAccountBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteAccountText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray500,
    textDecorationLine: 'underline',
  },
});
