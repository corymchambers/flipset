import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight } from '@/constants/theme';
import { Button } from '@/components/ui';

interface SessionCompleteProps {
  totalCards: number;
  totalRounds: number;
  onRestart: () => void;
  onFinish: () => void;
}

export function SessionComplete({
  totalCards,
  totalRounds,
  onRestart,
  onFinish,
}: SessionCompleteProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle" size={80} color={colors.success} />
      <Text style={[styles.title, { color: colors.text }]}>
        Session Complete!
      </Text>
      <Text style={[styles.stats, { color: colors.textSecondary }]}>
        You reviewed {totalCards} {totalCards === 1 ? 'card' : 'cards'} in {totalRounds} {totalRounds === 1 ? 'round' : 'rounds'}
      </Text>
      <View style={styles.buttons}>
        <Button
          title="Review Again"
          variant="secondary"
          onPress={onRestart}
          style={styles.button}
        />
        <Button
          title="Done"
          onPress={onFinish}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  stats: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    minWidth: 120,
  },
});
