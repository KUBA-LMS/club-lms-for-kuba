import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, font } from '../../constants';
import { SearchIcon } from '../icons';
import Avatar from '../common/Avatar';
import { resolveImageUrl } from '../../utils/image';
import { SearchNonMember } from '../../services/adminHub';

interface MemberSearchSectionProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchLoading: boolean;
  searchResults: SearchNonMember[];
  onAddMember: (userId: string) => void;
}

export default function MemberSearchSection({
  searchQuery,
  onSearchChange,
  searchLoading,
  searchResults,
  onAddMember,
}: MemberSearchSectionProps) {
  return (
    <>
      <View style={styles.searchInputContainer}>
        <SearchIcon size={18} color={colors.gray500} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Enter Username or Legal name"
          placeholderTextColor={colors.gray300}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {searchLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      ) : (
        searchResults.map((user) => (
          <View key={user.id} style={styles.searchResultCard}>
            <View style={styles.searchResultRow}>
              <Avatar
                uri={user.profile_image}
                size={44}
                name={user.username}
              />
              <View style={styles.searchInfo}>
                <Text style={styles.searchUsername}>{user.username}</Text>
                {user.legal_name && (
                  <Text style={styles.searchLegalName}>LEGAL NAME: {user.legal_name}</Text>
                )}
                {user.common_groups.length > 0 && (
                  <View style={styles.commonGroupsRow}>
                    <Text style={styles.commonGroupsLabel}>Groups in common:</Text>
                    <View style={styles.commonGroupLogos}>
                      {user.common_groups.map((g) =>
                        g.logo_image ? (
                          <Image
                            key={g.id}
                            source={{ uri: resolveImageUrl(g.logo_image)! }}
                            style={styles.commonGroupLogo}
                          />
                        ) : (
                          <View key={g.id} style={[styles.commonGroupLogo, styles.commonGroupLogoPlaceholder]}>
                            <Text style={styles.commonGroupLogoText}>{g.name.charAt(0)}</Text>
                          </View>
                        ),
                      )}
                    </View>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onAddMember(user.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Add +</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 15,
    color: '#1C1C1E',
    padding: 0,
  },
  searchResultCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchUsername: {
    fontFamily: font.bold,
    fontSize: 16,
    color: '#1C1C1E',
  },
  searchLegalName: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  commonGroupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  commonGroupsLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
  },
  commonGroupLogos: {
    flexDirection: 'row',
    gap: 4,
  },
  commonGroupLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray100,
  },
  commonGroupLogoPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commonGroupLogoText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.gray500,
  },
  addButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: colors.white,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
