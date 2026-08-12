import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';

interface CommentItemProps {
  comment: Comment;
  canDelete: boolean;
  onDelete?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, canDelete, onDelete }) => {
  const formatDate = (d: string) => {
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return d;
    }
  };

  return (
    <View style={styles.container}>
      <Avatar
        name={comment.author?.name}
        uri={comment.author?.profilePicture}
        role={comment.author?.role ?? 'STUDENT'}
        size="sm"
      />
      <View style={styles.bubble}>
        <View style={styles.header}>
          <Text style={styles.authorName}>{comment.author?.name ?? 'Student'}</Text>
          {comment.author?.roll && (
            <Text style={styles.roll}>#{comment.author.roll}</Text>
          )}
          <Text style={styles.date}>{formatDate(comment.createdAt)}</Text>
          {canDelete && (
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.body}>{comment.body}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 10,
    marginLeft: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeights.semibold,
  },
  roll: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  date: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  body: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
