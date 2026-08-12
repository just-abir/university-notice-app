import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking, TextInput, KeyboardAvoidingView, Platform,
  FlatList, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { noticesAPI, commentsAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { CommentItem } from '@/components/CommentItem';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { Notice, Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function StudentNoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    try {
      const [noticeRes, commentRes] = await Promise.all([
        noticesAPI.getNotice(id),
        commentsAPI.getComments(id),
      ]);
      setNotice(noticeRes.notice);
      setComments(commentRes.comments);

      // Auto mark as read
      if (!noticeRes.notice.isRead) {
        noticesAPI.markAsRead(id).catch(() => {});
      }
    } catch {
      Alert.alert('Error', 'Failed to load notice.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() || !id) return;
    setSubmitting(true);
    try {
      const data = await commentsAPI.addComment(id, commentText.trim());
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }, [id, commentText]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    Alert.alert('Delete Comment', 'Remove your comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await commentsAPI.deleteComment(id!, commentId);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
          } catch {
            Alert.alert('Error', 'Failed to delete comment.');
          }
        },
      },
    ]);
  }, [id]);

  if (loading) {
    return <View style={styles.center}><LoadingSpinner size={40} /></View>;
  }

  if (!notice) return null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Notice</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Notice Content */}
        <View style={styles.noticeCard}>
          {/* Author */}
          <View style={styles.authorRow}>
            <Avatar
              name={notice.author?.name}
              uri={notice.author?.profilePicture}
              role="TEACHER"
              size="md"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {notice.author?.designation
                  ? `${notice.author.designation} ${notice.author.name}`
                  : notice.author?.name ?? 'Teacher'}
              </Text>
              <Text style={styles.noticeDate}>
                {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
              </Text>
            </View>
            <Badge
              label={notice.type}
              variant={notice.type === 'PDF' ? 'warning' : 'primary'}
              size="sm"
            />
          </View>

          {/* Title */}
          <Text style={styles.noticeTitle}>{notice.title}</Text>

          {/* Body */}
          {notice.body ? <Text style={styles.noticeBody}>{notice.body}</Text> : null}

          {/* PDF */}
          {notice.type === 'PDF' && notice.pdfUrl && (
            <TouchableOpacity style={styles.pdfBtn} onPress={() => Linking.openURL(notice.pdfUrl!)}>
              <Ionicons name="document-text" size={22} color={Colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pdfBtnTitle}>Attached PDF</Text>
                <Text style={styles.pdfBtnSub}>Tap to open in browser</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.warning} />
            </TouchableOpacity>
          )}

          {/* Read indicator */}
          {notice.isRead && (
            <View style={styles.readRow}>
              <Ionicons name="checkmark-done" size={14} color={Colors.success} />
              <Text style={styles.readText}>Read</Text>
            </View>
          )}
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsSectionTitle}>
            💬 Replies ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>Be the first to reply to this notice.</Text>
            </View>
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c._id}
                comment={c}
                canDelete={c.author?._id === user?._id}
                onDelete={() => handleDeleteComment(c._id)}
              />
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Comment Input Bar */}
      <View style={[styles.commentBar, { paddingBottom: insets.bottom + 8 }]}>
        <Avatar name={user?.name} uri={user?.profilePicture} role="STUDENT" size="sm" />
        <TextInput
          style={styles.commentInput}
          placeholder="Write a reply..."
          placeholderTextColor={Colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Ionicons name="send" size={18} color={Colors.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: { padding: 6, width: 36 },
  headerTitle: { flex: 1, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  scroll: { padding: Spacing.md, paddingBottom: 20 },

  noticeCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder, padding: Spacing.md, marginBottom: Spacing.md,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: 10 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, color: Colors.secondary },
  noticeDate: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  noticeTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, lineHeight: 28, marginBottom: 12 },
  noticeBody: { fontSize: Typography.fontSizes.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: 12 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.warningGhost, borderRadius: BorderRadius.md,
    padding: 14, marginVertical: 8, borderWidth: 1, borderColor: Colors.warning,
  },
  pdfBtnTitle: { fontSize: Typography.fontSizes.sm, color: Colors.warning, fontWeight: '700' },
  pdfBtnSub: { fontSize: Typography.fontSizes.xs, color: Colors.warning, opacity: 0.8, marginTop: 2 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  readText: { fontSize: Typography.fontSizes.xs, color: Colors.success },

  commentsSection: {},
  commentsSectionTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs },
  noComments: { alignItems: 'center', padding: 24 },
  noCommentsText: { color: Colors.textMuted, fontSize: Typography.fontSizes.sm, fontStyle: 'italic' },

  commentBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: Spacing.md, paddingTop: 10,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  commentInput: {
    flex: 1, backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.surfaceBorder,
    paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: Typography.fontSizes.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
