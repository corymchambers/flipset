import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { CardWithCategories, CategoryWithCount, SortOptions, SortField } from '@/types';
import { getFilteredCards, getAllCategories, deleteCard } from '@/database';
import { SearchBar, EmptyState, ConfirmDialog, Chip } from '@/components/ui';
import { CardListItem } from '@/components/cards';

const sortOptions: Array<{ field: SortField; label: string }> = [
  { field: 'alphabetical', label: 'A-Z' },
  { field: 'created_at', label: 'Created' },
  { field: 'updated_at', label: 'Modified' },
];

export default function CardsScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ filterCategories?: string }>();
  const [cards, setCards] = useState<CardWithCategories[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOptions>({ field: 'alphabetical', direction: 'asc' });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Handle filter categories from navigation params
  useEffect(() => {
    if (params.filterCategories) {
      const categoryIds = params.filterCategories.split(',');
      setSelectedCategoryIds(categoryIds);
      // Clear the param to avoid re-applying on subsequent focus
      router.setParams({ filterCategories: undefined });
    }
  }, [params.filterCategories]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadCards = useCallback(async () => {
    try {
      const data = await getFilteredCards(
        sortBy,
        searchQuery,
        selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined
      );
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  }, [sortBy, searchQuery, selectedCategoryIds]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadCards();
    }, [loadCategories, loadCards])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await deleteCard(id);
      setCards(cards.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const toggleSortDirection = () => {
    setSortBy(prev => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSortChange = (field: SortField) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
    setShowSortMenu(false);
  };

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategoryIds([]);
  };

  const hasActiveFilters = searchQuery.length > 0 || selectedCategoryIds.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search cards..."
        />
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Text style={[styles.sortButtonText, { color: colors.text }]}>
              {sortOptions.find(o => o.field === sortBy.field)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.directionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={toggleSortDirection}
          >
            <Ionicons
              name={sortBy.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.field}
                style={[
                  styles.sortMenuItem,
                  sortBy.field === option.field && { backgroundColor: colors.primaryLight + '20' },
                ]}
                onPress={() => handleSortChange(option.field)}
              >
                <Text
                  style={[
                    styles.sortMenuItemText,
                    { color: sortBy.field === option.field ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy.field === option.field && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Chip
              label="All"
              selected={selectedCategoryIds.length === 0}
              onPress={() => setSelectedCategoryIds([])}
            />
            {categories.map(category => (
              <Chip
                key={category.id}
                label={`${category.name} (${category.card_count})`}
                selected={selectedCategoryIds.includes(category.id)}
                onPress={() => toggleCategoryFilter(category.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {cards.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title={hasActiveFilters ? 'No cards found' : 'No cards yet'}
          description={
            hasActiveFilters
              ? 'Try different search or filter options'
              : 'Create your first flashcard to get started'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Create Card'}
          onAction={hasActiveFilters ? clearFilters : () => router.push('/card/new')}
        />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardListItem
              card={item}
              onPress={() => router.push(`/card/${item.id}`)}
              onDelete={() => setDeleteConfirm(item.id)}
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
        onPress={() => router.push('/card/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#0a0a0a" />
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteConfirm !== null}
        title="Delete Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteConfirm && handleDeleteCard(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  sortButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  directionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sortMenu: {
    position: 'absolute',
    top: 110,
    left: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 120,
  },
  sortMenuItemText: {
    fontSize: FontSize.md,
  },
  filterRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
    paddingTop: 0,
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
