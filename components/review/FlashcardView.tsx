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
import { Card } from '@/types';
import { Button } from '@/components/ui';
import { RichTextRenderer } from '@/components/editor';

const SWIPE_THRESHOLD = 100;

interface FlashcardViewProps {
  card: Card;
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashcardView({
  card,
  onCorrect,
  onWrong,
  onSkip,
  onEdit,
  onDelete,
}: FlashcardViewProps) {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const [showBack, setShowBack] = useState(false);

  const cardHeight = Math.min(height * 0.45, 400);

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Store callbacks in refs to avoid stale closures in panResponder
  const onCorrectRef = useRef(onCorrect);
  const onWrongRef = useRef(onWrong);
  onCorrectRef.current = onCorrect;
  onWrongRef.current = onWrong;

  // Reset animation when card changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    cardOpacity.setValue(1);
    setShowBack(false);
  }, [card.id]);

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -width : width;

    Animated.parallel([
      Animated.timing(pan.x, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (direction === 'left') {
        onWrongRef.current();
      } else {
        onCorrectRef.current();
      }
    });
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
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right = correct
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: width,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onCorrectRef.current());
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left = wrong
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: -width,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onWrongRef.current());
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
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Overlay opacity for visual feedback
  const correctOverlayOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 0.3],
    extrapolate: 'clamp',
  });

  const wrongOverlayOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [0.3, 0],
    extrapolate: 'clamp',
  });

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
            opacity: cardOpacity,
            transform: [{ translateX: pan.x }, { rotate }],
          },
        ]}
      >
        {/* Correct overlay (green) */}
        <Animated.View
          style={[
            styles.swipeOverlay,
            { backgroundColor: colors.success, opacity: correctOverlayOpacity },
          ]}
          pointerEvents="none"
        />
        {/* Wrong overlay (red) */}
        <Animated.View
          style={[
            styles.swipeOverlay,
            { backgroundColor: colors.error, opacity: wrongOverlayOpacity },
          ]}
          pointerEvents="none"
        />
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
      </Animated.View>

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <Text style={[styles.swipeHintText, { color: colors.textTertiary }]}>
          Swipe left for wrong, right for correct
        </Text>
      </View>

      <Button
        title={showBack ? 'Show Front' : 'Show Back'}
        variant="secondary"
        onPress={() => setShowBack(!showBack)}
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
          onPress={() => handleSwipeComplete('left')}
          style={styles.actionButton}
        />
        <Button
          title="Correct"
          onPress={() => handleSwipeComplete('right')}
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
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
    zIndex: 10,
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
