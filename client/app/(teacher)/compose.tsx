import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupsAPI, noticesAPI, studentsAPI } from '@/services/api';
import { AudiencePicker } from '@/components/AudiencePicker';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { TargetAudience, StudentGroup } from '@/types';

type NoticeType = 'TEXT' | 'PDF';

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>('TEXT');
  const [audience, setAudience] = useState<TargetAudience | null>(null);
  const [pdfFile, setPdfFile] = useState<{ uri: string; name: string; size?: number } | null>(null);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    groupsAPI.getGroups().then((d) => setGroups(d.groups)).catch(() => {});
  }, []);

  const handlePickPDF = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPdfFile({ uri: asset.uri, name: asset.name, size: asset.size });
      }
    } catch {
      Alert.alert('Error', 'Could not pick PDF file.');
    }
  }, []);

  const handleAudienceChange = useCallback(async (a: TargetAudience) => {
    setAudience(a);
    if (a.type === 'SELECTED_STUDENTS') {
      setRecipientCount(a.selectedIds ? a.selectedIds.length : 0);
    } else {
      try {
        const data = await studentsAPI.resolveAudience(a);
        setRecipientCount(data.count);
      } catch {
        setRecipientCount(null);
      }
    }
  }, []);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Notice title is required';
    if (noticeType === 'TEXT' && !body.trim()) errs.body = 'Notice body is required for text notices';
    if (noticeType === 'PDF' && !pdfFile) errs.pdf = 'Please select a PDF file';
    if (!audience || (audience.type === 'SELECTED_STUDENTS' && (!audience.selectedIds || audience.selectedIds.length === 0))) {
      errs.audience = 'Please select at least one recipient student';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [title, body, noticeType, pdfFile, audience]);

  const handleSend = useCallback(async () => {
    if (!validate()) return;

    Alert.alert(
      'Send Notice',
      `This notice will be sent to ${recipientCount ?? '?'} student(s). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now',
          onPress: async () => {
            setLoading(true);
            try {
              const formData = new FormData();
              formData.append('title', title.trim());
              formData.append('type', noticeType);
              formData.append('targetAudience', JSON.stringify(audience));
              if (body.trim()) formData.append('body', body.trim());
              if (noticeType === 'PDF' && pdfFile) {
                formData.append('pdf', {
                  uri: pdfFile.uri,
                  name: pdfFile.name,
                  type: 'application/pdf',
                } as any);
              }

              await noticesAPI.createNotice(formData);
              Alert.alert('✅ Sent!', 'Your notice has been published successfully.', [
                { text: 'OK', onPress: () => router.replace('/(teacher)/') },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to send notice.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [validate, title, body, noticeType, pdfFile, audience, recipientCount]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Notice</Text>
        <TouchableOpacity
          onPress={handleSend}
          disabled={loading}
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Ionicons name="paper-plane" size={20} color={Colors.white} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notice Title *</Text>
          <TextInput
            style={[styles.titleInput, !!errors.title && styles.inputError]}
            placeholder="Enter a clear, concise title..."
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Type Toggle */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notice Type</Text>
          <View style={styles.typeToggle}>
            {(['TEXT', 'PDF'] as NoticeType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, noticeType === t && styles.typeBtnActive]}
                onPress={() => { setNoticeType(t); setPdfFile(null); }}
              >
                <Ionicons
                  name={t === 'TEXT' ? 'text' : 'document-text-outline'}
                  size={16}
                  color={noticeType === t ? Colors.white : Colors.textMuted}
                />
                <Text style={[styles.typeBtnText, noticeType === t && styles.typeBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body (TEXT mode) */}
        {noticeType === 'TEXT' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Message Body *</Text>
            <TextInput
              style={[styles.bodyInput, !!errors.body && styles.inputError]}
              placeholder="Write your notice message here..."
              placeholderTextColor={Colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />
            <Text style={styles.charCount}>{body.length}/5000</Text>
            {errors.body && <Text style={styles.errorText}>{errors.body}</Text>}
          </View>
        )}

        {/* PDF Picker (PDF mode) */}
        {noticeType === 'PDF' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PDF File *</Text>
            <TouchableOpacity style={[styles.pdfPicker, !!errors.pdf && styles.inputError]} onPress={handlePickPDF}>
              {pdfFile ? (
                <View style={styles.pdfSelected}>
                  <Ionicons name="document-text" size={22} color={Colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pdfName} numberOfLines={1}>{pdfFile.name}</Text>
                    {pdfFile.size && (
                      <Text style={styles.pdfSize}>{(pdfFile.size / 1024).toFixed(1)} KB</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setPdfFile(null)}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pdfPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={28} color={Colors.textMuted} />
                  <Text style={styles.pdfPlaceholderText}>Tap to choose PDF (max 10MB)</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.pdf && <Text style={styles.errorText}>{errors.pdf}</Text>}

            {/* Optional caption for PDF */}
            <TextInput
              style={[styles.bodyInput, { marginTop: 10 }]}
              placeholder="Optional caption / description..."
              placeholderTextColor={Colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        )}

        {/* Audience Picker */}
        <View style={styles.fieldGroup}>
          <AudiencePicker value={audience} onChange={handleAudienceChange} />
          {errors.audience && <Text style={styles.errorText}>{errors.audience}</Text>}
        </View>

        {/* Recipient Preview */}
        {recipientCount !== null && (
          <View style={styles.recipientBanner}>
            <Ionicons name="people" size={18} color={Colors.secondary} />
            <Text style={styles.recipientText}>
              {recipientCount === 0
                ? 'No students match this criteria'
                : `${recipientCount} student${recipientCount !== 1 ? 's' : ''} will receive this notice`}
            </Text>
          </View>
        )}

        {/* Send Button */}
        <View style={{ marginTop: Spacing.lg }}>
          <Button
            title={loading ? 'Sending...' : 'Send Notice'}
            onPress={handleSend}
            loading={loading}
            fullWidth
            size="lg"
            icon="paper-plane"
            iconPosition="right"
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  sendBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  scroll: { padding: Spacing.lg },
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: {
    fontSize: Typography.fontSizes.sm, color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.semibold, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  titleInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    padding: 14, color: Colors.textPrimary,
    fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
  },
  bodyInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    padding: 14, color: Colors.textPrimary,
    fontSize: Typography.fontSizes.md, minHeight: 140,
  },
  charCount: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  inputError: { borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: Typography.fontSizes.xs, marginTop: 4 },
  typeToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden' },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeBtnText: { fontSize: Typography.fontSizes.md, color: Colors.textMuted, fontWeight: Typography.fontWeights.semibold },
  typeBtnTextActive: { color: Colors.white },
  pdfPicker: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.surfaceBorder, borderStyle: 'dashed',
    minHeight: 100, justifyContent: 'center',
  },
  pdfPlaceholder: { alignItems: 'center', padding: 20, gap: 8 },
  pdfPlaceholderText: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted },
  pdfSelected: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  pdfName: { fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, fontWeight: '600' },
  pdfSize: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  recipientBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.secondaryGhost, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.secondary, padding: 14,
  },
  recipientText: { fontSize: Typography.fontSizes.sm, color: Colors.secondary, fontWeight: '600', flex: 1 },
});
