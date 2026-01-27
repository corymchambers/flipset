export const Colors = {
  // Light theme with cyan accent (darker for better contrast)
  light: {
    primary: '#0891B2',
    primaryLight: '#22D3EE',
    primaryDark: '#0E7490',
    success: '#22C55E',
    successLight: '#4ADE80',
    error: '#EF4444',
    errorLight: '#F87171',
    warning: '#F59E0B',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#E5E5EA',
    text: '#1C1C1E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E5EA',
    borderLight: '#F2F2F7',
    icon: '#6B7280',
    iconActive: '#0891B2',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E5EA',
  },
  // Dark theme with cyan accent (pure black for max contrast)
  dark: {
    primary: '#22D3EE',
    primaryLight: '#67E8F9',
    primaryDark: '#06B6D4',
    success: '#22C55E',
    successLight: '#4ADE80',
    error: '#EF4444',
    errorLight: '#F87171',
    warning: '#F59E0B',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceSecondary: '#2a2a2a',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    border: '#2a2a2a',
    borderLight: '#1a1a1a',
    icon: '#A1A1AA',
    iconActive: '#22D3EE',
    tabBar: '#0a0a0a',
    tabBarBorder: '#1a1a1a',
  },
};

export type ThemeMode = 'light' | 'dark';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
