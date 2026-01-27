import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useTheme, useSession } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { CategoryWithCount, SessionOrderMode } from '@/types';
import { getAllCategories, getCardsByCategories } from '@/database';
import { Button, RadioButton, Card, EmptyState, ConfirmDialog } from '@/components/ui';

export default function ReviewScreen() {
  const { colors, isDark } = useTheme();
  const { session, hasActiveSession, endSession } = useSession();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [orderMode, setOrderMode] = useState<SessionOrderMode>('random');
  const [cardCount, setCardCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [endSessionDialog, setEndSessionDialog] = useState(false);

  const totalCards = categories.reduce((sum, c) => sum + c.card_count, 0);

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
    setEndSessionDialog(true);
  };

  const confirmEndSession = () => {
    endSession();
    setEndSessionDialog(false);
  };

  if (totalCards === 0 && !hasActiveSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.header}>
            {isDark ? (
              <Image
                source={require('@/assets/icons/icon-transparent.png')}
                style={styles.logo}
              />
            ) : (
              <View style={[styles.iconLogo, { backgroundColor: colors.surface }]}>
                <Ionicons name="layers" size={40} color={colors.primary} />
              </View>
            )}
            <View>
              <Text style={[styles.appTitle, { color: colors.text }]}>FLIPSET</Text>
              <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
                Power up your knowledge
              </Text>
            </View>
          </View>
          <EmptyState
            icon="albums-outline"
            title="No cards to review"
            description="Add some flashcards first to start reviewing"
            actionLabel="Add Cards"
            onAction={() => router.push('/card/new')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
        {isDark ? (
          <Image
            source={require('@/assets/icons/icon-transparent.png')}
            style={styles.logo}
          />
        ) : (
          <View style={[styles.iconLogo, { backgroundColor: colors.surface }]}>
            <Ionicons name="layers" size={40} color={colors.primary} />
          </View>
        )}
        <View>
          <Text style={[styles.appTitle, { color: colors.text }]}>FLIPSET</Text>
          <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
            Power up your knowledge
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statsNumber, { color: colors.text }]}>
            {categories.length}
          </Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
            Categories
          </Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statsNumber, { color: colors.primary }]}>
            {selectedCategories.length}
          </Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
            Selected
          </Text>
        </View>
      </View>

      {/* Active Session Card */}
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

      {/* Your Decks Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Decks
        </Text>
        <TouchableOpacity onPress={selectAll}>
          <Text style={[styles.selectAllText, { color: colors.textSecondary }]}>
            Select All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Cards */}
      {categories.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          No categories available. Create some categories and cards first.
        </Text>
      ) : (
        categories.map(category => (
          <TouchableOpacity
            key={category.id}
            onPress={() => toggleCategory(category.id)}
            disabled={category.card_count === 0}
            style={[
              styles.categoryCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedCategories.includes(category.id)
                  ? colors.primary
                  : colors.border,
                opacity: category.card_count === 0 ? 0.5 : 1,
              },
            ]}
          >
            <View style={[styles.categoryAvatar, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.categoryAvatarText, { color: colors.text }]}>
                {category.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {category.name}
              </Text>
              <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                {category.card_count} {category.card_count === 1 ? 'card' : 'cards'}
              </Text>
            </View>
            <View style={[styles.categoryArrow, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons
                name={selectedCategories.includes(category.id) ? 'checkmark' : 'arrow-forward'}
                size={18}
                color={selectedCategories.includes(category.id) ? colors.primary : colors.textTertiary}
              />
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Card Order */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
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
            label="Ordered (as added)"
          />
        </View>
      </Card>

      {/* Summary */}
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

      <ConfirmDialog
        visible={endSessionDialog}
        title="End Session"
        message="Are you sure you want to end the current session? Your progress will be lost."
        confirmLabel="End Session"
        confirmVariant="danger"
        onConfirm={confirmEndSession}
        onCancel={() => setEndSessionDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
  },
  iconLogo: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: FontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statsNumber: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  statsLabel: {
    fontSize: FontSize.sm,
  },
  resumeCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  selectAllText: {
    fontSize: FontSize.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  categoryAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryAvatarText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  categoryCount: {
    fontSize: FontSize.sm,
  },
  categoryArrow: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
