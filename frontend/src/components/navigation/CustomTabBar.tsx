import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompassIcon, HomeIcon, GroupsIcon } from '../icons';
import { MainStackParamList } from '../../navigation/types';

type StackNav = NativeStackNavigationProp<MainStackParamList>;

function MiniMyBadge({ isActive }: { isActive: boolean }) {
  return (
    <View style={miniStyles.container}>
      <View style={[miniStyles.pill, miniStyles.pillOrange]} />
      <View style={[miniStyles.pill, miniStyles.pillPurple]} />
      <View style={[miniStyles.pill, miniStyles.pillTeal]} />
      <Text style={miniStyles.text}>MY</Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  container: {
    width: 34,
    height: 29,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    width: 18,
    height: 24,
    borderRadius: 20,
  },
  pillOrange: {
    backgroundColor: '#FEAC5E',
    left: 0,
    top: 2.5,
    transform: [{ rotate: '-20deg' }],
  },
  pillPurple: {
    backgroundColor: '#C779D0',
    left: 7.5,
    top: 2.35,
  },
  pillTeal: {
    backgroundColor: '#4BC0C8',
    right: 0,
    top: 2.85,
    transform: [{ rotate: '20deg' }],
  },
  text: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    zIndex: 1,
    textAlign: 'center',
  },
});

function OnePassTabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={onePassStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={onePassStyles.bg} />
      <Text style={onePassStyles.textOne}>ONE</Text>
      <Text style={onePassStyles.textNum}>1</Text>
      <Text style={onePassStyles.textPass}>PASS</Text>
    </TouchableOpacity>
  );
}

const onePassStyles = StyleSheet.create({
  container: {
    width: 65,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  textOne: {
    fontFamily: 'Gafata-Regular',
    fontSize: 10,
    color: '#000000',
    zIndex: 1,
  },
  textNum: {
    fontFamily: 'Gafata-Regular',
    fontSize: 28,
    color: '#000000',
    zIndex: 1,
    marginTop: -4,
    lineHeight: 30,
  },
  textPass: {
    fontFamily: 'Gafata-Regular',
    fontSize: 10,
    color: '#000000',
    zIndex: 1,
  },
});

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const stackNavigation = useNavigation<StackNav>();

  // Tab order: Explore(0), Home(1), [OnePass], Groups(2), Profile(3)
  const tabItems = [
    { routeIndex: 0, key: 'explore' },
    { routeIndex: 1, key: 'home' },
    { routeIndex: -1, key: 'onepass' }, // special
    { routeIndex: 2, key: 'groups' },
    { routeIndex: 3, key: 'profile' },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {tabItems.map((item) => {
        if (item.key === 'onepass') {
          return (
            <OnePassTabButton
              key="onepass"
              onPress={() => stackNavigation.navigate('OnePass', {})}
            />
          );
        }

        const route = state.routes[item.routeIndex];
        const isFocused = state.index === item.routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            {isFocused && <View style={styles.activeIndicator} />}
            {item.key === 'explore' && (
              <CompassIcon
                size={22}
                color={isFocused ? '#FFFFFF' : '#212121'}
              />
            )}
            {item.key === 'home' && (
              <HomeIcon
                size={22}
                color={isFocused ? '#FFFFFF' : '#212121'}
              />
            )}
            {item.key === 'groups' && (
              <GroupsIcon
                size={22}
                color={isFocused ? '#FFFFFF' : '#212121'}
              />
            )}
            {item.key === 'profile' && <MiniMyBadge isActive={isFocused} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 16,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
        borderTopWidth: 0,
      },
    }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
    minWidth: 40,
    minHeight: 40,
  },
  activeIndicator: {
    position: 'absolute',
    width: 35,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    zIndex: -1,
  },
});
