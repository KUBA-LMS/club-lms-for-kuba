import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import { UserRegistrationStatus } from '../../types/event';

interface MapPinProps {
  status: UserRegistrationStatus;
  size?: number;
  selected?: boolean;
  date?: string;
}

const STATUS_COLORS: Record<string, string> = {
  registered: '#000000',
  visited: '#C20000',
  open: '#34C759',
  requested: '#FF8D28',
  closed: '#C20000',
  upcoming: '#8E8E93',
};

// Figma SVG: 35×42, teardrop pin body (white→color gradient) + ellipse shadow
export default function MapPin({ status, size = 35, selected, date }: MapPinProps) {
  const scale = selected ? 1.3 : 1;
  const w = Math.round(size * scale);
  const h = Math.round(42 * scale);
  const statusColor = STATUS_COLORS[status] || '#34C759';
  const gradId = `pinGrad_${status}`;

  return (
    <View style={styles.wrapper} collapsable={false}>
      {date && (
        <View style={[styles.dateBadge, selected && styles.dateBadgeSelected]}>
          <Text style={styles.dateText}>{date}</Text>
        </View>
      )}
      <Svg width={w} height={h} viewBox="0 0 35 42" fill="none">
        <Defs>
          <LinearGradient
            id={gradId}
            x1="17.4873"
            y1="0"
            x2="17.4873"
            y2="29.8506"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.4" stopColor={statusColor} />
          </LinearGradient>
        </Defs>

        {/* Bottom shadow ellipse */}
        <Ellipse cx={17.502} cy={32} rx={4.5} ry={2} fill={statusColor} opacity={0.6} />

        {/* Pin body */}
        <Path
          d="M17.4785 0C22.9997 5.05028e-05 27.901 2.6556 30.9746 6.75879C23.761 12.1809 18.7954 20.4245 17.7207 29.8477C17.6474 29.8485 17.5735 29.8506 17.5 29.8506C17.427 29.8506 17.3541 29.8485 17.2812 29.8477C16.2051 20.4121 11.229 12.1591 4 6.7373C7.07459 2.6466 11.9672 0.000143226 17.4785 0Z"
          fill={`url(#${gradId})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  dateBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  dateBadgeSelected: {
    backgroundColor: '#000000',
  },
  dateText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
});
