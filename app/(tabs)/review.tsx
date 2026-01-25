import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useTheme, useSession } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { CategoryWithCount, SessionOrderMode } from '@/types';
import { getAllCategories, getCardsByCategories } from '@/database';
import { Button, Checkbox, RadioButton, Card } from '@/components/ui';

export default function ReviewScreen() {
  const { colors } = useTheme();
  const { session, hasActiveSession, endSession } = useSession();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [orderMode, setOrderMode] = useState<SessionOrderMode>('random');
  const [cardCount, setCardCount] = useState(0);
  const [loading, setLoading] = useState(false);

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

  // Update card count when selection changes
  useEffect(() => {
    const updateCardCount = async () => {
      if (selectedCategories.length === 0) {
        setCardCount(0);
        return;
      }

      try {
        const cards = await getCardsByCategories(selectedCategories);
        setCardCount(cards.length);
      } catch (error) {
        console.error('Failed to count cards:', error);
        setCardCount(0);
      }
    };

    updateCardCount();
  }, [selectedCategories]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAll = () => {
    setSelectedCategories(categories.map(c => c.id));
  };

  const selectNone = () => {
    setSelectedCategories([]);
  };

  const handleStartSession = () => {
    if (cardCount === 0) return;

    router.push({
      pathname: '/review/session',
      params: {
        categories: selectedCategories.join(','),
        orderMode,
      },
    });
  };

  const handleResumeSession = () => {
    router.push('/review/session');
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end the current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => endSession(),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {hasActiveSession && (
        <Card style={[styles.resumeCard, { borderColor: colors.primary }]}>
          <Text style={[styles.resumeTitle, { color: colors.text }]}>
            Session in Progress
          </Text>
          <Text style={[styles.resumeText, { color: colors.textSecondary }]}>
            You have an active review session. Would you like to resume?
          </Text>
          <View style={styles.resumeButtons}>
            <Button
              title="End Session"
              variant="secondary"
              onPress={handleEndSession}
            />
            <Button
              title="Resume"
              onPress={handleResumeSession}
            />
          </View>
        </Card>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Select Categories
      </Text>

      <View style={styles.selectActions}>
        <Button
          title="Select All"
          variant="ghost"
          size="sm"
          onPress={selectAll}
        />
        <Button
          title="Select None"
          variant="ghost"
          size="sm"
          onPress={selectNone}
        />
      </View>

      <Card style={styles.categoriesCard}>
        {categories.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No categories available. Create some categories and cards first.
          </Text>
        ) : (
          categories.map(category => (
            <View key={category.id} style={styles.categoryRow}>
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onToggle={() => toggleCategory(category.id)}
                label={`${category.name} (${category.card_count})`}
                disabled={category.card_count === 0}
              />
            </View>
          ))
        )}
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Card Order
      </Text>

      <Card style={styles.orderCard}>
        <View style={styles.orderOption}>
          <RadioButton
            selected={orderMode === 'random'}
            onSelect={() => setOrderMode('random')}
            label="Randomized"
          />
        </View>
        <View style={styles.orderOption}>
          <RadioButton
            selected={orderMode === 'ordered'}
            onSelect={() => setOrderMode('ordered')}
            label="Ordered (alphabetical)"
          />
        </View>
      </Card>

      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {cardCount} {cardCount === 1 ? 'card' : 'cards'} selected
        </Text>
      </View>

      <Button
        title="Start Review Session"
        onPress={handleStartSession}
        disabled={cardCount === 0}
        loading={loading}
        fullWidth
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  resumeCard: {
    marginBottom: Spacing.lg,
    borderWidth: 2,
  },
  resumeTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  resumeText: {
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  resumeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  selectActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoriesCard: {
    marginBottom: Spacing.lg,
  },
  categoryRow: {
    paddingVertical: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    textAlign: 'center',
    padding: Spacing.md,
  },
  orderCard: {
    marginBottom: Spacing.lg,
  },
  orderOption: {
    paddingVertical: Spacing.sm,
  },
  summary: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryText: {
    fontSize: FontSize.md,
  },
});
