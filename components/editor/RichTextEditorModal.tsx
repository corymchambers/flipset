import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EnrichedTextInput } from 'react-native-enriched';
import type { EnrichedTextInputInstance, OnChangeStateEvent } from 'react-native-enriched';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as ExpoImagePicker from 'expo-image-picker';
import ExpoImageCropTool from '@bsky.app/expo-image-crop-tool';
import TextRecognition from '@react-native-ml-kit/text-recognition';
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
  const [isListening, setIsListening] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (visible && initialValue && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.setValue(initialValue);
      }, 100);
    }
  }, [visible, initialValue]);

  // Stop listening when modal closes
  useEffect(() => {
    if (!visible && isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    }
  }, [visible, isListening]);

  useSpeechRecognitionEvent('result', async (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript && event.isFinal && editorRef.current) {
      await appendTextToEditor(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    if (event.error !== 'no-speech') {
      Alert.alert('Speech Error', event.message || 'An error occurred');
    }
  });

  const appendParagraphsToEditor = async (htmlParagraphs: string) => {
    if (!editorRef.current) return;

    const currentHtml = await editorRef.current.getHTML();

    if (!currentHtml || currentHtml === '<p></p>' || currentHtml.trim() === '') {
      editorRef.current.setValue(htmlParagraphs);
    } else {
      let newHtml = currentHtml;

      // Remove </html> wrapper if present
      const hasHtmlWrapper = newHtml.endsWith('</html>');
      if (hasHtmlWrapper) {
        newHtml = newHtml.slice(0, -7);
      }

      // Add the new paragraphs at the end (before </html> if it existed)
      newHtml = newHtml.trimEnd() + '\n' + htmlParagraphs;

      if (hasHtmlWrapper) {
        newHtml += '</html>';
      }

      editorRef.current.setValue(newHtml);
    }
  };

  const appendTextToEditor = async (text: string) => {
    if (!editorRef.current) return;

    const currentHtml = await editorRef.current.getHTML();

    if (!currentHtml || currentHtml === '<p></p>' || currentHtml.trim() === '') {
      editorRef.current.setValue(`<p>${text}</p>`);
    } else {
      let newHtml = currentHtml;

      // Remove </html> wrapper if present
      const hasHtmlWrapper = newHtml.endsWith('</html>');
      if (hasHtmlWrapper) {
        newHtml = newHtml.slice(0, -7);
      }

      // Find the last block-level closing tag (may have <br>, whitespace after it)
      const blockTagMatch = newHtml.match(/<\/(p|h[1-6]|li|div|blockquote)>(?:\s|<br\s*\/?>)*/i);
      if (blockTagMatch) {
        // Find where the closing tag starts (not the trailing whitespace/br)
        const closeTagOnly = `</${blockTagMatch[1]}>`;
        const insertPos = newHtml.lastIndexOf(closeTagOnly);
        newHtml = newHtml.slice(0, insertPos) + ' ' + text + newHtml.slice(insertPos);
      } else {
        // Fallback: wrap in a new paragraph
        newHtml = newHtml + `<p>${text}</p>`;
      }

      // Restore </html> wrapper if it was there
      if (hasHtmlWrapper) {
        newHtml += '</html>';
      }

      editorRef.current.setValue(newHtml);
    }
  };

  const handleSave = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
    }
    const html = await editorRef.current?.getHTML();
    onSave(html || '');
  };

  const handleMicPress = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      return;
    }

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is needed for voice input. Please enable it in Settings.'
      );
      return;
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        continuous: false,
      });
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      Alert.alert('Error', 'Failed to start voice input');
    }
  };

  const handleImagePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage('camera');
          } else if (buttonIndex === 2) {
            pickImage('library');
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose an image source',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Library', onPress: () => pickImage('library') },
        ]
      );
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Pick image without editing first
      const options: ExpoImagePicker.ImagePickerOptions = {
        allowsEditing: false,
        quality: 1,
      };

      const result = source === 'camera'
        ? await ExpoImagePicker.launchCameraAsync(options)
        : await ExpoImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]?.uri) {
        // Crop with Bluesky tool for flexible cropping with drag handles
        const cropped = await ExpoImageCropTool.openCropperAsync({
          imageUri: result.assets[0].uri,
          format: 'jpeg',
          compressImageQuality: 1,
        });

        if (cropped?.path) {
          await processImageOCR(cropped.path);
        }
      }
    } catch (error: any) {
      console.error('Image crop error:', error);
      Alert.alert('Error', 'Failed to crop image');
    }
  };

  const processImageOCR = async (imageUri: string) => {
    setIsProcessingImage(true);

    try {
      // Use ML Kit for both platforms
      const uri = !imageUri.startsWith('file://')
        ? `file://${imageUri}`
        : imageUri;
      const result = await TextRecognition.recognize(uri);

      const lines: string[] = [];
      for (const block of result.blocks) {
        for (const line of block.lines) {
          const trimmed = line.text.trim();
          if (trimmed) {
            lines.push(trimmed);
          }
        }
      }

      if (!lines.length) {
        Alert.alert('No Text Found', 'No text was detected in the image.');
        setIsProcessingImage(false);
        return;
      }

      // If only one line, just add it directly
      if (lines.length === 1) {
        await appendTextToEditor(lines[0]);
        setIsProcessingImage(false);
        return;
      }

      // Multiple lines - ask user how to handle
      setIsProcessingImage(false);
      Alert.alert(
        'Multiple Lines Detected',
        'How would you like to add the text?',
        [
          {
            text: 'Keep Line Breaks',
            onPress: async () => {
              // Create separate paragraphs for each line
              const paragraphs = lines
                .map(r => `<p>${r}</p>`)
                .join('');
              await appendParagraphsToEditor(paragraphs);
            },
          },
          {
            text: 'Combine into One Line',
            onPress: async () => {
              const combinedText = lines.join(' ');
              await appendTextToEditor(combinedText);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('OCR error:', error);
      Alert.alert('Error', 'Failed to extract text from image');
      setIsProcessingImage(false);
    }
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

          <View style={styles.toolbarSpacer} />

          {/* Image/OCR button */}
          <TouchableOpacity
            style={[styles.toolbarButton, styles.iconButton]}
            onPress={handleImagePress}
            disabled={isProcessingImage}
          >
            <Ionicons
              name="camera-outline"
              size={22}
              color={colors.icon}
            />
          </TouchableOpacity>

          {/* Microphone button */}
          <TouchableOpacity
            style={[
              styles.toolbarButton,
              styles.iconButton,
              isListening && { backgroundColor: colors.error + '20' },
            ]}
            onPress={handleMicPress}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={22}
              color={isListening ? colors.error : colors.icon}
            />
          </TouchableOpacity>
        </View>

        {/* Status indicators */}
        {isListening && (
          <View style={[styles.statusBar, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="radio" size={16} color={colors.error} />
            <Text style={[styles.statusText, { color: colors.error }]}>
              Listening...
            </Text>
          </View>
        )}

        {isProcessingImage && (
          <View style={[styles.statusBar, { backgroundColor: colors.primary + '15' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.primary }]}>
              Extracting text...
            </Text>
          </View>
        )}

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
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 1,
  },
  toolbarButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 32,
    alignItems: 'center',
  },
  toolbarButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  toolbarSpacer: {
    flex: 1,
  },
  iconButton: {
    paddingHorizontal: Spacing.sm,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
