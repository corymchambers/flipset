import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme, useSession } from '@/hooks';
import { Spacing } from '@/constants/theme';
import { SessionOrderMode } from '@/types';
import { deleteCard } from '@/database';
import { ConfirmDialog, EmptyState } from '@/components/ui';
import { FlashcardView, ProgressBar, SessionComplete } from '@/components/review';

export default function ReviewSessionScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ categories?: string; orderMode?: string }>();
  const {
    session,
    currentCard,
    isLoading,
    hasActiveSession,
    startSession,
    markCorrect,
    markWrong,
    skipCard,
    resetSession,
    endSession,
    removeCardFromSession,
    refreshCurrentCard,
    getProgress,
  } = useSession();

  const [initializing, setInitializing] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    // Wait for session to load before initializing
    if (!isLoading) {
      initSession();
    }
  }, [isLoading]);

  const initSession = async () => {
    // If we have params, start a new session
    if (params.categories && params.orderMode) {
      const categoryIds = params.categories.split(',');
      const orderMode = params.orderMode as SessionOrderMode;

      const newSession = await startSession(categoryIds, orderMode);

      if (!newSession) {
        Alert.alert('No Cards', 'No cards found for the selected categories.');
        router.back();
      }
    } else if (!hasActiveSession) {
      // No params and no active session - go back
      router.back();
    }

    setInitializing(false);
  };

  const handleEdit = () => {
    if (currentCard) {
      router.push(`/card/${currentCard.id}`);
    }
  };

  const handleDelete = () => {
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!currentCard) return;

    try {
      await deleteCard(currentCard.id);
      await removeCardFromSession(currentCard.id);
      setDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete card:', error);
      Alert.alert('Error', 'Failed to delete card.');
    }
  };

  const handleFinish = () => {
    endSession();
    router.back();
  };

  // Refresh current card when returning from edit screen
  useFocusEffect(
    useCallback(() => {
      if (!initializing && currentCard) {
        refreshCurrentCard();
      }
    }, [initializing, currentCard?.id])
  );

  if (isLoading || initializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="No Session"
          description="Something went wrong. Please start a new review session."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  if (session.isComplete) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SessionComplete
          totalCards={session.originalCardIds.length}
          totalRounds={session.currentRound}
          onRestart={resetSession}
          onFinish={handleFinish}
        />
      </View>
    );
  }

  const progress = getProgress();

  if (!currentCard || !progress) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ProgressBar
          round={progress.round}
          currentPosition={progress.currentPosition}
          totalInRound={progress.totalInRound}
          correctCount={progress.correctCount}
          totalCards={progress.totalCards}
        />

        <FlashcardView
          card={currentCard}
          onCorrect={markCorrect}
          onWrong={markWrong}
          onSkip={skipCard}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </View>

      <ConfirmDialog
        visible={deleteConfirm}
        title="Delete Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
});
