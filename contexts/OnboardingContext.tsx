import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@flipset/onboarding_complete';

interface OnboardingContextType {
  isLoading: boolean;
  showOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  showOnboardingAgain: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      const completed = value === 'true';
      setShowOnboarding(!completed);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  }, []);

  const showOnboardingAgain = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isLoading,
        showOnboarding,
        completeOnboarding,
        showOnboardingAgain,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}
