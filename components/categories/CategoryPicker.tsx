import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { Category } from '@/types';
import { Chip } from '@/components/ui';
import { UNCATEGORIZED_ID } from '@/constants';

interface CategoryPickerProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (categoryId: string) => void;
  onAddCategory?: () => void;
  label?: string;
}

export function CategoryPicker({
  categories,
  selectedIds,
  onToggle,
  onAddCategory,
  label,
}: CategoryPickerProps) {
  const { colors } = useTheme();

  // Filter out uncategorized from the picker
  const selectableCategories = categories.filter(c => c.id !== UNCATEGORIZED_ID);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
      >
        {selectableCategories.length === 0 && !onAddCategory ? (
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            No categories available
          </Text>
        ) : (
          <>
            {selectableCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={selectedIds.includes(category.id)}
                onPress={() => onToggle(category.id)}
              />
            ))}
            {onAddCategory && (
              <TouchableOpacity
                style={[styles.addButton, { borderColor: colors.border }]}
                onPress={onAddCategory}
              >
                <Ionicons name="add" size={18} color={colors.textSecondary} />
                <Text style={[styles.addText, { color: colors.textSecondary }]}>Add</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  chipContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  empty: {
    fontSize: FontSize.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Spacing.xs,
  },
  addText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
