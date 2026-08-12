import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { noticesAPI } from '@/services/api';
import { ReadStatusResponse, User } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';

interface ReadStatusListProps {
  noticeId: string;
}

export const ReadStatusList: React.FC<ReadStatusListProps> = ({ noticeId }) => {
  const [data, setData] = useState<ReadStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'read' | 'unread'>('read');

  useEffect(() => {
    noticesAPI
      .getReadStatus(noticeId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [noticeId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load read status</Text>
      </View>
    );
  }

  const readPercent = data.readPercentage;
  const list = activeTab === 'read' ? data.read : data.unread;

  const renderReadItem = ({ item }: { item: typeof data.read[0] }) => {
    const student = item.student as User;
    return (
      <View style={styles.studentRow}>
        <Avatar name={student.name} uri={student.profilePicture} size="sm" role="STUDENT" />
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          {student.roll && <Text style={styles.studentMeta}>Roll: {student.roll}</Text>}
        </View>
        <View style={styles.readTimeContainer}>
          <Ionicons name="checkmark-done" size={14} color={Colors.success} />
          <Text style={styles.readTime}>
            {formatDistanceToNow(new Date(item.readAt), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  const renderUnreadItem = ({ item }: { item: User }) => (
    <View style={styles.studentRow}>
      <Avatar name={item.name} uri={item.profilePicture} size="sm" role="STUDENT" />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        {item.roll && <Text style={styles.studentMeta}>Roll: {item.roll}</Text>}
      </View>
      <View style={styles.unreadBadge}>
        <Ionicons name="time-outline" size={12} color={Colors.warning} />
        <Text style={styles.unreadLabel}>Pending</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {data.readCount} / {data.totalRecipients} read
          </Text>
          <Text style={styles.progressPercent}>{readPercent}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${readPercent}%` }]} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['read', 'unread'] as const).map((tab) => (
          <View
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              onPress={() => setActiveTab(tab)}
            >
              {tab === 'read' ? `✓ Read (${data.readCount})` : `⏳ Unread (${data.unreadCount})`}
            </Text>
          </View>
        ))}
      </View>

      {/* List */}
      {activeTab === 'read' ? (
        <FlatList
          data={data.read}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderReadItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No students have read this yet</Text>}
        />
      ) : (
        <FlatList
          data={data.unread}
          keyExtractor={(item) => (item as User)._id}
          renderItem={renderUnreadItem}
          ListEmptyComponent={<Text style={styles.emptyText}>All students have read this! 🎉</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.error, fontSize: Typography.fontSizes.md },
  progressSection: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: { fontSize: Typography.fontSizes.sm, color: Colors.textSecondary },
  progressPercent: { fontSize: Typography.fontSizes.sm, color: Colors.secondary, fontWeight: '700' },
  progressBg: {
    height: 8,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primaryGhost },
  tabText: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: Typography.fontWeights.semibold },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  studentInfo: { flex: 1, marginLeft: 10 },
  studentName: { fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, fontWeight: '600' },
  studentMeta: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  readTimeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readTime: { fontSize: Typography.fontSizes.xs, color: Colors.success },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningGhost,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  unreadLabel: { fontSize: Typography.fontSizes.xs, color: Colors.warning },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.sm,
    padding: Spacing.xl,
  },
});
