import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { Spacing, FontSize } from '@/constants/theme';

interface RadioButtonProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  disabled?: boolean;
}

export function RadioButton({ selected, onSelect, label, disabled }: RadioButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? colors.primary : colors.border,
          },
          disabled && styles.disabled,
        ]}
      >
        {selected && (
          <View
            style={[styles.radioInner, { backgroundColor: colors.primary }]}
          />
        )}
      </View>
      <Text
        style={[
          styles.label,
          { color: disabled ? colors.textTertiary : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
  },
});
