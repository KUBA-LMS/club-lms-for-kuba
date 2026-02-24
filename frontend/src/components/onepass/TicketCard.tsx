import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

interface TicketCardProps {
  imageUri?: string;
  width: number;
  height: number;
}

export default function TicketCard({ imageUri, width, height }: TicketCardProps) {
  return (
    <View style={[styles.card, { width, height }]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#C5C5C5',
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
});
