import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { EnrichedTextInput } from 'react-native-enriched';
import type { EnrichedTextInputInstance, OnChangeStateEvent } from 'react-native-enriched';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

interface RichTextEditorModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onSave: (html: string) => void;
  onCancel: () => void;
}

export function RichTextEditorModal({
  visible,
  title,
  initialValue = '',
  placeholder = 'Enter text...',
  onSave,
  onCancel,
}: RichTextEditorModalProps) {
  const { colors } = useTheme();
  const editorRef = useRef<EnrichedTextInputInstance>(null);
  const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(null);

  useEffect(() => {
    if (visible && initialValue && editorRef.current) {
      // Small delay to ensure the editor is ready
      setTimeout(() => {
        editorRef.current?.setValue(initialValue);
      }, 100);
    }
  }, [visible, initialValue]);

  const handleSave = async () => {
    const html = await editorRef.current?.getHTML();
    onSave(html || '');
  };

  const toolbarButtons = [
    {
      label: 'B',
      active: stylesState?.bold?.isActive,
      onPress: () => editorRef.current?.toggleBold(),
      style: { fontWeight: '700' as const },
    },
    {
      label: 'I',
      active: stylesState?.italic?.isActive,
      onPress: () => editorRef.current?.toggleItalic(),
      style: { fontStyle: 'italic' as const },
    },
    {
      label: 'U',
      active: stylesState?.underline?.isActive,
      onPress: () => editorRef.current?.toggleUnderline(),
      style: { textDecorationLine: 'underline' as const },
    },
    {
      label: '•',
      active: stylesState?.unorderedList?.isActive,
      onPress: () => editorRef.current?.toggleUnorderedList(),
    },
    {
      label: '1.',
      active: stylesState?.orderedList?.isActive,
      onPress: () => editorRef.current?.toggleOrderedList(),
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {toolbarButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.toolbarButton,
                button.active && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={button.onPress}
            >
              <Text
                style={[
                  styles.toolbarButtonText,
                  { color: button.active ? colors.primary : colors.icon },
                  button.style,
                ]}
              >
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Editor */}
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <EnrichedTextInput
            ref={editorRef}
            style={{
              ...styles.editor,
              color: colors.text,
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            onChangeState={(e) => setStylesState(e.nativeEvent)}
            autoFocus
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  cancelText: {
    fontSize: FontSize.md,
  },
  saveText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    textAlign: 'right',
  },
  toolbar: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  toolbarButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  toolbarButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
  },
  editor: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSize.md,
    textAlignVertical: 'top',
  },
});
