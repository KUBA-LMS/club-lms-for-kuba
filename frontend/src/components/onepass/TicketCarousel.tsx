import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions, FlatList } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  SharedValue,
} from 'react-native-reanimated';
import TicketCard from './TicketCard';
import { OnePassTicket } from '../../types/onepass';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAIN_CARD_WIDTH = 255;
const MAIN_CARD_HEIGHT = 340;
const SIDE_CARD_WIDTH = 172;
const SIDE_CARD_HEIGHT = 233;
const CARD_SPACING = 8;

interface TicketCarouselProps {
  tickets: OnePassTicket[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  scrollX: SharedValue<number>;
}

function AnimatedCard({
  ticket,
  index,
  scrollX,
  totalTickets,
}: {
  ticket: OnePassTicket;
  index: number;
  scrollX: SharedValue<number>;
  totalTickets: number;
}) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      'clamp'
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [20, 0, 20],
      'clamp'
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      'clamp'
    );
    const rotateY = interpolate(
      scrollX.value,
      inputRange,
      [25, 0, -25],
      'clamp'
    );

    return {
      transform: [
        { perspective: 800 },
        { scale },
        { translateY },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
    };
  });

  const imageUri = ticket.event.images?.[0];

  return (
    <View style={styles.cardWrapper}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <TicketCard
          imageUri={imageUri}
          width={MAIN_CARD_WIDTH}
          height={MAIN_CARD_HEIGHT}
        />
      </Animated.View>
    </View>
  );
}

export default function TicketCarousel({
  tickets,
  activeIndex,
  onIndexChange,
  scrollX,
}: TicketCarouselProps) {
  const onScroll = useCallback(
    (event: any) => {
      scrollX.value = event.nativeEvent.contentOffset.x;
    },
    [scrollX]
  );

  const onMomentumScrollEnd = useCallback(
    (event: any) => {
      const newIndex = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tickets.length) {
        onIndexChange(newIndex);
      }
    },
    [activeIndex, onIndexChange, tickets.length]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: OnePassTicket; index: number }) => (
      <AnimatedCard
        ticket={item}
        index={index}
        scrollX={scrollX}
        totalTickets={tickets.length}
      />
    ),
    [scrollX, tickets.length]
  );

  if (tickets.length === 0) {
    return <View style={styles.emptyContainer} />;
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={tickets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        contentOffset={{ x: activeIndex * SCREEN_WIDTH, y: 0 }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MAIN_CARD_HEIGHT + 40,
    justifyContent: 'center',
  },
  emptyContainer: {
    height: MAIN_CARD_HEIGHT + 40,
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
