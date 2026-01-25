import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/hooks';
import { getDatabase } from '@/database';

export default function RootLayout() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Initialize database on app start
    getDatabase().catch(console.error);
  }, []);

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
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="card/[id]"
          options={{
            title: 'Edit Card',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="category/new"
          options={{
            title: 'New Category',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{
            title: 'Edit Category',
            presentation: 'modal',
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
