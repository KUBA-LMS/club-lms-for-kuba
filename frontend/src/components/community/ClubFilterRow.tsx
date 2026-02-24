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

export interface ClubItem {
  id: string;
  name: string;
  imageUri: string;
  subgroups?: ClubItem[];
}

interface ClubFilterRowProps {
  clubs: ClubItem[];
  selectedId: string | null;
  onSelect: (club: ClubItem) => void;
  onBack?: () => void;
  showBack?: boolean;
}

export default function ClubFilterRow({
  clubs,
  selectedId,
  onSelect,
  onBack,
  showBack,
}: ClubFilterRowProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.6}
          >
            <ArrowBackIcon size={22} color="#000000" />
          </TouchableOpacity>
        )}
        {clubs.map((club) => {
          const isSelected = club.id === selectedId;
          const isSubgroup = !club.subgroups;
          return (
            <TouchableOpacity
              key={club.id}
              style={styles.clubItem}
              onPress={() => onSelect(club)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  isSubgroup ? styles.subgroupImageWrapper : styles.imageWrapper,
                  isSelected && styles.imageWrapperSelected,
                ]}
              >
                <Image
                  source={{ uri: club.imageUri }}
                  style={isSubgroup ? styles.subgroupImage : styles.image}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                ]}
                numberOfLines={1}
              >
                {club.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  backButton: {
    width: 30,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  clubItem: {
    alignItems: 'center',
    width: 60,
  },
  imageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  subgroupImageWrapper: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 0.7,
    borderColor: '#000000',
    overflow: 'hidden',
    marginVertical: 10,
  },
  imageWrapperSelected: {
    borderWidth: 2,
    borderColor: '#00C0E8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  subgroupImage: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: -0.08,
  },
  labelSelected: {
    fontFamily: 'OpenSans-Bold',
  },
});
