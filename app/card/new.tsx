import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { Spacing } from '@/constants/theme';
import { Category } from '@/types';
import { createCard, getAllCategories } from '@/database';
import { Button } from '@/components/ui';
import { RichTextEditor } from '@/components/editor';
import { CategoryPicker } from '@/components/categories';
import { UNCATEGORIZED_ID } from '@/constants';

export default function NewCardScreen() {
  const { colors } = useTheme();
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data.filter(c => c.id !== UNCATEGORIZED_ID));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    if (!frontContent.trim()) {
      Alert.alert('Error', 'Please enter content for the front of the card.');
      return;
    }

    try {
      setSaving(true);
      await createCard(frontContent, backContent, selectedCategories);
      router.back();
    } catch (error) {
      console.error('Failed to create card:', error);
      Alert.alert('Error', 'Failed to create card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <RichTextEditor
          label="Front (Term)"
          value={frontContent}
          onChangeText={setFrontContent}
          placeholder="Enter the term or question..."
          minHeight={120}
        />

        <RichTextEditor
          label="Back (Definition)"
          value={backContent}
          onChangeText={setBackContent}
          placeholder="Enter the definition or answer..."
          minHeight={120}
        />

        <CategoryPicker
          label="Categories"
          categories={categories}
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
        />

        <View style={styles.buttons}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.button}
          />
          <Button
            title="Save Card"
            onPress={handleSave}
            loading={saving}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    flex: 1,
  },
});
