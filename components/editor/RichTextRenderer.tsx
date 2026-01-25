import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useTheme } from '@/hooks';
import { FontSize } from '@/constants/theme';

interface RichTextRendererProps {
  content: string;
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  if (!content || content.trim() === '' || content === '<p></p>') {
    return (
      <Text style={{ fontSize: FontSize.md, color: colors.textTertiary, fontStyle: 'italic' }}>
        No content
      </Text>
    );
  }

  return (
    <RenderHtml
      contentWidth={width - 80}
      source={{ html: content }}
      baseStyle={{
        color: colors.text,
        fontSize: FontSize.md,
      }}
    />
  );
}
