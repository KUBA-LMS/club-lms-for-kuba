import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { ArrowBackIcon } from '../../components/icons';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();

  const [notifEvents, setNotifEvents] = useState(true);
  const [notifChat, setNotifChat] = useState(true);

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
});
