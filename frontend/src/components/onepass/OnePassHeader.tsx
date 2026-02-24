import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface OnePassHeaderProps {
  onBack: () => void;
}

export default function OnePassHeader({ onBack }: OnePassHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backArrow}>{'<'}</Text>
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <View style={styles.ticketFrame}>
          <Svg style={styles.ticketBorder} viewBox="0 0 65 15">
            <Rect
              x={0.5}
              y={0.5}
              width={64}
              height={14}
              rx={7}
              stroke="white"
              strokeWidth={0.5}
              fill="none"
            />
          </Svg>
          <Text style={styles.oneText}>ONE</Text>
          <Text style={styles.passText}>PASS</Text>
        </View>
        <Text style={styles.numberText}>1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 50,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 10,
    zIndex: 10,
    padding: 8,
  },
  backArrow: {
    fontFamily: 'Gafata-Regular',
    fontSize: 24,
    color: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 50,
    width: 65,
  },
  ticketFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 15,
    width: 65,
    marginTop: 20,
  },
  ticketBorder: {
    position: 'absolute',
    width: 65,
    height: 15,
  },
  oneText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    position: 'absolute',
    left: 4,
  },
  passText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    position: 'absolute',
    right: 3,
  },
  numberText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 50,
    color: '#FFFFFF',
    position: 'absolute',
    top: -8,
    textAlign: 'center',
  },
});
