import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { Button, RadioButton } from '@/components/ui';
import { Category } from '@/types';
import { UNCATEGORIZED_ID } from '@/constants';

type DeleteOption = 'delete' | 'move' | 'uncategorize';

interface DeleteCategoryDialogProps {
  visible: boolean;
  categoryName: string;
  cardCount: number;
  availableCategories: Category[];
  onConfirm: (action: DeleteOption, targetCategoryId?: string) => void;
  onCancel: () => void;
}

export function DeleteCategoryDialog({
  visible,
  categoryName,
  cardCount,
  availableCategories,
  onConfirm,
  onCancel,
}: DeleteCategoryDialogProps) {
  const { colors } = useTheme();
  const [selectedOption, setSelectedOption] = useState<DeleteOption>('uncategorize');
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);

  const otherCategories = availableCategories.filter(
    c => c.id !== UNCATEGORIZED_ID && c.name !== categoryName
  );

  const handleConfirm = () => {
    if (cardCount === 0) {
      onConfirm('delete');
    } else {
      onConfirm(selectedOption, targetCategoryId || undefined);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
              <Text style={[styles.title, { color: colors.text }]}>
                Delete "{categoryName}"?
              </Text>

              {cardCount === 0 ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  This category is empty. Are you sure you want to delete it?
                </Text>
              ) : (
                <>
                  <Text style={[styles.message, { color: colors.textSecondary }]}>
                    This category has {cardCount} {cardCount === 1 ? 'card' : 'cards'}.
                    What would you like to do with {cardCount === 1 ? 'it' : 'them'}?
                  </Text>

                  <View style={styles.options}>
                    <View style={styles.option}>
                      <RadioButton
                        selected={selectedOption === 'uncategorize'}
                        onSelect={() => setSelectedOption('uncategorize')}
                        label="Move to Uncategorized"
                      />
                    </View>

                    {otherCategories.length > 0 && (
                      <View style={styles.option}>
                        <RadioButton
                          selected={selectedOption === 'move'}
                          onSelect={() => setSelectedOption('move')}
                          label="Move to another category"
                        />
                        {selectedOption === 'move' && (
                          <ScrollView
                            style={[styles.categoryList, { borderColor: colors.border }]}
                            showsVerticalScrollIndicator={false}
                          >
                            {otherCategories.map((category) => (
                              <RadioButton
                                key={category.id}
                                selected={targetCategoryId === category.id}
                                onSelect={() => setTargetCategoryId(category.id)}
                                label={category.name}
                              />
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}

                    <View style={styles.option}>
                      <RadioButton
                        selected={selectedOption === 'delete'}
                        onSelect={() => setSelectedOption('delete')}
                        label="Delete all cards in this category"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.buttons}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={onCancel}
                  style={styles.button}
                />
                <Button
                  title={cardCount === 0 ? 'Delete' : 'Confirm'}
                  variant={cardCount === 0 || selectedOption === 'delete' ? 'danger' : 'primary'}
                  onPress={handleConfirm}
                  disabled={cardCount > 0 && selectedOption === 'move' && !targetCategoryId}
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  options: {
    marginBottom: Spacing.lg,
  },
  option: {
    marginBottom: Spacing.md,
  },
  categoryList: {
    maxHeight: 150,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xl,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 2,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  button: {
    minWidth: 80,
  },
});
