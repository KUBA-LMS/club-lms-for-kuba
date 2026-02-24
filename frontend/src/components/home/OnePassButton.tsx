import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface OnePassButtonProps {
  onPress?: () => void;
}

export default function OnePassButton({ onPress }: OnePassButtonProps) {
  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.numberText}>1</Text>
      <View style={styles.container}>
        <View style={styles.ticketFrame}>
          <Svg style={styles.ticketBorder} viewBox="0 0 130 30">
            <Rect
              x={1}
              y={1}
              width={128}
              height={28}
              rx={14}
              stroke="white"
              strokeWidth={1}
              fill="none"
            />
          </Svg>
          <Text style={styles.oneText}>ONE</Text>
          <Text style={styles.passText}>PASS</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 72,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  container: {
    backgroundColor: '#000000',
    borderRadius: 50,
    height: 72,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  ticketFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 30,
    width: 130,
  },
  ticketBorder: {
    position: 'absolute',
    width: 130,
    height: 30,
  },
  oneText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 20,
    color: '#FFFFFF',
    position: 'absolute',
    left: 8,
  },
  numberText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 95,
    color: '#FFFFFF',
    position: 'absolute',
    zIndex: 10,
    top: -20,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  passText: {
    fontFamily: 'Gafata-Regular',
    fontSize: 20,
    color: '#FFFFFF',
    position: 'absolute',
    right: 4,
  },
});
