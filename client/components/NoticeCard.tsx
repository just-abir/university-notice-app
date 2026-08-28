import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Notice } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface NoticeCardProps {
  notice: Notice;
  onPress: () => void;
  role: 'TEACHER' | 'STUDENT';
}

const formatDate = (dateStr: string): string => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

const getAudienceLabel = (notice: Notice): string => {
  if (notice.audienceDescription) return notice.audienceDescription;
  const t = notice.targetAudience?.type;
  const labels: Record<string, string> = {
    SPECIFIC_ROLL: 'Specific Students',
    ROLL_RANGE: 'Roll Range',
    YEAR_ALL: `Year ${notice.targetAudience?.year ?? ''} Students`,
    YEAR_FEMALE: `Year ${notice.targetAudience?.year ?? ''} Female Students`,
    ALL_CSE: 'All CSE Students',
    ALL_CSE_FEMALE: 'All CSE Female Students',
    CUSTOM_GROUP: 'Custom Group',
    SELECTED_STUDENTS: 'Selected Students',
  };
  return labels[t ?? ''] ?? 'Selected Students';
};

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice, onPress, role }) => {
  const readCount = notice.readCount ?? 0;
  const total = notice.recipientCount ?? notice.resolvedRecipients?.length ?? 0;
  const readPercent = total > 0 ? Math.round((readCount / total) * 100) : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: notice.isRead ? Colors.surfaceBorder : Colors.primary }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          {role === 'TEACHER' ? (
            <Avatar name={notice.author?.name} role="TEACHER" size="sm" uri={notice.author?.profilePicture} />
          ) : (
            <View style={styles.unreadDot}>
              {!notice.isRead && <View style={styles.dot} />}
              <Avatar name={notice.author?.name} role="TEACHER" size="sm" uri={notice.author?.profilePicture} />
            </View>
          )}
          <View style={styles.headerText}>
            {role === 'STUDENT' && (
              <Text style={styles.authorName} numberOfLines={1}>
                {notice.author?.designation
                  ? `${notice.author.designation} ${notice.author.name}`
                  : notice.author?.name ?? 'Teacher'}
              </Text>
            )}
            <Text style={styles.title} numberOfLines={2}>{notice.title}</Text>
          </View>
          {notice.type === 'PDF' && (
            <View style={styles.pdfBadge}>
              <Ionicons name="document-text" size={12} color={Colors.warning} />
              <Text style={styles.pdfLabel}>PDF</Text>
            </View>
          )}
        </View>

        {/* Body preview */}
        {notice.body ? (
          <Text style={styles.bodyPreview} numberOfLines={2}>{notice.body}</Text>
        ) : null}

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <Text style={styles.dateText}>{formatDate(notice.createdAt)}</Text>

          {role === 'TEACHER' && total > 0 && (
            <View style={styles.readStats}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${readPercent}%` }]} />
              </View>
              <Text style={styles.readStatText}>
                {readCount}/{total} read
              </Text>
            </View>
          )}

          {role === 'STUDENT' && !notice.isRead && (
            <Badge label="New" variant="primary" size="sm" />
          )}

          {role === 'STUDENT' && notice.isRead && (
            <View style={styles.readCheck}>
              <Ionicons name="checkmark-done" size={14} color={Colors.success} />
              <Text style={styles.readLabel}>Read</Text>
            </View>
          )}
        </View>

        {/* Audience chip — teacher only */}
        {role === 'TEACHER' && (
          <View style={styles.audienceChip}>
            <Ionicons name="people-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.audienceText}>{getAudienceLabel(notice)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginHorizontal: Spacing.md,
    marginVertical: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  unreadDot: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    zIndex: 1,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.secondary,
    fontWeight: Typography.fontWeights.medium,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeights.semibold,
    lineHeight: 20,
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningGhost,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginLeft: 8,
    gap: 3,
  },
  pdfLabel: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: Typography.fontWeights.bold,
  },
  bodyPreview: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  readStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarBg: {
    width: 60,
    height: 4,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  readStatText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  readCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  readLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.success,
  },
  audienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  audienceText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
});
