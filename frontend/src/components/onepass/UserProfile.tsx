import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface UserProfileProps {
  name: string;
  profileImage?: string;
}

export default function UserProfile({ name, profileImage }: UserProfileProps) {
  const formattedName = name.toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
