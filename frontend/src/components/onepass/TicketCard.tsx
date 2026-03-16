import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

interface TicketCardProps {
  imageUri?: string;
  width: number;
  height: number;
}

export default function TicketCard({ imageUri, width, height }: TicketCardProps) {
  return (
    <View style={[styles.outerShadow, { width, height }]}>
      <View style={[styles.card, { width, height }]}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderShine} />
          </View>
        )}
        {/* Subtle top-left light sheen */}
        <View style={styles.sheen} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShadow: {
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1C',
  },
  placeholderShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '30%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomRightRadius: 60,
  },
});
