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
  Alert,
  ActionSheetIOS,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnrichedTextInput } from 'react-native-enriched';
import type { EnrichedTextInputInstance, OnChangeStateEvent } from 'react-native-enriched';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage } from 'expo-text-extractor';
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

  const appendTextToEditor = async (text: string) => {
    if (!editorRef.current) return;

    const currentHtml = await editorRef.current.getHTML();

    if (!currentHtml || currentHtml === '<p></p>' || currentHtml.trim() === '') {
      editorRef.current.setValue(`<p>${text}</p>`);
    } else {
      let newHtml = currentHtml;
      if (newHtml.endsWith('</html>')) {
        newHtml = newHtml.slice(0, -7);
      }
      if (newHtml.endsWith('</p>')) {
        newHtml = newHtml.slice(0, -4) + ' ' + text + '</p>';
      } else {
        newHtml = newHtml + ' ' + text;
      }
      if (currentHtml.endsWith('</html>')) {
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
      // Android: use Alert with buttons
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
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is needed to select images.');
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        quality: 1,
      };

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;
      await processImageOCR(imageUri);
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const processImageOCR = async (imageUri: string) => {
    setIsProcessingImage(true);

    try {
      const results = await extractTextFromImage(imageUri);
      const extractedText = results.join(' ').trim();

      if (!extractedText) {
        Alert.alert('No Text Found', 'No text was detected in the image.');
        return;
      }

      await appendTextToEditor(extractedText);
    } catch (error) {
      console.error('OCR error:', error);
      Alert.alert('Error', 'Failed to extract text from image');
    } finally {
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
