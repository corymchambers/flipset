import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { SessionState, SessionOrderMode, Card } from '@/types';
import { SESSION_STORAGE_KEY } from '@/constants';
import { getCardsByCategories, getCardById } from '@/database';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Load current card when session changes
  useEffect(() => {
    if (session && !session.isComplete && session.currentRoundCards.length > 0) {
      loadCurrentCard(session.currentRoundCards[session.currentIndex]);
    } else {
      setCurrentCard(null);
    }
  }, [session?.currentIndex, session?.currentRoundCards, session?.isComplete]);

  const loadSession = async () => {
    try {
      const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionState;
        setSession(parsed);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentCard = async (cardId: string) => {
    try {
      const card = await getCardById(cardId);
      if (card) {
        setCurrentCard(card);
      }
    } catch (error) {
      console.error('Failed to load current card:', error);
    }
  };

  const saveSession = async (newSession: SessionState | null) => {
    try {
      if (newSession) {
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      } else {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      }
      setSession(newSession);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const startSession = useCallback(async (
    categoryIds: string[],
    orderMode: SessionOrderMode
  ) => {
    const cards = await getCardsByCategories(categoryIds);

    if (cards.length === 0) return null;

    let cardIds = cards.map(c => c.id);

    if (orderMode === 'random') {
      cardIds = shuffleArray(cardIds);
    }

    const newSession: SessionState = {
      id: Crypto.randomUUID(),
      originalCardIds: cards.map(c => c.id),
      currentRound: 1,
      currentIndex: 0,
      orderMode,
      correctBucket: [],
      wrongBucket: [],
      currentRoundCards: cardIds,
      isComplete: false,
      selectedCategoryIds: categoryIds,
    };

    await saveSession(newSession);
    return newSession;
  }, []);

  const markCorrect = useCallback(async () => {
    if (!session || session.isComplete) return;

    const currentCardId = session.currentRoundCards[session.currentIndex];
    const newCorrectBucket = [...session.correctBucket, currentCardId];
    const newIndex = session.currentIndex + 1;

    let updatedSession: SessionState;

    if (newIndex >= session.currentRoundCards.length) {
      // End of round
      if (session.wrongBucket.length === 0) {
        // Session complete
        updatedSession = {
          ...session,
          correctBucket: newCorrectBucket,
          isComplete: true,
        };
      } else {
        // Start new round with wrong bucket
        let newRoundCards = [...session.wrongBucket];
        if (session.orderMode === 'random') {
          newRoundCards = shuffleArray(newRoundCards);
        }

        updatedSession = {
          ...session,
          currentRound: session.currentRound + 1,
          currentIndex: 0,
          correctBucket: newCorrectBucket,
          wrongBucket: [],
          currentRoundCards: newRoundCards,
        };
      }
    } else {
      updatedSession = {
        ...session,
        currentIndex: newIndex,
        correctBucket: newCorrectBucket,
      };
    }

    await saveSession(updatedSession);
  }, [session]);

  const markWrong = useCallback(async () => {
    if (!session || session.isComplete) return;

    const currentCardId = session.currentRoundCards[session.currentIndex];
    const newWrongBucket = [...session.wrongBucket, currentCardId];
    const newIndex = session.currentIndex + 1;

    let updatedSession: SessionState;

    if (newIndex >= session.currentRoundCards.length) {
      // End of round - start new round with wrong bucket (including this card)
      let newRoundCards = [...newWrongBucket];
      if (session.orderMode === 'random') {
        newRoundCards = shuffleArray(newRoundCards);
      }

      updatedSession = {
        ...session,
        currentRound: session.currentRound + 1,
        currentIndex: 0,
        wrongBucket: [],
        currentRoundCards: newRoundCards,
      };
    } else {
      updatedSession = {
        ...session,
        currentIndex: newIndex,
        wrongBucket: newWrongBucket,
      };
    }

    await saveSession(updatedSession);
  }, [session]);

  const skipCard = useCallback(async () => {
    if (!session || session.isComplete) return;

    const currentCardId = session.currentRoundCards[session.currentIndex];
    const newRoundCards = [
      ...session.currentRoundCards.slice(0, session.currentIndex),
      ...session.currentRoundCards.slice(session.currentIndex + 1),
      currentCardId,
    ];

    const updatedSession: SessionState = {
      ...session,
      currentRoundCards: newRoundCards,
    };

    await saveSession(updatedSession);
  }, [session]);

  const resetSession = useCallback(async () => {
    if (!session) return;

    let cardIds = [...session.originalCardIds];

    if (session.orderMode === 'random') {
      cardIds = shuffleArray(cardIds);
    }

    const resetedSession: SessionState = {
      ...session,
      currentRound: 1,
      currentIndex: 0,
      correctBucket: [],
      wrongBucket: [],
      currentRoundCards: cardIds,
      isComplete: false,
    };

    await saveSession(resetedSession);
  }, [session]);

  const endSession = useCallback(async () => {
    await saveSession(null);
    setCurrentCard(null);
  }, []);

  const removeCardFromSession = useCallback(async (cardId: string) => {
    if (!session) return;

    const newOriginalCards = session.originalCardIds.filter(id => id !== cardId);
    const newCorrectBucket = session.correctBucket.filter(id => id !== cardId);
    const newWrongBucket = session.wrongBucket.filter(id => id !== cardId);
    const newCurrentRoundCards = session.currentRoundCards.filter(id => id !== cardId);

    // Adjust current index if needed
    let newIndex = session.currentIndex;
    const wasCurrentCard = session.currentRoundCards[session.currentIndex] === cardId;

    if (wasCurrentCard) {
      // Stay at same index (next card will slide in)
      if (newIndex >= newCurrentRoundCards.length) {
        newIndex = Math.max(0, newCurrentRoundCards.length - 1);
      }
    } else {
      // Adjust index if deleted card was before current
      const deletedIndex = session.currentRoundCards.indexOf(cardId);
      if (deletedIndex < session.currentIndex) {
        newIndex = session.currentIndex - 1;
      }
    }

    let updatedSession: SessionState;

    if (newCurrentRoundCards.length === 0) {
      if (newWrongBucket.length > 0) {
        // Start new round with wrong bucket
        let newRoundCards = [...newWrongBucket];
        if (session.orderMode === 'random') {
          newRoundCards = shuffleArray(newRoundCards);
        }

        updatedSession = {
          ...session,
          originalCardIds: newOriginalCards,
          currentRound: session.currentRound + 1,
          currentIndex: 0,
          correctBucket: newCorrectBucket,
          wrongBucket: [],
          currentRoundCards: newRoundCards,
        };
      } else if (newOriginalCards.length === 0) {
        // No cards left, end session
        await endSession();
        return;
      } else {
        // Session complete
        updatedSession = {
          ...session,
          originalCardIds: newOriginalCards,
          correctBucket: newCorrectBucket,
          wrongBucket: newWrongBucket,
          currentRoundCards: newCurrentRoundCards,
          isComplete: true,
        };
      }
    } else {
      updatedSession = {
        ...session,
        originalCardIds: newOriginalCards,
        currentIndex: newIndex,
        correctBucket: newCorrectBucket,
        wrongBucket: newWrongBucket,
        currentRoundCards: newCurrentRoundCards,
      };
    }

    await saveSession(updatedSession);
  }, [session, endSession]);

  const refreshCurrentCard = useCallback(async () => {
    if (session && !session.isComplete && session.currentRoundCards.length > 0) {
      await loadCurrentCard(session.currentRoundCards[session.currentIndex]);
    }
  }, [session]);

  const getProgress = useCallback(() => {
    if (!session) return null;

    const totalInRound = session.currentRoundCards.length;
    const currentPosition = session.currentIndex + 1;
    const totalCards = session.originalCardIds.length;
    const correctCount = session.correctBucket.length;

    return {
      round: session.currentRound,
      currentPosition,
      totalInRound,
      totalCards,
      correctCount,
      remainingInSession: totalCards - correctCount,
    };
  }, [session]);

  return {
    session,
    currentCard,
    isLoading,
    hasActiveSession: session !== null && !session.isComplete,
    startSession,
    markCorrect,
    markWrong,
    skipCard,
    resetSession,
    endSession,
    removeCardFromSession,
    refreshCurrentCard,
    getProgress,
  };
}
