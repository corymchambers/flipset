import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { CardWithCategories, CategoryWithCount, SortOptions, SortField } from '@/types';
import { getFilteredCards, getAllCategories, deleteCard } from '@/database';
import { SearchBar, EmptyState, ConfirmDialog } from '@/components/ui';
import { CardListItem } from '@/components/cards';

const sortOptions: Array<{ field: SortField; label: string }> = [
  { field: 'alphabetical', label: 'Alphabetical (A-Z)' },
  { field: 'created_at', label: 'Date Created' },
  { field: 'updated_at', label: 'Date Modified' },
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
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
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

  const handleSortChange = (field: SortField) => {
    setSortBy(prev => ({
      field,
      direction: 'asc',
    }));
    setShowSortSheet(false);
  };

  const toggleSortDirection = () => {
    setSortBy(prev => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
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

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.field === sortBy.field);
    return option?.label || 'Sort';
  };

  const getCategoryLabel = () => {
    if (selectedCategoryIds.length === 0) return 'All Categories';
    if (selectedCategoryIds.length === 1) {
      const cat = categories.find(c => c.id === selectedCategoryIds[0]);
      return cat?.name || '1 selected';
    }
    return `${selectedCategoryIds.length} selected`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search cards..."
        />
        <View style={styles.filterRow}>
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
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowSortSheet(true)}
          >
            <Text style={[styles.filterButtonText, { color: colors.text }]} numberOfLines={1}>
              {getSortLabel()}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: colors.surface,
                borderColor: selectedCategoryIds.length > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowCategorySheet(true)}
          >
            <Ionicons
              name="folder-outline"
              size={16}
              color={selectedCategoryIds.length > 0 ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterButtonText,
                { color: selectedCategoryIds.length > 0 ? colors.primary : colors.text },
              ]}
              numberOfLines={1}
            >
              {getCategoryLabel()}
            </Text>
          </TouchableOpacity>
        </View>
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

      {/* Sort Action Sheet */}
      <Modal
        visible={showSortSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowSortSheet(false)}>
          <Pressable style={[styles.sheetContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort By</Text>
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.field}
                style={styles.sheetOption}
                onPress={() => handleSortChange(option.field)}
              >
                <Text
                  style={[
                    styles.sheetOptionText,
                    { color: sortBy.field === option.field ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy.field === option.field && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category Action Sheet */}
      <Modal
        visible={showCategorySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategorySheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowCategorySheet(false)}>
          <Pressable style={[styles.sheetContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Filter by Category</Text>
              {selectedCategoryIds.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedCategoryIds([])}>
                  <Text style={[styles.sheetClearText, { color: colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {categories.map(category => {
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.sheetOption}
                    onPress={() => toggleCategoryFilter(category.id)}
                  >
                    <View style={styles.sheetOptionLeft}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text style={[styles.sheetOptionText, { color: colors.text }]}>
                        {category.name}
                      </Text>
                    </View>
                    <Text style={[styles.sheetOptionCount, { color: colors.textSecondary }]}>
                      {category.card_count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.sheetDoneButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCategorySheet(false)}
            >
              <Text style={styles.sheetDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  directionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterButtonText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sheetClearText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  sheetScroll: {
    maxHeight: 300,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sheetOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sheetOptionText: {
    fontSize: FontSize.md,
  },
  sheetOptionCount: {
    fontSize: FontSize.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDoneButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  sheetDoneButtonText: {
    color: '#0a0a0a',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
