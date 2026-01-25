import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { Spacing, FontSize } from '@/constants/theme';

interface RichTextRendererProps {
  content: string;
}

interface ParsedNode {
  type: 'text' | 'bold' | 'italic' | 'underline' | 'paragraph' | 'list' | 'listItem';
  content?: string;
  children?: ParsedNode[];
  listType?: 'ordered' | 'unordered';
  index?: number;
}

function parseHtml(html: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];

  // Simple HTML parser for our limited set of tags
  let remaining = html;

  const tagRegex = /<(\/?)(p|b|strong|i|em|u|ul|ol|li)>|([^<]+)/gi;
  const stack: ParsedNode[] = [];
  let currentNode: ParsedNode = { type: 'paragraph', children: [] };
  let listItemIndex = 0;

  let match;
  while ((match = tagRegex.exec(remaining)) !== null) {
    const [, closing, tag, textContent] = match;

    if (textContent) {
      // Text content
      const text = textContent
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

      if (text.trim() || text.includes(' ')) {
        const textNode: ParsedNode = { type: 'text', content: text };
        if (currentNode.children) {
          currentNode.children.push(textNode);
        }
      }
    } else if (tag) {
      const tagLower = tag.toLowerCase();

      if (!closing) {
        // Opening tag
        let newNode: ParsedNode;

        switch (tagLower) {
          case 'p':
            newNode = { type: 'paragraph', children: [] };
            break;
          case 'b':
          case 'strong':
            newNode = { type: 'bold', children: [] };
            break;
          case 'i':
          case 'em':
            newNode = { type: 'italic', children: [] };
            break;
          case 'u':
            newNode = { type: 'underline', children: [] };
            break;
          case 'ul':
            newNode = { type: 'list', listType: 'unordered', children: [] };
            listItemIndex = 0;
            break;
          case 'ol':
            newNode = { type: 'list', listType: 'ordered', children: [] };
            listItemIndex = 0;
            break;
          case 'li':
            listItemIndex++;
            newNode = { type: 'listItem', index: listItemIndex, children: [] };
            break;
          default:
            continue;
        }

        stack.push(currentNode);
        if (currentNode.children) {
          currentNode.children.push(newNode);
        }
        currentNode = newNode;
      } else {
        // Closing tag
        if (stack.length > 0) {
          currentNode = stack.pop()!;
        }
      }
    }
  }

  // Handle case where content has no tags
  if (currentNode.children && currentNode.children.length === 0 && !remaining.includes('<')) {
    currentNode.children.push({ type: 'text', content: remaining });
  }

  if (currentNode.children && currentNode.children.length > 0) {
    nodes.push(currentNode);
  } else if (remaining && !remaining.includes('<')) {
    nodes.push({ type: 'paragraph', children: [{ type: 'text', content: remaining }] });
  }

  return nodes;
}

function RenderNode({ node, colors }: { node: ParsedNode; colors: any }) {
  switch (node.type) {
    case 'text':
      return <Text>{node.content}</Text>;

    case 'bold':
      return (
        <Text style={styles.bold}>
          {node.children?.map((child, i) => (
            <RenderNode key={i} node={child} colors={colors} />
          ))}
        </Text>
      );

    case 'italic':
      return (
        <Text style={styles.italic}>
          {node.children?.map((child, i) => (
            <RenderNode key={i} node={child} colors={colors} />
          ))}
        </Text>
      );

    case 'underline':
      return (
        <Text style={styles.underline}>
          {node.children?.map((child, i) => (
            <RenderNode key={i} node={child} colors={colors} />
          ))}
        </Text>
      );

    case 'paragraph':
      return (
        <Text style={[styles.paragraph, { color: colors.text }]}>
          {node.children?.map((child, i) => (
            <RenderNode key={i} node={child} colors={colors} />
          ))}
        </Text>
      );

    case 'list':
      return (
        <View style={styles.list}>
          {node.children?.map((child, i) => (
            <RenderNode
              key={i}
              node={{ ...child, listType: node.listType }}
              colors={colors}
            />
          ))}
        </View>
      );

    case 'listItem':
      const bullet = node.listType === 'ordered' ? `${node.index}.` : '•';
      return (
        <View style={styles.listItem}>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>
            {bullet}
          </Text>
          <Text style={[styles.listItemText, { color: colors.text }]}>
            {node.children?.map((child, i) => (
              <RenderNode key={i} node={child} colors={colors} />
            ))}
          </Text>
        </View>
      );

    default:
      return null;
  }
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  const { colors } = useTheme();

  if (!content || content.trim() === '') {
    return (
      <Text style={[styles.empty, { color: colors.textTertiary }]}>
        No content
      </Text>
    );
  }

  const nodes = parseHtml(content);

  return (
    <View style={styles.container}>
      {nodes.map((node, i) => (
        <RenderNode key={i} node={node} colors={colors} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  paragraph: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
    marginBottom: Spacing.sm,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  list: {
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  bullet: {
    width: 24,
    fontSize: FontSize.md,
  },
  listItemText: {
    flex: 1,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
  },
  empty: {
    fontSize: FontSize.md,
    fontStyle: 'italic',
  },
});
