import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../constants';

// Icons
const SearchIcon = ({ size = 14, color = '#212121' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BusIcon = ({ size = 18, color = '#000000' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6C4 4.34315 5.34315 3 7 3H17C18.6569 3 20 4.34315 20 6V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16V6Z"
      stroke={color}
      strokeWidth={2}
    />
    <Path d="M4 12H20" stroke={color} strokeWidth={2} />
    <Circle cx="7.5" cy="15" r="1.5" fill={color} />
    <Circle cx="16.5" cy="15" r="1.5" fill={color} />
  </Svg>
);

const CarIcon = ({ size = 18, color = '#000000' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 11L6.5 6.5C6.78 5.59 7.63 5 8.59 5H15.41C16.37 5 17.22 5.59 17.5 6.5L19 11M5 11V17C5 17.55 5.45 18 6 18H7C7.55 18 8 17.55 8 17V16H16V17C16 17.55 16.45 18 17 18H18C18.55 18 19 17.55 19 17V11M5 11H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="7.5" cy="14" r="1.5" fill={color} />
    <Circle cx="16.5" cy="14" r="1.5" fill={color} />
  </Svg>
);

const WalkIcon = ({ size = 18, color = '#000000' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="4.5" r="2" stroke={color} strokeWidth={2} />
    <Path
      d="M10 9L8 21M14 9L16 21M9 9H15L14 15H10L9 9Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface TransitCardProps {
  publicTransitTime?: string;
  carTime?: string;
  walkTime?: string;
  onSearchPress?: () => void;
}

export default function TransitCard({
  publicTransitTime = '15 min',
  carTime = '15 min',
  walkTime = '15 min',
  onSearchPress,
}: TransitCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.fromSection}>
        <Text style={styles.fromLabel}>From:</Text>
        <Text style={styles.fromValue}>Current Location</Text>
        <TouchableOpacity style={styles.searchButton} onPress={onSearchPress}>
          <SearchIcon size={14} color="#212121" />
        </TouchableOpacity>
      </View>
      <View style={styles.transitOptions}>
        <View style={styles.transitOption}>
          <BusIcon size={17} color="#000000" />
          <Text style={styles.transitLabel}>Public Transit</Text>
          <Text style={styles.transitTime}>{publicTransitTime}</Text>
        </View>
        <View style={styles.transitDivider} />
        <View style={styles.transitOption}>
          <CarIcon size={17} color="#000000" />
          <Text style={styles.transitLabel}>Car</Text>
          <Text style={styles.transitTime}>{carTime}</Text>
        </View>
        <View style={styles.transitDivider} />
        <View style={styles.transitOption}>
          <WalkIcon size={17} color="#000000" />
          <Text style={styles.transitLabel}>Walk</Text>
          <Text style={styles.transitTime}>{walkTime}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  fromSection: {
    height: 35,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  fromLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.gray900,
  },
  fromValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#00C0E8',
  },
  searchButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitOptions: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  transitOption: {
    flex: 1,
    alignItems: 'center',
  },
  transitLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.black,
    marginTop: 2,
    textAlign: 'center',
  },
  transitTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.success,
  },
  transitDivider: {
    width: 1,
    backgroundColor: colors.gray300,
    marginVertical: 4,
  },
});
