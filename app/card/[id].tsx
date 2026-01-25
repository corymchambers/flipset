import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { Spacing } from '@/constants/theme';
import { Category, CardWithCategories } from '@/types';
import { getCardById, updateCard, getAllCategories } from '@/database';
import { Button } from '@/components/ui';
import { RichTextEditor } from '@/components/editor';
import { CategoryPicker } from '@/components/categories';
import { UNCATEGORIZED_ID } from '@/constants';

export default function EditCardScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<CardWithCategories | null>(null);
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [cardData, categoriesData] = await Promise.all([
        getCardById(id),
        getAllCategories(),
      ]);

      if (!cardData) {
        Alert.alert('Error', 'Card not found.');
        router.back();
        return;
      }

      setCard(cardData);
      setFrontContent(cardData.front_content);
      setBackContent(cardData.back_content);
      setSelectedCategories(cardData.categories.map(c => c.id));
      setCategories(categoriesData.filter(c => c.id !== UNCATEGORIZED_ID));
    } catch (error) {
      console.error('Failed to load card:', error);
      Alert.alert('Error', 'Failed to load card.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(cid => cid !== categoryId)
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
      await updateCard(id, frontContent, backContent, selectedCategories);
      router.back();
    } catch (error) {
      console.error('Failed to update card:', error);
      Alert.alert('Error', 'Failed to update card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
            title="Save Changes"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
