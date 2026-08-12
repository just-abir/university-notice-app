import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/api';
import { registerForPushNotifications } from '@/services/pushNotifications';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const { setAuth } = useAuthStore();

  // Animated floating orbs
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Floating orb animations
    const animateOrb = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 3000 + delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 3000 + delay, useNativeDriver: true }),
        ])
      ).start();

    animateOrb(orb1, 0);
    animateOrb(orb2, 700);
    animateOrb(orb3, 1400);
  }, []);

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const orb3Y = orb3.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const validate = useCallback(() => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const data = await authAPI.login(email.trim().toLowerCase(), password);
      await setAuth(data.user, data.accessToken, data.refreshToken);

      // Register push token in background
      registerForPushNotifications().then((token) => {
        if (token) {
          authAPI.updateMe({ expoPushToken: token }).catch(() => {});
        }
      });

      // Navigate based on role and mustChangePassword flag
      if (data.user.mustChangePassword) {
        router.replace('/(auth)/change-password');
      } else if (data.user.role === 'TEACHER') {
        router.replace('/(teacher)/');
      } else if (data.user.role === 'STUDENT') {
        router.replace('/(student)/');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }, [email, password, validate, setAuth]);

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your email address first, then tap Forgot Password.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `Send a password reset link to:\n${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await authAPI.forgotPassword(email.trim());
              Alert.alert('Email Sent', 'Check your inbox for a reset link.');
            } catch {
              Alert.alert('Error', 'Could not send reset email.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0F0F1A', '#1A1A2E', '#0F0F1A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: orb2Y }] }]} />
      <Animated.View style={[styles.orb, styles.orb3, { transform: [{ translateY: orb3Y }] }]} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
            <View style={styles.logoIconBg}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.logoTitle}>CSE NOTICE</Text>
            <Text style={styles.logoSubtitle}>Department of Computer Science & Engineering</Text>
            <View style={styles.logoDivider} />
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formCard,
              { opacity: formOpacity, transform: [{ translateY: formSlide }] },
            ]}
          >
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>

            {errors.general ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{errors.general}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              secureTextEntry
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              icon="arrow-forward"
              iconPosition="right"
            />

            <View style={styles.credNote}>
              <Text style={styles.credNoteText}>
                Don't have credentials? Contact your department administrator.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },

  // Orbs
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orb1: { width: 260, height: 260, backgroundColor: Colors.primary, top: -60, right: -80 },
  orb2: { width: 200, height: 200, backgroundColor: Colors.secondary, bottom: 80, left: -60 },
  orb3: { width: 140, height: 140, backgroundColor: Colors.primary, top: '40%', right: 20 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: Spacing.xl },
  logoIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryGhost,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoIcon: { fontSize: 38 },
  logoTitle: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  logoSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  logoDivider: {
    width: 60,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: Spacing.md,
  },

  // Form
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
  },
  formTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    backgroundColor: Colors.errorGhost,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorBoxText: { color: Colors.error, fontSize: Typography.fontSizes.sm },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -4 },
  forgotText: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  credNote: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
  },
  credNoteText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
