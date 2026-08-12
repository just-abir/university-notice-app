import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Typography } from '@/constants/colors';
import { UserRole } from '@/types';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: AvatarSize;
  role?: UserRole;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 88,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 13,
  md: 18,
  lg: 24,
  xl: 32,
};

const roleGradients: Record<UserRole, [string, string]> = {
  STUDENT: [Colors.primary, Colors.primaryLight],
  TEACHER: [Colors.secondary, Colors.secondaryLight],
  ADMIN: [Colors.warning, '#FFCA28'],
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  uri,
  size = 'md',
  role = 'STUDENT',
}) => {
  const dim = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const borderRadius = dim / 2;
  const gradient = roleGradients[role];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: dim, height: dim, borderRadius }]}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { width: dim, height: dim, borderRadius }]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
});
