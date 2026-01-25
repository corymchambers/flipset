import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { Card } from '@/types';
import { Button } from '@/components/ui';
import { RichTextRenderer } from '@/components/editor';

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
  const { height } = useWindowDimensions();
  const [showBack, setShowBack] = useState(false);

  const cardHeight = Math.min(height * 0.45, 400);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            height: cardHeight,
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
      </View>

      <Button
        title={showBack ? 'Show Front' : 'Show Back'}
        variant="secondary"
        onPress={() => setShowBack(!showBack)}
        fullWidth
        style={styles.flipButton}
      />

      <View style={styles.actionButtons}>
        <Button
          title="Wrong"
          variant="danger"
          onPress={() => {
            setShowBack(false);
            onWrong();
          }}
          style={styles.actionButton}
        />
        <Button
          title="Skip"
          variant="secondary"
          onPress={() => {
            setShowBack(false);
            onSkip();
          }}
          style={styles.actionButton}
        />
        <Button
          title="Correct"
          onPress={() => {
            setShowBack(false);
            onCorrect();
          }}
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
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
