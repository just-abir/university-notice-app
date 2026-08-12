import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useStudentFeed } from '@/hooks/useNotices';
import { NoticeCard } from '@/components/NoticeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { Notice } from '@/types';

type FilterType = 'all' | 'unread' | 'read';

export default function StudentFeed() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const feedFilter = filter === 'all' ? undefined : filter;
  const { notices, isLoading, isRefreshing, loadMore, refresh, hasMore } = useStudentFeed(feedFilter);

  const unreadCount = notices.filter((n) => !n.isRead).length;

  const handleNoticePress = useCallback((notice: Notice) => {
    router.push(`/(student)/notice/${notice._id}`);
  }, []);

  const renderNotice = useCallback(
    ({ item }: { item: Notice }) => (
      <NoticeCard notice={item} onPress={() => handleNoticePress(item)} role="STUDENT" />
    ),
    [handleNoticePress]
  );

  const FILTERS: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'layers-outline' },
    { key: 'unread', label: 'Unread', icon: 'notifications-outline' },
    { key: 'read', label: 'Read', icon: 'checkmark-done-outline' },
  ];

  const ListHeader = () => (
    <>
      {/* Header */}
      <LinearGradient colors={['#1A1A2E', '#0F0F1A']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.name ?? 'Student'} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
            <Ionicons name="notifications-outline" size={26} color={Colors.textSecondary} />
          </View>
        </View>

        {/* Info chips */}
        <View style={styles.chipsRow}>
          {user?.roll && (
            <View style={styles.chip}>
              <Ionicons name="card-outline" size={12} color={Colors.secondary} />
              <Text style={styles.chipText}>Roll: {user.roll}</Text>
            </View>
          )}
          {user?.year && (
            <View style={styles.chip}>
              <Ionicons name="school-outline" size={12} color={Colors.secondary} />
              <Text style={styles.chipText}>Year {user.year}</Text>
            </View>
          )}
          {user?.batch && (
            <View style={styles.chip}>
              <Ionicons name="people-outline" size={12} color={Colors.secondary} />
              <Text style={styles.chipText}>{user.batch}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons
              name={f.icon as any}
              size={14}
              color={filter === f.key ? Colors.white : Colors.textMuted}
            />
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>
        {notices.length} notice{notices.length !== 1 ? 's' : ''}
        {filter !== 'all' ? ` · ${filter}` : ''}
      </Text>
    </>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{filter === 'unread' ? '🎉' : '📭'}</Text>
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? "You're all caught up!" : 'No notices yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'unread'
          ? 'No unread notices. Check back later.'
          : "Your teachers haven't sent any notices yet."}
      </Text>
    </View>
  );

  if (isLoading && notices.length === 0) {
    return <View style={styles.center}><LoadingSpinner size={40} /></View>;
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={notices}
        keyExtractor={(n) => n._id}
        renderItem={renderNotice}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        ListFooterComponent={
          isLoading && notices.length > 0
            ? <View style={styles.footer}><LoadingSpinner size={24} /></View>
            : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted },
  userName: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, maxWidth: 220 },
  headerRight: { position: 'relative', padding: 4 },
  unreadBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.secondary, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, zIndex: 1,
  },
  unreadBadgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.secondaryGhost,
    borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.secondary,
  },
  chipText: { fontSize: Typography.fontSizes.xs, color: Colors.secondary, fontWeight: '600' },
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  filterBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  filterText: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: Colors.white },
  countText: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginHorizontal: Spacing.md, marginBottom: 4, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  footer: { paddingVertical: 20, alignItems: 'center' },
});
