import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const FAB_SIZE = 52;
const ITEM_SIZE = 46;
const RADIUS = 85;

// Radial offsets from FAB center — fan upward and to the left
const OFFSETS = [
  { x: 0,       y: -RADIUS },        // straight up
  { x: -RADIUS * 0.707, y: -RADIUS * 0.707 }, // 135° up-left
  { x: -RADIUS, y: 0 },              // left
];

function CalendarPlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={17} rx={3} stroke="#fff" strokeWidth={1.8} />
      <Path d="M3 9h18" stroke="#fff" strokeWidth={1.8} />
      <Path d="M8 2v3M16 2v3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 13v4M10 15h4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function KeyIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={8} cy={15} r={4.5} stroke="#fff" strokeWidth={1.8} />
      <Path d="M12 11.5L20 4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M18 6l2 2" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M16 8l1.5 1.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function GridIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7.5} height={7.5} rx={2} stroke="#fff" strokeWidth={1.8} />
      <Rect x={13.5} y={3} width={7.5} height={7.5} rx={2} stroke="#fff" strokeWidth={1.8} />
      <Rect x={3} y={13.5} width={7.5} height={7.5} rx={2} stroke="#fff" strokeWidth={1.8} />
      <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={2} stroke="#fff" strokeWidth={1.8} />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L4 7v5c0 4.8 3.4 9.3 8 10.7C16.6 21.3 20 16.8 20 12V7l-8-4z"
        stroke="#1C1C1E"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke="#1C1C1E"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface AdminMenuItem {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface AdminFaceFabProps {
  isOpen: boolean;
  onToggle: () => void;
  items: AdminMenuItem[];
}

export default function AdminFaceFab({ isOpen, onToggle, items }: AdminFaceFabProps) {
  const anims = useRef(
    items.map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
    }))
  ).current;

  const fabScale = useRef(new Animated.Value(1)).current;
  const fabBgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toValue = isOpen ? 1 : 0;

    Animated.timing(fabBgAnim, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();

    Animated.spring(fabScale, {
      toValue: isOpen ? 0.92 : 1,
      tension: 300,
      friction: 14,
      useNativeDriver: true,
    }).start();

    if (isOpen) {
      items.forEach((_, i) => {
        const offset = OFFSETS[i] ?? { x: 0, y: 0 };
        Animated.sequence([
          Animated.delay(i * 45),
          Animated.parallel([
            Animated.spring(anims[i].scale, { toValue: 1, tension: 220, friction: 13, useNativeDriver: true }),
            Animated.timing(anims[i].opacity, { toValue: 1, duration: 130, useNativeDriver: true }),
            Animated.spring(anims[i].tx, { toValue: offset.x, tension: 220, friction: 13, useNativeDriver: true }),
            Animated.spring(anims[i].ty, { toValue: offset.y, tension: 220, friction: 13, useNativeDriver: true }),
          ]),
        ]).start();
      });
    } else {
      [...items].reverse().forEach((_, ri) => {
        const i = items.length - 1 - ri;
        Animated.sequence([
          Animated.delay(ri * 35),
          Animated.parallel([
            Animated.spring(anims[i].scale, { toValue: 0, tension: 300, friction: 14, useNativeDriver: true }),
            Animated.timing(anims[i].opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.spring(anims[i].tx, { toValue: 0, tension: 300, friction: 14, useNativeDriver: true }),
            Animated.spring(anims[i].ty, { toValue: 0, tension: 300, friction: 14, useNativeDriver: true }),
          ]),
        ]).start();
      });
    }
  }, [isOpen]);

  const itemAnchorBottom = (FAB_SIZE - ITEM_SIZE) / 2; // 3
  const itemAnchorRight = (FAB_SIZE - ITEM_SIZE) / 2;  // 3

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Radial items */}
      {items.map((item, i) => (
        <Animated.View
          key={i}
          style={[
            styles.itemWrapper,
            {
              bottom: itemAnchorBottom,
              right: itemAnchorRight,
              opacity: anims[i].opacity,
              transform: [
                { translateX: anims[i].tx },
                { translateY: anims[i].ty },
                { scale: anims[i].scale },
              ],
            },
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity style={styles.itemButton} onPress={item.onPress} activeOpacity={0.8}>
            {item.icon}
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Main FAB */}
      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabScale }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.04)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradientBorder}
        >
        <TouchableOpacity
          style={styles.fab}
          onPress={onToggle}
          activeOpacity={0.85}
        >
          {Platform.OS === 'ios' && (
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.fabOverlay} />
          {isOpen ? (
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M6 6L18 18M18 6L6 18"
                stroke="#1C1C1E"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          ) : (
            <ShieldIcon />
          )}
        </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

export { CalendarPlusIcon, KeyIcon, GridIcon };

const styles = StyleSheet.create({
  container: {
    width: FAB_SIZE + RADIUS + 10,
    height: FAB_SIZE + RADIUS + 10,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 14 },
    }),
  },
  fabGradientBorder: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    padding: 1,
  },
  fab: {
    flex: 1,
    borderRadius: FAB_SIZE / 2 - 1,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  itemWrapper: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
});
