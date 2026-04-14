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
import { resolveImageUrl } from '../../utils/image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_RATIO = 3 / 4; // width / height  (portrait poster, closer to A4)
const MAX_CARD_WIDTH = 248;
const MAX_CARD_HEIGHT = Math.round(MAX_CARD_WIDTH / POSTER_RATIO); // 330
const CAROUSEL_EXTRA = 40; // vertical breathing room in carousel container
const MIN_CARD_HEIGHT = 180;

interface TicketCarouselProps {
  tickets: OnePassTicket[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  scrollX: SharedValue<number>;
  maxHeight?: number; // max height for the entire carousel container
}

function AnimatedCard({
  ticket,
  index,
  scrollX,
  totalTickets,
  cardWidth,
  cardHeight,
}: {
  ticket: OnePassTicket;
  index: number;
  scrollX: SharedValue<number>;
  totalTickets: number;
  cardWidth: number;
  cardHeight: number;
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

  const imageUri = resolveImageUrl(ticket.event.images?.[0]);

  return (
    <View style={styles.cardWrapper}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <TicketCard
          imageUri={imageUri}
          width={cardWidth}
          height={cardHeight}
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
  maxHeight,
}: TicketCarouselProps) {
  const cardHeight = Math.max(
    MIN_CARD_HEIGHT,
    maxHeight ? Math.min(MAX_CARD_HEIGHT, maxHeight - CAROUSEL_EXTRA) : MAX_CARD_HEIGHT,
  );
  const cardWidth = Math.round(cardHeight * POSTER_RATIO);
  const containerHeight = cardHeight + CAROUSEL_EXTRA;

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
        cardWidth={cardWidth}
        cardHeight={cardHeight}
      />
    ),
    [scrollX, tickets.length, cardWidth, cardHeight]
  );

  if (tickets.length === 0) {
    return <View style={[styles.emptyContainer, { height: containerHeight }]} />;
  }

  return (
    <View style={[styles.container, { height: containerHeight }]}>
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
    justifyContent: 'center',
  },
  emptyContainer: {},
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
