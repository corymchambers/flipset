import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

const WEB3FORMS_KEY = process.env.EXPO_PUBLIC_WEB3FORMS_KEY;

interface FeedbackFormProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function FeedbackForm({
  visible,
  onClose,
  title = 'Share your feedback',
  description = 'What could we do better?',
}: FeedbackFormProps) {
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setIsSending(true);
    try {
      if (WEB3FORMS_KEY) {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: 'Flipset Feedback',
            from_name: 'Flipset App',
            email: userEmail.trim() || 'no-reply@flipset.app',
            message: feedback.trim(),
          }),
        });
      } else {
        console.log('Feedback submitted (no API key):', {
          feedback: feedback.trim(),
          userEmail: userEmail.trim() || null,
        });
      }
      setFeedbackSent(true);
    } catch (e) {
      console.error('Failed to send feedback:', e);
      setFeedbackSent(true);
    }
    setIsSending(false);
  };

  const handleClose = () => {
    setFeedback('');
    setUserEmail('');
    setFeedbackSent(false);
    onClose();
  };

  if (feedbackSent) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>Thank you!</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Your feedback helps us improve Flipset.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
          <TextInput
            style={[
              styles.feedbackInput,
              { backgroundColor: colors.background, color: colors.text },
            ]}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Tell us what's on your mind..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TextInput
            style={[
              styles.emailInput,
              { backgroundColor: colors.background, color: colors.text },
            ]}
            value={userEmail}
            onChangeText={setUserEmail}
            placeholder="Your email (optional)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.background }]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                (!feedback.trim() || isSending) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!feedback.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#0a0a0a" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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
    paddingBottom: 56,
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
  feedbackInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    minHeight: 100,
    marginBottom: Spacing.md,
  },
  emailInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  buttonSecondary: {},
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#0a0a0a',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  doneButton: {
    marginTop: Spacing.md,
  },
  buttonSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
