import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput as RNTextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { exportData, findImportConflicts, importData } from '@/database';
import { Button, Card } from '@/components/ui';
import { ImportConflictResolution, ExportData } from '@/types';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  const validateExportData = (data: unknown): { valid: boolean; error?: string } => {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid JSON structure' };
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.version !== 'number') {
      return { valid: false, error: 'Missing or invalid "version" field' };
    }

    if (!Array.isArray(obj.categories)) {
      return { valid: false, error: 'Missing or invalid "categories" array' };
    }

    if (!Array.isArray(obj.cards)) {
      return { valid: false, error: 'Missing or invalid "cards" array' };
    }

    for (let i = 0; i < obj.categories.length; i++) {
      const cat = obj.categories[i] as Record<string, unknown>;
      if (!cat.id || !cat.name) {
        return { valid: false, error: `Category at index ${i} is missing "id" or "name"` };
      }
    }

    for (let i = 0; i < obj.cards.length; i++) {
      const card = obj.cards[i] as Record<string, unknown>;
      if (!card.id) {
        return { valid: false, error: `Card at index ${i} is missing "id"` };
      }
      if (typeof card.front_content !== 'string') {
        return { valid: false, error: `Card at index ${i} is missing "front_content"` };
      }
      if (typeof card.back_content !== 'string') {
        return { valid: false, error: `Card at index ${i} is missing "back_content"` };
      }
      if (!Array.isArray(card.category_ids)) {
        return { valid: false, error: `Card at index ${i} is missing "category_ids" array` };
      }
    }

    return { valid: true };
  };

  const handleExportFile = async () => {
    try {
      setExporting(true);

      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const filename = `flipset-export-${new Date().toISOString().split('T')[0]}.json`;
      const file = new File(Paths.cache, filename);

      await file.write(json);

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Flashcards',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Export Complete', `File saved to: ${file.uri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'An error occurred while exporting your data.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCopy = async () => {
    try {
      setExporting(true);

      const data = await exportData();
      const json = JSON.stringify(data, null, 2);

      await Clipboard.setStringAsync(json);
      Alert.alert('Copied', 'Export data copied to clipboard.');
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'An error occurred while exporting your data.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async () => {
    try {
      setImporting(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const pickedFile = result.assets[0];
      const importFile = new File(pickedFile.uri);
      const content = await importFile.text();

      await processImport(content);
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Import Failed', 'An error occurred while importing your data.');
    } finally {
      setImporting(false);
    }
  };

  const openPasteModal = () => {
    setPasteContent('');
    setPasteModalVisible(true);
  };

  const handlePasteImport = async () => {
    if (!pasteContent.trim()) {
      Alert.alert('Empty', 'Please paste your JSON data first.');
      return;
    }

    setPasteModalVisible(false);
    setImporting(true);

    try {
      await processImport(pasteContent);
    } finally {
      setImporting(false);
      setPasteContent('');
    }
  };

  const processImport = async (content: string) => {
    let data: ExportData;

    try {
      data = JSON.parse(content);
    } catch {
      Alert.alert('Invalid JSON', 'The data is not valid JSON. Please check the format and try again.');
      return;
    }

    const validation = validateExportData(data);
    if (!validation.valid) {
      Alert.alert('Invalid Data', validation.error || 'The data format is incorrect.');
      return;
    }

    const conflicts = await findImportConflicts(data);

    if (conflicts.length > 0) {
      Alert.alert(
        'Category Conflicts',
        `The following categories already exist: ${conflicts.join(', ')}. What would you like to do?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Merge Cards',
            onPress: () => doImport(data, conflicts, 'merge'),
          },
          {
            text: 'Overwrite',
            style: 'destructive',
            onPress: () => doImport(data, conflicts, 'overwrite'),
          },
        ]
      );
    } else {
      await doImport(data, [], 'merge');
    }
  };

  const doImport = async (
    data: ExportData,
    conflicts: string[],
    resolution: ImportConflictResolution
  ) => {
    try {
      const resolutionMap = new Map<string, ImportConflictResolution>();
      conflicts.forEach(name => resolutionMap.set(name, resolution));

      const result = await importData(data, resolutionMap);

      Alert.alert(
        'Import Complete',
        `Imported ${result.cardsImported} cards and ${result.categoriesImported} new categories.`
      );
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Import Failed', 'An error occurred while importing your data.');
    }
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Data Management
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Export Flashcards
          </Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Export all your flashcards and categories as JSON.
          </Text>
          <View style={styles.buttonRow}>
            <Button
              title="Share File"
              onPress={handleExportFile}
              loading={exporting}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title="Copy JSON"
              onPress={handleExportCopy}
              loading={exporting}
              variant="secondary"
              style={styles.button}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Import Flashcards
          </Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Import flashcards from a JSON file or paste JSON data.
          </Text>
          <View style={styles.buttonRow}>
            <Button
              title="Choose File"
              onPress={handleImportFile}
              loading={importing}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title="Paste JSON"
              onPress={openPasteModal}
              loading={importing}
              variant="secondary"
              style={styles.button}
            />
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          About
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Flipset
          </Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            A simple, offline-first flashcard app for effective learning.
          </Text>
        </Card>
      </ScrollView>

      <Modal
        visible={pasteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasteModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setPasteModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Paste JSON</Text>
            <TouchableOpacity onPress={handlePasteImport}>
              <Text style={[styles.modalImport, { color: colors.primary }]}>Import</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Text style={[styles.modalInstructions, { color: colors.textSecondary }]}>
              Paste your Flipset export JSON below:
            </Text>
            <RNTextInput
              style={[
                styles.pasteInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={pasteContent}
              onChangeText={setPasteContent}
              placeholder="Paste JSON here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    lineHeight: FontSize.sm * 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  modalCancel: {
    fontSize: FontSize.md,
  },
  modalImport: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  modalInstructions: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  pasteInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
