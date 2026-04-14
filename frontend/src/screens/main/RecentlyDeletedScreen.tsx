import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getDeletedGroups,
  restoreGroup,
  DeletedClub,
} from '../../services/clubs';
import { colors, font } from '../../constants';
import { ArrowBackIcon } from '../../components/icons';
import { resolveImageUrl } from '../../utils/image';

function formatRemaining(restorableUntilIso: string): string {
  const ms = new Date(restorableUntilIso).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return 'Less than 1 hour left';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} left`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return `${days} day${days === 1 ? '' : 's'} ${rem}h left`;
}

export default function RecentlyDeletedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [items, setItems] = useState<DeletedClub[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDeletedGroups();
      setItems(data);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleRestore = useCallback(
    (club: DeletedClub) => {
      Alert.alert(
        'Restore club?',
        `Restore "${club.name}" so it becomes active again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            onPress: async () => {
              try {
                await restoreGroup(club.id);
                Alert.alert('Restored', `"${club.name}" has been restored.`);
                await load();
              } catch (err: any) {
                const msg = err?.response?.data?.detail || 'Failed to restore.';
                Alert.alert('Error', msg);
              }
            },
          },
        ],
      );
    },
    [load],
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
        <Text style={styles.headerTitle}>Recently Deleted</Text>
        <View style={styles.headerSide} />
      </View>

      {items === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gray500} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No deleted clubs</Text>
          <Text style={styles.emptyBody}>
            Clubs you delete appear here for 3 days. You can restore them from this screen within that window.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.helper}>
            Deleted clubs are restorable for 3 days. After that, they are permanently removed.
          </Text>
          {items.map((club) => (
            <View key={club.id} style={styles.row}>
              {club.logo_image ? (
                <Image
                  source={{ uri: resolveImageUrl(club.logo_image) }}
                  style={styles.logo}
                />
              ) : (
                <View style={[styles.logo, styles.logoPlaceholder]}>
                  <Text style={styles.logoText}>
                    {club.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.infoBox}>
                <Text style={styles.rowName}>{club.name}</Text>
                <Text style={styles.rowMeta}>
                  Deleted {new Date(club.deleted_at).toLocaleDateString()} · {formatRemaining(club.restorable_until)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={() => handleRestore(club)}
              >
                <Text style={styles.restoreText}>Restore</Text>
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
  scroll: { paddingVertical: 12 },
  helper: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.gray500,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray50,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 14,
  },
  logoPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.gray500,
  },
  infoBox: { flex: 1 },
  rowName: { fontFamily: font.semibold, fontSize: 15, color: colors.black },
  rowMeta: { fontFamily: font.regular, fontSize: 12, color: colors.gray500, marginTop: 2 },
  restoreBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.black,
  },
  restoreText: { fontFamily: font.semibold, fontSize: 13, color: colors.white },
});
