import { Colors } from '@/constants/theme';

export function useTheme() {
  // Dark-only theme
  return {
    colors: Colors.dark,
    isDark: true,
  };
}
