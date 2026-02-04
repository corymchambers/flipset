import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '@/hooks';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { CardWithCategories } from '@/types';
import { Button } from '@/components/ui';
import { RichTextRenderer } from '@/components/editor';

const SWIPE_THRESHOLD = 80;

interface FlashcardViewProps {
  card: CardWithCategories;
  showFirstSide?: 'front' | 'back';
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashcardView({
  card,
  showFirstSide = 'front',
  onCorrect,
  onWrong,
  onSkip,
  onEdit,
  onDelete,
}: FlashcardViewProps) {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const [showBack, setShowBack] = useState(showFirstSide === 'back');

  const cardHeight = Math.min(height * 0.45, 400);

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;

  // Reset animation when card changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    setShowBack(showFirstSide === 'back');
  }, [card.id, showFirstSide]);

  const flipCard = () => {
    setShowBack(!showBack);
  };

  const handleSwipeComplete = () => {
    // Flip immediately, then animate back to center
    setShowBack(prev => !prev);
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Swipe triggers flip
          handleSwipeComplete();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Interpolate rotation based on swipe
  const rotate = pan.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-5deg', '0deg', '5deg'],
    extrapolate: 'clamp',
  });

  const handleMarkWrong = () => {
    Animated.parallel([
      Animated.timing(pan.x, {
        toValue: -width,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onWrong();
    });
  };

  const handleMarkCorrect = () => {
    Animated.parallel([
      Animated.timing(pan.x, {
        toValue: width,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onCorrect();
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            height: cardHeight,
            transform: [{ translateX: pan.x }, { rotate }],
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: colors.textTertiary }]}>
            {showBack ? 'Back' : 'Front'}
          </Text>
          <View style={styles.cardActions}>
            <Button
              title="Edit"
              variant="ghost"
              size="sm"
              onPress={onEdit}
            />
            <Button
              title="Delete"
              variant="ghost"
              size="sm"
              onPress={onDelete}
              textStyle={{ color: colors.error }}
            />
          </View>
        </View>
        <ScrollView
          style={styles.cardContent}
          showsVerticalScrollIndicator={true}
        >
          <RichTextRenderer
            content={showBack ? card.back_content : card.front_content}
          />
        </ScrollView>
        {card.categories.length > 0 && (
          <View style={styles.categoriesRow}>
            {card.categories.map(category => (
              <View
                key={category.id}
                style={[styles.categoryChip, { backgroundColor: colors.primaryLight + '30' }]}
              >
                <Text style={[styles.categoryChipText, { color: colors.primary }]}>
                  {category.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <Text style={[styles.swipeHintText, { color: colors.textTertiary }]}>
          Swipe to flip card
        </Text>
      </View>

      <Button
        title={showBack ? 'Show Front' : 'Show Back'}
        variant="secondary"
        onPress={flipCard}
        fullWidth
        style={styles.flipButton}
      />

      <Button
        title="Skip"
        variant="secondary"
        onPress={() => {
          setShowBack(false);
          onSkip();
        }}
        fullWidth
        style={styles.skipButton}
      />

      <View style={styles.actionButtons}>
        <Button
          title="Wrong"
          variant="danger"
          onPress={handleMarkWrong}
          style={styles.actionButton}
        />
        <Button
          title="Correct"
          onPress={handleMarkCorrect}
          style={[styles.actionButton, { backgroundColor: colors.success }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  swipeHint: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  swipeHintText: {
    fontSize: FontSize.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  cardLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  categoryChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  flipButton: {
    marginTop: Spacing.md,
  },
  skipButton: {
    marginTop: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
