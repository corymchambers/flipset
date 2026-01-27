import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks';
import { Spacing } from '@/constants/theme';
import { Category, CardWithCategories } from '@/types';
import { createCard, updateCard, getCardById, getAllCategories } from '@/database';
import { Button } from '@/components/ui';
import { EditableRichTextField, RichTextEditorModal } from '@/components/editor';
import { CategoryPicker } from '@/components/categories';
import { UNCATEGORIZED_ID } from '@/constants';

type EditingField = 'front' | 'back' | null;

interface CardFormProps {
  cardId?: string;
}

export function CardForm({ cardId }: CardFormProps) {
  const { colors } = useTheme();
  const isEditing = !!cardId;

  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [categoryIdsBeforeAdd, setCategoryIdsBeforeAdd] = useState<string[] | null>(null);

  useEffect(() => {
    loadData();
  }, [cardId]);

  // Refresh categories when returning from add category screen
  useFocusEffect(
    useCallback(() => {
      const refreshCategories = async () => {
        const categoriesData = await getAllCategories();
        const filteredCategories = categoriesData.filter(c => c.id !== UNCATEGORIZED_ID);

        // Auto-select newly created category
        if (categoryIdsBeforeAdd !== null) {
          const newCategory = filteredCategories.find(
            c => !categoryIdsBeforeAdd.includes(c.id)
          );
          if (newCategory) {
            setSelectedCategories(prev => [...prev, newCategory.id]);
          }
          setCategoryIdsBeforeAdd(null);
        }

        setCategories(filteredCategories);
      };
      refreshCategories();
    }, [categoryIdsBeforeAdd])
  );

  const handleAddCategory = () => {
    setCategoryIdsBeforeAdd(categories.map(c => c.id));
    router.push('/category/new');
  };

  const loadData = async () => {
    try {
      if (isEditing) {
        setLoading(true);
        const [cardData, categoriesData] = await Promise.all([
          getCardById(cardId),
          getAllCategories(),
        ]);

        if (!cardData) {
          Alert.alert('Error', 'Card not found.');
          router.back();
          return;
        }

        setFrontContent(cardData.front_content);
        setBackContent(cardData.back_content);
        setSelectedCategories(cardData.categories.map(c => c.id));
        setCategories(categoriesData.filter(c => c.id !== UNCATEGORIZED_ID));
      } else {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData.filter(c => c.id !== UNCATEGORIZED_ID));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      if (isEditing) {
        Alert.alert('Error', 'Failed to load card.');
        router.back();
      }
    } finally {
      setLoading(false);
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
    if (!frontContent.trim() || frontContent === '<p></p>') {
      Alert.alert('Error', 'Please enter content for the front of the card.');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await updateCard(cardId, frontContent, backContent, selectedCategories);
      } else {
        await createCard(frontContent, backContent, selectedCategories);
      }
      router.back();
    } catch (error) {
      console.error('Failed to save card:', error);
      Alert.alert('Error', 'Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditorSave = (html: string) => {
    if (editingField === 'front') {
      setFrontContent(html);
    } else if (editingField === 'back') {
      setBackContent(html);
    }
    setEditingField(null);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <EditableRichTextField
          label="Front (Term)"
          content={frontContent}
          placeholder="Tap to add the term or question..."
          onEdit={() => setEditingField('front')}
        />

        <EditableRichTextField
          label="Back (Definition)"
          content={backContent}
          placeholder="Tap to add the definition or answer..."
          onEdit={() => setEditingField('back')}
        />

        <CategoryPicker
          label="Categories"
          categories={categories}
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
          onAddCategory={handleAddCategory}
        />

        <View style={styles.buttons}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.button}
          />
          <Button
            title={isEditing ? 'Save Changes' : 'Save Card'}
            onPress={handleSave}
            loading={saving}
            style={styles.button}
          />
        </View>
      </ScrollView>

      <RichTextEditorModal
        visible={editingField !== null}
        title={editingField === 'front' ? 'Front (Term)' : 'Back (Definition)'}
        initialValue={editingField === 'front' ? frontContent : backContent}
        placeholder={editingField === 'front' ? 'Enter the term or question...' : 'Enter the definition or answer...'}
        onSave={handleEditorSave}
        onCancel={() => setEditingField(null)}
      />
    </>
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
