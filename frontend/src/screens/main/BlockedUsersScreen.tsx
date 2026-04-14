import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import moderation, { BlockedUser } from '../../services/moderation';
import { colors, font } from '../../constants';
import { ArrowBackIcon } from '../../components/icons';

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);

  const load = useCallback(async () => {
    const list = await moderation.getBlockedUsers();
    setBlocked(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = useCallback(
    (user: BlockedUser) => {
      Alert.alert(
        'Unblock user',
        `Unblock ${user.username}? You will start seeing their messages again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            style: 'destructive',
            onPress: async () => {
              const updated = await moderation.unblockUser(user.userId);
              setBlocked(updated);
            },
          },
        ],
      );
    },
    [],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.headerSide} />
      </View>

      {blocked === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gray500} />
        </View>
      ) : blocked.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptyBody}>
            When you block someone from a chat, they appear here. You can unblock them at any time.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {blocked.map((user) => (
            <View key={user.userId} style={styles.row}>
              <View style={styles.rowTextBox}>
                <Text style={styles.rowName}>{user.username}</Text>
                <Text style={styles.rowDate}>
                  Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(user)}>
                <Text style={styles.unblockText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
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
  headerSide: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.semibold, fontSize: 17, color: '#1C1C1E' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.black, marginBottom: 8 },
  emptyBody: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 21,
  },
  scroll: { paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray50,
  },
  rowTextBox: { flex: 1 },
  rowName: { fontFamily: font.semibold, fontSize: 15, color: colors.black },
  rowDate: { fontFamily: font.regular, fontSize: 12, color: colors.gray500, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.gray50,
  },
  unblockText: { fontFamily: font.semibold, fontSize: 13, color: colors.black },
});
