import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { screenPadding } from '../../constants';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  }, [logout]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MY</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>My Registrations</Text>
            <Text style={styles.menuItemArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>My Tickets</Text>
            <Text style={styles.menuItemArrow}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Settings</Text>
            <Text style={styles.menuItemArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontFamily: 'PorterSansBlock',
    fontSize: 24,
    color: '#000000',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: screenPadding.horizontal,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 32,
    color: '#8E8E93',
  },
  username: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#000000',
    marginBottom: 4,
  },
  email: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  adminBadgeText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  menuSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#000000',
  },
  menuItemArrow: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
    fontSize: 18,
    color: '#8E8E93',
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
