import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/hooks';
import { Spacing, FontSize, FontWeight } from '@/constants/theme';
import { exportData, findImportConflicts, importData } from '@/database';
import { Button, Card } from '@/components/ui';
import { ImportConflictResolution, ExportData } from '@/types';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
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

  const handleImport = async () => {
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
      let data: ExportData;

      try {
        data = JSON.parse(content);
      } catch {
        Alert.alert('Invalid File', 'The selected file is not a valid Flipset export.');
        return;
      }

      // Validate structure
      if (!data.version || !data.categories || !data.cards) {
        Alert.alert('Invalid File', 'The selected file is not a valid Flipset export.');
        return;
      }

      // Check for conflicts
      const conflicts = await findImportConflicts(data);

      if (conflicts.length > 0) {
        // Show conflict resolution dialog
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
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Import Failed', 'An error occurred while importing your data.');
    } finally {
      setImporting(false);
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
          Export all your flashcards and categories to a JSON file that you can
          save or share.
        </Text>
        <Button
          title="Export Data"
          onPress={handleExport}
          loading={exporting}
          variant="secondary"
        />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Import Flashcards
        </Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Import flashcards from a previously exported Flipset JSON file.
        </Text>
        <Button
          title="Import Data"
          onPress={handleImport}
          loading={importing}
          variant="secondary"
        />
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
});
