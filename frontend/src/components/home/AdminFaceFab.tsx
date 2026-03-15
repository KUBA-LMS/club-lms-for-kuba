import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';

interface AdminFaceFabProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdminFaceFab({ isOpen, onToggle }: AdminFaceFabProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, isOpen && styles.fabActive]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      {!isOpen && Platform.OS === 'ios' && (
        <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
      )}

      {isOpen ? (
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="M6 6L18 18M18 6L6 18"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </Svg>
      ) : (
        <Svg width={50} height={45} viewBox="0 0 50 45" fill="none">
          <Rect width={50} height={45} rx={22.5} fill="black" fillOpacity={0.01} />
          <Path
            d="M23.6545 10.56H26.3545L32.9245 30H30.7945L28.7845 23.97H21.2245L19.2145 30H17.0845L23.6545 10.56ZM21.7645 22.29H28.2745L25.0945 12.21H25.0045L21.7645 22.29Z"
            fill="black"
          />
          <Circle cx={25} cy={36} r={1} fill="#D9D9D9" />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 50,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  fabActive: {
    backgroundColor: '#FF3B30',
  },
});
