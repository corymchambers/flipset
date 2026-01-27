import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing } from '@/constants/theme';
import { CategoryWithCount } from '@/types';
import {
  getAllCategories,
  deleteCategory,
  deleteCategoryAndCards,
  moveCategoryCardsTo,
} from '@/database';
import { UNCATEGORIZED_ID } from '@/constants';
import { EmptyState } from '@/components/ui';
import { CategoryListItem, DeleteCategoryDialog } from '@/components/categories';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<CategoryWithCount | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleDeleteCategory = async (
    action: 'delete' | 'move' | 'uncategorize',
    targetCategoryId?: string
  ) => {
    if (!deleteDialog) return;

    try {
      switch (action) {
        case 'delete':
          await deleteCategoryAndCards(deleteDialog.id);
          break;
        case 'move':
          if (targetCategoryId) {
            await moveCategoryCardsTo(deleteDialog.id, targetCategoryId);
          }
          break;
        case 'uncategorize':
          await moveCategoryCardsTo(deleteDialog.id, null);
          break;
      }

      await loadCategories();
      setDeleteDialog(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Filter out uncategorized for the list display order
  const displayCategories = categories;
  const realCategories = categories.filter(c => c.id !== UNCATEGORIZED_ID);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {realCategories.length === 0 ? (
        <EmptyState
          icon="folder-outline"
          title="No categories yet"
          description="Create categories to organize your flashcards"
          actionLabel="Create Category"
          onAction={() => router.push('/category/new')}
        />
      ) : (
        <FlatList
          data={displayCategories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryListItem
              category={item}
              onPress={() => {
                if (item.id !== UNCATEGORIZED_ID) {
                  router.push(`/category/${item.id}`);
                }
              }}
              onDelete={
                item.id !== UNCATEGORIZED_ID
                  ? () => setDeleteDialog(item)
                  : undefined
              }
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/category/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#0a0a0a" />
      </TouchableOpacity>

      {deleteDialog && (
        <DeleteCategoryDialog
          visible={true}
          categoryName={deleteDialog.name}
          cardCount={deleteDialog.card_count}
          availableCategories={categories}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeleteDialog(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
