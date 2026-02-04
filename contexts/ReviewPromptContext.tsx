import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_STATE_KEY = '@flipset/review_state';

interface ReviewState {
  hasReviewed: boolean; // User left a review - never ask again
  hasDeclined: boolean; // User said "Not really" - never ask again
  lastPromptDate: string | null; // For 30-day cooldown after "Not now"
}

interface ReviewPromptContextType {
  shouldShowReviewPrompt: boolean;
  triggerReviewPrompt: () => void;
  handleYesResponse: () => void;
  handleNotReallyResponse: () => void;
  handleNotNowResponse: () => Promise<void>;
  handleReviewComplete: () => Promise<void>;
  dismissPrompt: () => void;
  showFeedbackForm: () => void;
  hideFeedbackForm: () => void;
  isFeedbackFormVisible: boolean;
}

const ReviewPromptContext = createContext<ReviewPromptContextType | null>(null);

const COOLDOWN_DAYS = 30;

export function ReviewPromptProvider({ children }: { children: ReactNode }) {
  const [reviewState, setReviewState] = useState<ReviewState>({
    hasReviewed: false,
    hasDeclined: false,
    lastPromptDate: null,
  });
  const [shouldShowReviewPrompt, setShouldShowReviewPrompt] = useState(false);
  const [isFeedbackFormVisible, setIsFeedbackFormVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stateJson = await AsyncStorage.getItem(REVIEW_STATE_KEY);
      if (stateJson) {
        setReviewState(JSON.parse(stateJson));
      }
    } catch (e) {
      console.error('Failed to load review state:', e);
    }
    setIsLoaded(true);
  };

  const saveReviewState = async (state: ReviewState) => {
    setReviewState(state);
    await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state));
  };

  const checkCanShowPrompt = useCallback(
    (state: ReviewState): boolean => {
      // Never show if user declined ("Not really")
      if (state.hasDeclined) return false;

      // Never show if user already left a review
      if (state.hasReviewed) return false;

      // Check 30-day cooldown after "Not now"
      if (state.lastPromptDate) {
        const lastDate = new Date(state.lastPromptDate);
        const now = new Date();
        const daysSincePrompt = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSincePrompt < COOLDOWN_DAYS) return false;
      }

      return true;
    },
    []
  );

  // Called when user completes a review session
  const triggerReviewPrompt = useCallback(() => {
    if (!isLoaded) return;

    if (checkCanShowPrompt(reviewState)) {
      setShouldShowReviewPrompt(true);
    }
  }, [isLoaded, reviewState, checkCanShowPrompt]);

  const handleYesResponse = () => {
    // User likes the app - will show follow-up prompt
    // Don't mark as reviewed yet, wait for final action
  };

  const handleNotReallyResponse = () => {
    // User doesn't like it - never ask again
    const newState = { ...reviewState, hasDeclined: true };
    saveReviewState(newState);
  };

  const handleNotNowResponse = async () => {
    // User selected "Not now" - 30 day cooldown
    const newState = {
      ...reviewState,
      lastPromptDate: new Date().toISOString(),
    };
    await saveReviewState(newState);
    setShouldShowReviewPrompt(false);
  };

  const handleReviewComplete = async () => {
    // User completed the review flow (tapped "Leave a review")
    const newState = { ...reviewState, hasReviewed: true };
    await saveReviewState(newState);
    setShouldShowReviewPrompt(false);
  };

  const dismissPrompt = () => {
    setShouldShowReviewPrompt(false);
  };

  const showFeedbackForm = () => {
    setIsFeedbackFormVisible(true);
  };

  const hideFeedbackForm = () => {
    setIsFeedbackFormVisible(false);
  };

  return (
    <ReviewPromptContext.Provider
      value={{
        shouldShowReviewPrompt,
        triggerReviewPrompt,
        handleYesResponse,
        handleNotReallyResponse,
        handleNotNowResponse,
        handleReviewComplete,
        dismissPrompt,
        showFeedbackForm,
        hideFeedbackForm,
        isFeedbackFormVisible,
      }}
    >
      {children}
    </ReviewPromptContext.Provider>
  );
}

export function useReviewPrompt() {
  const context = useContext(ReviewPromptContext);
  if (!context) {
    throw new Error('useReviewPrompt must be used within ReviewPromptProvider');
  }
  return context;
}
