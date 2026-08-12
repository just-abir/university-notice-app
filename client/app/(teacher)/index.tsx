import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useTeacherNotices } from '@/hooks/useNotices';
import { noticesAPI } from '@/services/api';
import { NoticeCard } from '@/components/NoticeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { Notice } from '@/types';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function TeacherDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { notices, isLoading, isRefreshing, loadMore, refresh, error } =
    useTeacherNotices(debouncedSearch);

  // Stats
  const totalNotices = notices.length;
  const totalReach = notices.reduce((s, n) => s + (n.recipientCount ?? 0), 0);
  const totalUnread = notices.reduce((s, n) => s + (n.unreadCount ?? 0), 0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleNoticePress = useCallback((notice: Notice) => {
    router.push(`/(teacher)/notice/${notice._id}`);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('Delete Notice', 'This will permanently remove the notice. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await noticesAPI.deleteNotice(id);
            refresh();
          } catch {
            Alert.alert('Error', 'Failed to delete notice.');
          }
        },
      },
    ]);
  }, [refresh]);

  const renderNotice = useCallback(({ item }: { item: Notice }) => (
    <NoticeCard notice={item} onPress={() => handleNoticePress(item)} role="TEACHER" />
  ), [handleNoticePress]);

  const ListHeader = () => (
    <>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#1A1A2E', '#0F0F1A']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.designation ? `${user.designation} ` : ''}{user?.name ?? 'Teacher'} 👋
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(teacher)/profile')}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(user?.name ?? 'T').charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Notices', value: totalNotices, icon: 'newspaper-outline', color: Colors.primary },
            { label: 'Reached', value: totalReach, icon: 'people-outline', color: Colors.secondary },
            { label: 'Pending', value: totalUnread, icon: 'time-outline', color: Colors.warning },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notices..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionLabel}>
        {debouncedSearch ? `Results for "${debouncedSearch}"` : 'Your Notices'}
      </Text>
    </>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {debouncedSearch ? 'No results found' : 'No notices yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {debouncedSearch
          ? 'Try a different search term'
          : 'Tap the + button to send your first notice'}
      </Text>
    </View>
  );

  if (isLoading && notices.length === 0) {
    return (
      <View style={styles.loadingCenter}>
        <LoadingSpinner size={40} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item._id}
        renderItem={renderNotice}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        ListFooterComponent={
          isLoading && notices.length > 0 ? (
            <View style={styles.footer}><LoadingSpinner size={24} /></View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/(teacher)/compose')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loadingCenter: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted },
  userName: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, maxWidth: 220 },
  avatarBtn: { marginTop: 4 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryGhost,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: Typography.fontSizes.lg, color: Colors.primary, fontWeight: Typography.fontWeights.bold },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.surfaceBorder, padding: 12,
    alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold },
  statLabel: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    paddingHorizontal: 12, height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.fontSizes.md },

  sectionLabel: {
    fontSize: Typography.fontSizes.sm, color: Colors.textMuted,
    fontWeight: Typography.fontWeights.semibold,
    marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  footer: { paddingVertical: 20, alignItems: 'center' },

  fab: {
    position: 'absolute', right: Spacing.lg,
    borderRadius: 28,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
