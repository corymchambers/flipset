import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { CategoryWithCount } from '@/types';
import { UNCATEGORIZED_ID } from '@/constants';

interface CategoryListItemProps {
  category: CategoryWithCount;
  onPress: () => void;
  onDelete?: () => void;
}

export function CategoryListItem({ category, onPress, onDelete }: CategoryListItemProps) {
  const { colors } = useTheme();
  const isUncategorized = category.id === UNCATEGORIZED_ID;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isUncategorized}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isUncategorized ? 'folder-outline' : 'folder'}
          size={24}
          color={isUncategorized ? colors.textTertiary : colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: isUncategorized ? colors.textSecondary : colors.text },
          ]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
        <Text style={[styles.count, { color: colors.textTertiary }]}>
          {category.card_count} {category.card_count === 1 ? 'card' : 'cards'}
        </Text>
      </View>
      {!isUncategorized && onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
      {!isUncategorized && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
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
  iconContainer: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  count: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  deleteButton: {
    marginRight: Spacing.sm,
  },
});
