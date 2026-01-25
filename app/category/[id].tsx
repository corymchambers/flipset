import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { Spacing } from '@/constants/theme';
import { Category } from '@/types';
import { getCategoryById, updateCategory, categoryNameExists } from '@/database';
import { Button, TextInput } from '@/components/ui';

export default function EditCategoryScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const data = await getCategoryById(id);

      if (!data) {
        Alert.alert('Error', 'Category not found.');
        router.back();
        return;
      }

      setCategory(data);
      setName(data.name);
    } catch (error) {
      console.error('Failed to load category:', error);
      Alert.alert('Error', 'Failed to load category.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateName = async (value: string): Promise<boolean> => {
    const trimmed = value.trim();

    if (!trimmed) {
      setError('Category name is required.');
      return false;
    }

    if (trimmed.length < 2) {
      setError('Category name must be at least 2 characters.');
      return false;
    }

    const exists = await categoryNameExists(trimmed, id);
    if (exists) {
      setError('A category with this name already exists.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSave = async () => {
    const isValid = await validateName(name);
    if (!isValid) return;

    try {
      setSaving(true);
      await updateCategory(id, name);
      router.back();
    } catch (error) {
      console.error('Failed to update category:', error);
      Alert.alert('Error', 'Failed to update category. Please try again.');
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
    >
      <View style={styles.content}>
        <TextInput
          label="Category Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError('');
          }}
          placeholder="Enter category name..."
          error={error}
          autoFocus
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
            disabled={!name.trim() || name === category?.name}
            style={styles.button}
          />
        </View>
      </View>
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
