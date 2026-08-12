import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
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

export default function TeacherNoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchNotice = useCallback(async () => {
    if (!id) return;
    try {
      const [noticeData, commentData] = await Promise.all([
        noticesAPI.getNotice(id),
        commentsAPI.getComments(id),
      ]);
      setNotice(noticeData.notice);
      setComments(commentData.comments);
      setEditTitle(noticeData.notice.title);
      setEditBody(noticeData.notice.body ?? '');
    } catch {
      Alert.alert('Error', 'Failed to load notice.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchNotice(); }, [fetchNotice]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Notice', 'This will permanently delete the notice. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await noticesAPI.deleteNotice(id!);
            router.replace('/(teacher)/');
          } catch {
            Alert.alert('Error', 'Failed to delete notice.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [id]);

  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) { Alert.alert('Error', 'Title cannot be empty.'); return; }
    setSaving(true);
    try {
      const updated = await noticesAPI.updateNotice(id!, { title: editTitle.trim(), body: editBody.trim() } as any);
      setNotice(updated.notice);
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update notice.');
    } finally {
      setSaving(false);
    }
  }, [id, editTitle, editBody]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    Alert.alert('Delete Comment', 'Remove this comment?', [
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

  const readPct = notice.recipientCount
    ? Math.round(((notice.readCount ?? 0) / notice.recipientCount) * 100)
    : 0;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Notice Detail</Text>
        <View style={styles.headerActions}>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.headerBtn}>
              <Ionicons name="pencil-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color={Colors.error} />
              : <Ionicons name="trash-outline" size={22} color={Colors.error} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Notice Content */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeTopRow}>
            <Badge
              label={notice.type}
              variant={notice.type === 'PDF' ? 'warning' : 'primary'}
              size="sm"
            />
            <Text style={styles.noticeDate}>
              {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
            </Text>
          </View>

          {editing ? (
            <>
              <TextInput
                style={styles.editTitleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Title"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <TextInput
                style={styles.editBodyInput}
                value={editBody}
                onChangeText={setEditBody}
                placeholder="Body"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={saving}>
                  {saving
                    ? <ActivityIndicator size="small" color={Colors.white} />
                    : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              {notice.body ? <Text style={styles.noticeBody}>{notice.body}</Text> : null}
              {notice.type === 'PDF' && notice.pdfUrl && (
                <TouchableOpacity style={styles.pdfBtn} onPress={() => Linking.openURL(notice.pdfUrl!)}>
                  <Ionicons name="document-text" size={18} color={Colors.warning} />
                  <Text style={styles.pdfBtnText}>Open PDF</Text>
                  <Ionicons name="open-outline" size={14} color={Colors.warning} />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Audience */}
          <View style={styles.audienceRow}>
            <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.audienceText}>
              {notice.audienceDescription ?? notice.targetAudience?.type?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Read Status Card */}
        <View style={styles.readCard}>
          <View style={styles.readCardHeader}>
            <Text style={styles.readCardTitle}>Read Status</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push(`/(teacher)/notice/${id}/read-status`)}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.readStats}>
            <View style={styles.readStat}>
              <Text style={styles.readStatNum}>{notice.readCount ?? 0}</Text>
              <Text style={styles.readStatLabel}>Read</Text>
            </View>
            <View style={styles.readDivider} />
            <View style={styles.readStat}>
              <Text style={[styles.readStatNum, { color: Colors.warning }]}>{notice.unreadCount ?? 0}</Text>
              <Text style={styles.readStatLabel}>Unread</Text>
            </View>
            <View style={styles.readDivider} />
            <View style={styles.readStat}>
              <Text style={[styles.readStatNum, { color: Colors.secondary }]}>{notice.recipientCount ?? 0}</Text>
              <Text style={styles.readStatLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${readPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{readPct}% of recipients have read this</Text>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsSectionTitle}>
            💬 Comments ({comments.length})
          </Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet.</Text>
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c._id}
                comment={c}
                canDelete={true}
                onDelete={() => handleDeleteComment(c._id)}
              />
            ))
          )}
        </View>
      </ScrollView>
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
  headerBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginHorizontal: 8 },
  headerActions: { flexDirection: 'row', gap: 4 },
  scroll: { padding: Spacing.md },
  noticeCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder, padding: Spacing.md, marginBottom: Spacing.md,
  },
  noticeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  noticeDate: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },
  noticeTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, lineHeight: 28, marginBottom: 10 },
  noticeBody: { fontSize: Typography.fontSizes.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: 12 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningGhost, borderRadius: BorderRadius.md,
    padding: 12, marginVertical: 8, borderWidth: 1, borderColor: Colors.warning,
  },
  pdfBtnText: { fontSize: Typography.fontSizes.sm, color: Colors.warning, fontWeight: '600', flex: 1 },
  audienceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  audienceText: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },
  editTitleInput: {
    fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: 12, marginBottom: 10,
  },
  editBodyInput: {
    fontSize: Typography.fontSizes.md, color: Colors.textSecondary,
    borderWidth: 1.5, borderColor: Colors.surfaceBorder, borderRadius: BorderRadius.md,
    padding: 12, minHeight: 100,
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center' },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: '600' },
  readCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder, padding: Spacing.md, marginBottom: Spacing.md,
  },
  readCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  readCardTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: Typography.fontSizes.sm, color: Colors.primary, fontWeight: '600' },
  readStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  readStat: { alignItems: 'center', gap: 4 },
  readStatNum: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: Colors.success },
  readStatLabel: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },
  readDivider: { width: 1, backgroundColor: Colors.surfaceBorder, alignSelf: 'stretch' },
  progressBg: { height: 6, backgroundColor: Colors.surfaceBorder, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: Colors.secondary, borderRadius: 3 },
  progressLabel: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, textAlign: 'center' },
  commentsSection: { marginTop: 4 },
  commentsSectionTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginHorizontal: Spacing.xs },
  noComments: { color: Colors.textMuted, fontSize: Typography.fontSizes.sm, textAlign: 'center', padding: Spacing.lg },
});
