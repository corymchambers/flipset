import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { Spacing, BorderRadius, FontSize } from '@/constants/theme';

interface RichTextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: number;
}

type FormatType = 'bold' | 'italic' | 'underline' | 'ul' | 'ol';

export function RichTextEditor({
  value,
  onChangeText,
  placeholder = 'Enter text...',
  label,
  minHeight = 150,
}: RichTextEditorProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // Convert HTML to plain text for editing
  const htmlToPlainText = (html: string): string => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n\n+/g, '\n\n')
      .trim();
  };

  // Convert plain text to simple HTML
  const plainTextToHtml = (text: string): string => {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs
      .map(p => {
        const lines = p.split('\n');
        return `<p>${lines.join('<br>')}</p>`;
      })
      .join('');
  };

  const [plainText, setPlainText] = useState(htmlToPlainText(value));

  const handleTextChange = (text: string) => {
    setPlainText(text);
    onChangeText(plainTextToHtml(text));
  };

  const wrapSelection = useCallback((tag: string, closeTag?: string) => {
    const { start, end } = selection;
    const selectedText = plainText.substring(start, end);
    const close = closeTag || tag;

    if (start === end) {
      // No selection, just insert tags
      return;
    }

    // For now, we'll convert to HTML tags
    const before = plainText.substring(0, start);
    const after = plainText.substring(end);
    const newText = `${before}<${tag}>${selectedText}</${close}>${after}`;

    setPlainText(newText);
    onChangeText(plainTextToHtml(newText));
  }, [plainText, selection, onChangeText]);

  const insertList = useCallback((ordered: boolean) => {
    const { start, end } = selection;
    const selectedText = plainText.substring(start, end);

    if (!selectedText) {
      // Insert empty list item
      const listTag = ordered ? 'ol' : 'ul';
      const newText =
        plainText.substring(0, start) +
        `\n• ` +
        plainText.substring(end);

      setPlainText(newText);
      onChangeText(plainTextToHtml(newText));
      return;
    }

    // Convert selected lines to list
    const lines = selectedText.split('\n').filter(l => l.trim());
    const prefix = ordered ? (i: number) => `${i + 1}. ` : () => '• ';
    const listText = lines.map((line, i) => prefix(i) + line.trim()).join('\n');

    const newText =
      plainText.substring(0, start) +
      '\n' + listText + '\n' +
      plainText.substring(end);

    setPlainText(newText);
    onChangeText(plainTextToHtml(newText));
  }, [plainText, selection, onChangeText]);

  const formatButtons: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    format: FormatType;
    onPress: () => void;
  }> = [
    {
      icon: 'text' as keyof typeof Ionicons.glyphMap,
      format: 'bold',
      onPress: () => wrapSelection('b'),
    },
    {
      icon: 'logo-ionic' as keyof typeof Ionicons.glyphMap,
      format: 'italic',
      onPress: () => wrapSelection('i'),
    },
    {
      icon: 'remove-outline' as keyof typeof Ionicons.glyphMap,
      format: 'underline',
      onPress: () => wrapSelection('u'),
    },
    {
      icon: 'list' as keyof typeof Ionicons.glyphMap,
      format: 'ul',
      onPress: () => insertList(false),
    },
    {
      icon: 'list-outline' as keyof typeof Ionicons.glyphMap,
      format: 'ol',
      onPress: () => insertList(true),
    },
  ];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.editorContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
          {formatButtons.map(({ icon, format, onPress }) => (
            <TouchableOpacity
              key={format}
              style={styles.toolbarButton}
              onPress={onPress}
            >
              <Ionicons name={icon} size={20} color={colors.icon} />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: colors.text, minHeight },
          ]}
          value={plainText}
          onChangeText={handleTextChange}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          textAlignVertical="top"
        />
      </View>

      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        Select text and tap a format button to apply formatting
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  editorContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  toolbarButton: {
    padding: Spacing.xs,
  },
  input: {
    padding: Spacing.md,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
  },
  hint: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
