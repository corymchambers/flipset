import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface ProgressBarProps {
  round: number;
  currentPosition: number;
  totalInRound: number;
  correctCount: number;
  totalCards: number;
}

export function ProgressBar({
  round,
  currentPosition,
  totalInRound,
  correctCount,
  totalCards,
}: ProgressBarProps) {
  const { colors } = useTheme();

  const progressPercent = totalCards > 0 ? (correctCount / totalCards) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <Text style={[styles.roundText, { color: colors.textSecondary }]}>
          Round {round}
        </Text>
        <Text style={[styles.positionText, { color: colors.text }]}>
          {currentPosition} of {totalInRound}
        </Text>
        <Text style={[styles.totalText, { color: colors.textTertiary }]}>
          {correctCount}/{totalCards} correct
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.success,
              width: `${progressPercent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  roundText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  positionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  totalText: {
    fontSize: FontSize.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
