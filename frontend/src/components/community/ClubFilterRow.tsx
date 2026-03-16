import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ArrowBackIcon } from '../icons';
import { ClubItem } from '../../hooks/useMyClubs';
import { SubgroupBrief } from '../../services/clubs';
import { resolveImageUrl } from '../../utils/image';

interface ClubFilterRowProps {
  clubs: ClubItem[];
  selectedClubId: string | null;
  selectedSubgroupId: string | null;
  onSelectClub: (clubId: string | null) => void;
  onSelectSubgroup: (subgroupId: string | null) => void;
}

export default function ClubFilterRow({
  clubs,
  selectedClubId,
  selectedSubgroupId,
  onSelectClub,
  onSelectSubgroup,
}: ClubFilterRowProps) {
  const selectedClub = selectedClubId
    ? clubs.find((c) => c.id === selectedClubId) || null
    : null;

  // State 1: No club selected - show all clubs
  if (!selectedClub) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {clubs.map((club) => (
            <TouchableOpacity
              key={club.id}
              style={styles.clubItem}
              onPress={() => onSelectClub(club.id)}
              activeOpacity={0.7}
            >
              <View style={styles.clubImageWrapper}>
                {club.logo_image ? (
                  <Image source={{ uri: resolveImageUrl(club.logo_image) }} style={styles.clubImage} />
                ) : (
                  <View style={[styles.clubImage, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderText}>
                      {club.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.clubLabel} numberOfLines={1}>
                {club.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // State 2 & 3: Club selected - show fixed club icon + scrollable subgroups
  const subgroups = selectedClub.subgroups || [];

  return (
    <View style={styles.container}>
      <View style={styles.selectedRow}>
        {/* Back arrow */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            onSelectSubgroup(null);
            onSelectClub(null);
          }}
          activeOpacity={0.6}
        >
          <ArrowBackIcon size={20} color="#000000" />
        </TouchableOpacity>

        {/* Fixed selected club icon */}
        <TouchableOpacity
          style={styles.fixedClubItem}
          onPress={() => {
            if (selectedSubgroupId) {
              onSelectSubgroup(null);
            }
          }}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.clubImageWrapper,
              !selectedSubgroupId && styles.clubImageWrapperSelected,
            ]}
          >
            {selectedClub.logo_image ? (
              <Image source={{ uri: resolveImageUrl(selectedClub.logo_image) }} style={styles.clubImage} />
            ) : (
              <View style={[styles.clubImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>
                  {selectedClub.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.clubLabel, !selectedSubgroupId && styles.clubLabelSelected]}
            numberOfLines={1}
          >
            {selectedClub.name}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        {subgroups.length > 0 && <View style={styles.divider} />}

        {/* Scrollable subgroups */}
        {subgroups.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subgroupScroll}
            style={styles.subgroupScrollContainer}
          >
            {subgroups.map((sg: SubgroupBrief) => {
              const isSelected = sg.id === selectedSubgroupId;
              return (
                <TouchableOpacity
                  key={sg.id}
                  style={styles.subgroupItem}
                  onPress={() => onSelectSubgroup(isSelected ? null : sg.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.subgroupImageWrapper,
                      isSelected && styles.subgroupImageWrapperSelected,
                    ]}
                  >
                    {sg.logo_image ? (
                      <Image source={{ uri: resolveImageUrl(sg.logo_image) }} style={styles.subgroupImage} />
                    ) : (
                      <View style={[styles.subgroupImage, styles.imagePlaceholder]}>
                        <Text style={styles.subPlaceholderText}>
                          {sg.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.subgroupLabel, isSelected && styles.subgroupLabelSelected]}
                    numberOfLines={1}
                  >
                    {sg.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 75,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  clubItem: {
    alignItems: 'center',
    width: 60,
  },
  clubImageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  clubImageWrapperSelected: {
    borderWidth: 2,
    borderColor: '#00C0E8',
  },
  clubImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#8E8E93',
  },
  subPlaceholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#8E8E93',
  },
  clubLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: -0.08,
  },
  clubLabelSelected: {
    fontFamily: 'Inter-SemiBold',
  },
  // State 2 & 3: selected row layout
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    height: 75,
  },
  backButton: {
    width: 28,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedClubItem: {
    alignItems: 'center',
    width: 60,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 4,
  },
  subgroupScrollContainer: {
    flex: 1,
  },
  subgroupScroll: {
    alignItems: 'flex-start',
    gap: 10,
    paddingRight: 16,
  },
  subgroupItem: {
    alignItems: 'center',
    width: 44,
  },
  subgroupImageWrapper: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 0.7,
    borderColor: '#000000',
    overflow: 'hidden',
    marginTop: 10,
  },
  subgroupImageWrapperSelected: {
    borderWidth: 2,
    borderColor: '#00C0E8',
  },
  subgroupImage: {
    width: '100%',
    height: '100%',
  },
  subgroupLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: -0.08,
  },
  subgroupLabelSelected: {
    fontFamily: 'Inter-SemiBold',
  },
});
