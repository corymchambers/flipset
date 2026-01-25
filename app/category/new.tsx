import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { Spacing } from '@/constants/theme';
import { createCategory, categoryNameExists } from '@/database';
import { Button, TextInput } from '@/components/ui';

export default function NewCategoryScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

    const exists = await categoryNameExists(trimmed);
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
      await createCategory(name);
      router.back();
    } catch (error) {
      console.error('Failed to create category:', error);
      Alert.alert('Error', 'Failed to create category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
            title="Create Category"
            onPress={handleSave}
            loading={saving}
            disabled={!name.trim()}
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
