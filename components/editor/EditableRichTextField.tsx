import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { RichTextRenderer } from './RichTextRenderer';

interface EditableRichTextFieldProps {
  label: string;
  content: string;
  placeholder?: string;
  onEdit: () => void;
}

export function EditableRichTextField({
  label,
  content,
  placeholder = 'Tap to add content...',
  onEdit,
}: EditableRichTextFieldProps) {
  const { colors } = useTheme();
  const hasContent = content && content.trim() !== '' && content !== '<p></p>';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.contentContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        {hasContent ? (
          <View style={styles.contentWrapper}>
            <View style={styles.renderedContent}>
              <RichTextRenderer content={content} />
            </View>
            <View style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </View>
          </View>
        ) : (
          <View style={styles.placeholderWrapper}>
            <Text style={[styles.placeholder, { color: colors.textTertiary }]}>
              {placeholder}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  contentContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    minHeight: 80,
    padding: Spacing.md,
  },
  contentWrapper: {
    flexDirection: 'row',
  },
  renderedContent: {
    flex: 1,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  placeholderWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: FontSize.md,
    fontStyle: 'italic',
  },
});
