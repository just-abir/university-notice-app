// ─── Color Palette ────────────────────────────────────────────────────────────
export const Colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#242438',
  surfaceBorder: '#2A2A3E',

  primary: '#6C63FF',
  primaryLight: '#8B84FF',
  primaryDark: '#5248CC',
  primaryGhost: 'rgba(108, 99, 255, 0.12)',

  secondary: '#00D4AA',
  secondaryLight: '#33DDB8',
  secondaryGhost: 'rgba(0, 212, 170, 0.12)',

  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#606078',

  error: '#FF6B6B',
  errorGhost: 'rgba(255, 107, 107, 0.12)',
  success: '#00D4AA',
  successGhost: 'rgba(0, 212, 170, 0.12)',
  warning: '#FFB800',
  warningGhost: 'rgba(255, 184, 0, 0.12)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  overlay: 'rgba(0, 0, 0, 0.6)',

  // Role colors
  studentColor: '#6C63FF',
  teacherColor: '#00D4AA',
  adminColor: '#FFB800',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 38,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  small: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  large: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;
