import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { CardWithCategories } from '@/types';
import { Chip } from '@/components/ui';

interface CardListItemProps {
  card: CardWithCategories;
  onPress: () => void;
  onDelete?: () => void;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function CardListItem({ card, onPress, onDelete }: CardListItemProps) {
  const { colors } = useTheme();

  const frontText = stripHtml(card.front_content);
  const backText = stripHtml(card.back_content);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text
          style={[styles.front, { color: colors.text }]}
          numberOfLines={2}
        >
          {frontText || 'Empty front'}
        </Text>
        <Text
          style={[styles.back, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {backText || 'Empty back'}
        </Text>
        {card.categories.length > 0 && (
          <View style={styles.categories}>
            {card.categories.slice(0, 3).map((category) => (
              <Chip key={category.id} label={category.name} />
            ))}
            {card.categories.length > 3 && (
              <Text style={[styles.moreCategories, { color: colors.textTertiary }]}>
                +{card.categories.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  front: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  back: {
    fontSize: FontSize.sm,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  moreCategories: {
    fontSize: FontSize.sm,
    alignSelf: 'center',
  },
  deleteButton: {
    marginRight: Spacing.sm,
  },
});
