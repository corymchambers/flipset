import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import { useTheme } from '@/hooks';
import { useReviewPrompt } from '@/contexts';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { FeedbackForm } from './FeedbackForm';

type Step = 'initial' | 'positive' | 'negative' | 'feedback';

interface ReviewPromptProps {
  visible: boolean;
}

export function ReviewPrompt({ visible }: ReviewPromptProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('initial');

  const {
    handleYesResponse,
    handleNotReallyResponse,
    handleNotNowResponse,
    handleReviewComplete,
    dismissPrompt,
  } = useReviewPrompt();

  const resetAndClose = () => {
    setStep('initial');
    dismissPrompt();
  };

  const onYesPress = () => {
    handleYesResponse();
    setStep('positive');
  };

  const onNotReallyPress = () => {
    handleNotReallyResponse();
    setStep('negative');
  };

  const onLeaveReviewPress = async () => {
    await handleReviewComplete();
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
    resetAndClose();
  };

  const onNotNowPress = async () => {
    await handleNotNowResponse();
    resetAndClose();
  };

  const onSendFeedbackPress = () => {
    setStep('feedback');
  };

  const onNoThanksPress = () => {
    resetAndClose();
  };

  // Feedback form step
  if (step === 'feedback') {
    return (
      <FeedbackForm
        visible={visible}
        onClose={resetAndClose}
        title="Share your feedback"
        description="What could we do better?"
      />
    );
  }

  // Initial prompt: "Are you enjoying Flipset?"
  if (step === 'initial') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Are you enjoying Flipset?
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.background }]}
                onPress={onNotReallyPress}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>
                  Not really
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onYesPress}
              >
                <Text style={styles.buttonText}>Yes, I like it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Positive path: "Would you mind leaving a quick review?"
  if (step === 'positive') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              That's great to hear!
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Would you mind leaving a quick review? It really helps.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.background }]}
                onPress={onNotNowPress}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>
                  Not now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onLeaveReviewPress}
              >
                <Text style={styles.buttonText}>Leave a review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Negative path: "Want to share what's not working?"
  if (step === 'negative') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Thanks for telling us
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Want to share what's not working?
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.background }]}
                onPress={onNoThanksPress}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>
                  No thanks
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onSendFeedbackPress}
              >
                <Text style={styles.buttonText}>Send feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonSecondary: {},
  buttonText: {
    color: '#0a0a0a',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  buttonSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
