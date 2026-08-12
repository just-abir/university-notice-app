import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';

export default function ChangePasswordScreen() {
  const { user } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!oldPassword) errs.oldPassword = 'Current password is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    else if (newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authAPI.changePassword(oldPassword, newPassword);

      Alert.alert('Password Changed', 'Your password has been updated successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            if (user?.role === 'TEACHER') router.replace('/(teacher)/');
            else if (user?.role === 'STUDENT') router.replace('/(student)/');
          },
        },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to change password';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <Ionicons name="lock-open-outline" size={40} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Change Your Password</Text>
        <Text style={styles.subtitle}>
          For your security, please create a new password to replace the temporary one sent to you.
        </Text>

        <View style={styles.card}>
          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          <Input
            label="Current (Temporary) Password"
            value={oldPassword}
            onChangeText={setOldPassword}
            icon="key-outline"
            secureTextEntry
            error={errors.oldPassword}
          />
          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            icon="lock-closed-outline"
            secureTextEntry
            error={errors.newPassword}
          />
          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon="checkmark-circle-outline"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title="Update Password"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            icon="checkmark"
          />
        </View>

        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.tipText}>Use at least 6 characters. Combine letters and numbers for a stronger password.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGhost,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
  },
  errorBox: {
    backgroundColor: Colors.errorGhost,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: Typography.fontSizes.sm },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
});
