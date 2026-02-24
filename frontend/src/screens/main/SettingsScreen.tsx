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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { ArrowBackIcon } from '../../components/icons';
import * as userApi from '../../services/user';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const KOREAN_BANKS = [
  'KB국민', '신한', '우리', '하나', 'NH농협',
  '카카오뱅크', '토스뱅크', 'SC제일', 'IBK기업',
  '새마을금고', '수협', '대구', '부산', '경남',
  '광주', '전북', '제주', '우체국', '신협', '씨티',
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
          <ArrowBackIcon size={24} color="#000" />
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
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowText}>Chat Messages</Text>
            <Switch
              value={notifChat}
              onValueChange={setNotifChat}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
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
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Change Password</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>Settlement Account</Text>
        <View style={styles.card}>
          {bankLoading ? (
            <View style={styles.row}>
              <ActivityIndicator size="small" color="#8E8E93" />
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
                <Text style={[styles.rowText, { color: '#FF3B30' }]}>Remove Account</Text>
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
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Terms of Service</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Privacy Policy</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bank account modal */}
      <Modal visible={showBankModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
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
              placeholderTextColor="#AEAEB2"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter holder name"
              placeholderTextColor="#AEAEB2"
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#FFFFFF',
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 17,
    color: '#000000',
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C5C5C5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  groupLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#000000',
  },
  rowValue: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#8E8E93',
  },
  arrow: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
    fontSize: 18,
    color: '#C5C5C5',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 16,
  },
  logoutBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  bankDetail: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
    color: '#8E8E93',
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
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  bankChipSelected: {
    backgroundColor: '#007AFF',
  },
  bankChipText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#000000',
  },
  bankChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'OpenSans-Bold',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#000000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#000000',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
