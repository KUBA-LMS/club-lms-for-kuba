import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

interface Club {
  id: string;
  name: string;
  logo_image: string | null;
}

interface ProviderSelectorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (clubId: string, clubName: string) => void;
  selectedClubId?: string;
}

export default function ProviderSelectorBottomSheet({
  visible,
  onClose,
  onSelect,
  selectedClubId,
}: ProviderSelectorBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'group' | 'individual'>('group');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && activeTab === 'group') {
      fetchClubs();
    }
  }, [visible, activeTab]);

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ data: Club[] }>('/clubs/');
      setClubs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
      // Use mock data if API fails
      setClubs([
        { id: '00000000-0000-0000-0000-000000000101', name: '45th_KUBA', logo_image: null },
        { id: '00000000-0000-0000-0000-000000000102', name: '45th_KUBA_Group_8', logo_image: null },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'group' && styles.tabActive]}
              onPress={() => setActiveTab('group')}
            >
              <Text style={[styles.tabText, activeTab === 'group' && styles.tabTextActive]}>
                Group
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'individual' && styles.tabActive]}
              onPress={() => setActiveTab('individual')}
            >
              <Text style={[styles.tabText, activeTab === 'individual' && styles.tabTextActive]}>
                Individual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : activeTab === 'group' ? (
              clubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubItem}
                  onPress={() => onSelect(club.id, club.name)}
                >
                  <View style={styles.clubAvatar}>
                    <Text style={styles.clubAvatarText}>
                      {club.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    {club.name.includes('_') && (
                      <TouchableOpacity>
                        <Text style={styles.viewSubgroups}>View Subgroups ^</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {selectedClubId === club.id && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>V</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Individual posting coming soon</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '70%',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    marginBottom: 12,
  },
  doneButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  doneButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  tabTextActive: {
    fontFamily: 'OpenSans-Bold',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  clubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clubAvatarText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#8E8E93',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#000000',
  },
  viewSubgroups: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
});
