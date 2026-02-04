import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, OnboardingProvider, useOnboardingContext, ReviewPromptProvider } from '@/contexts';
import { useTheme } from '@/hooks';
import { getDatabase } from '@/database';
import { OnboardingScreen } from '@/components/onboarding';

function AppContent() {
  const { colors, isDark } = useTheme();
  const { isLoading, showOnboarding, completeOnboarding } = useOnboardingContext();

  useEffect(() => {
    // Initialize database on app start
    getDatabase().catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen onComplete={completeOnboarding} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="card/new"
          options={{
            title: 'New Card',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="card/[id]"
          options={{
            title: 'Edit Card',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="category/new"
          options={{
            title: 'New Category',
            presentation: 'pageSheet',
          }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{
            title: 'Edit Category',
            presentation: 'pageSheet',
          }}
        />
        <Stack.Screen
          name="review/session"
          options={{
            title: 'Review Session',
            headerBackTitle: 'Exit',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <ReviewPromptProvider>
          <AppContent />
        </ReviewPromptProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
