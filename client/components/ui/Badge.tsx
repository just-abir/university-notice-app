import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '@/constants/colors';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primaryGhost, text: Colors.primary },
  success: { bg: Colors.successGhost, text: Colors.success },
  warning: { bg: Colors.warningGhost, text: Colors.warning },
  error: { bg: Colors.errorGhost, text: Colors.error },
  info: { bg: 'rgba(0, 180, 255, 0.12)', text: '#00B4FF' },
  neutral: { bg: 'rgba(160, 160, 184, 0.12)', text: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', size = 'md' }) => {
  const v = variantMap[variant];
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: v.bg },
        size === 'sm' && styles.sm,
        size === 'md' && styles.md,
      ]}
    >
      <Text style={[styles.text, { color: v.text }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '600',
    fontSize: Typography.fontSizes.sm,
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: Typography.fontSizes.xs,
  },
});
