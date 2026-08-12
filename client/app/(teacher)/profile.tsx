import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';

interface InfoRowProps { icon: string; label: string; value: string }
const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <View style={profileStyles.infoRow}>
    <View style={profileStyles.infoIconBg}>
      <Ionicons name={icon as any} size={16} color={Colors.primary} />
    </View>
    <View style={profileStyles.infoText}>
      <Text style={profileStyles.infoLabel}>{label}</Text>
      <Text style={profileStyles.infoValue}>{value}</Text>
    </View>
  </View>
);

export default function TeacherProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await authAPI.logout(); } catch { /* ignore */ }
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[profileStyles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[profileStyles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={profileStyles.gradientHeader}
        >
          <Avatar name={user?.name} uri={user?.profilePicture} size="xl" role="TEACHER" />
          <Text style={profileStyles.name}>{user?.name ?? 'Teacher'}</Text>
          {user?.designation && <Text style={profileStyles.designation}>{user.designation}</Text>}
          <View style={profileStyles.roleBadge}>
            <Ionicons name="school" size={12} color={Colors.primary} />
            <Text style={profileStyles.roleBadgeText}>TEACHER</Text>
          </View>
        </LinearGradient>

        {/* Info Card */}
        <View style={profileStyles.card}>
          <Text style={profileStyles.cardTitle}>Account Information</Text>
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} />
          <InfoRow
            icon="male-female-outline"
            label="Gender"
            value={user?.gender ? user.gender.charAt(0) + user.gender.slice(1).toLowerCase() : '—'}
          />
          <InfoRow icon="ribbon-outline" label="Role" value="Teacher" />
          {user?.designation && <InfoRow icon="briefcase-outline" label="Designation" value={user.designation} />}
        </View>

        {/* Actions */}
        <View style={profileStyles.actionsCard}>
          <TouchableOpacity
            style={profileStyles.actionItem}
            onPress={() => router.push('/(auth)/change-password')}
          >
            <View style={profileStyles.actionIconBg}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.secondary} />
            </View>
            <Text style={profileStyles.actionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={profileStyles.divider} />

          <TouchableOpacity
            style={profileStyles.actionItem}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <View style={[profileStyles.actionIconBg, { backgroundColor: Colors.errorGhost }]}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </View>
            <Text style={[profileStyles.actionText, { color: Colors.error }]}>
              {loggingOut ? 'Logging out...' : 'Log Out'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={profileStyles.version}>CSE Notice App v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  gradientHeader: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: Spacing.lg, gap: 8 },
  name: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: Colors.white },
  designation: { fontSize: Typography.fontSizes.md, color: 'rgba(255,255,255,0.8)' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 },
  roleBadgeText: { fontSize: Typography.fontSizes.xs, color: Colors.white, fontWeight: Typography.fontWeights.bold, letterSpacing: 1 },
  card: { backgroundColor: Colors.surface, margin: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, padding: Spacing.md },
  cardTitle: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  infoIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: Typography.fontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  actionsCard: { backgroundColor: Colors.surface, marginHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden' },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  actionIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondaryGhost, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, fontSize: Typography.fontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginHorizontal: Spacing.md },
  version: { textAlign: 'center', fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 24 },
});
