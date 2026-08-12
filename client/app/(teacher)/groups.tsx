import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { groupsAPI, studentsAPI } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { StudentGroup, User } from '@/types';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);

  // Modal state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await groupsAPI.getGroups();
      setGroups(data.groups);
    } catch {
      Alert.alert('Error', 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openCreateModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDesc('');
    setSelectedMembers([]);
    setStudentSearch('');
    setSearchResults([]);
    setModalVisible(true);
  };

  const openEditModal = (group: StudentGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDesc(group.description ?? '');
    setSelectedMembers(group.members ?? []);
    setStudentSearch('');
    setSearchResults([]);
    setModalVisible(true);
  };

  const handleStudentSearch = useCallback(async (q: string) => {
    setStudentSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await studentsAPI.search({ name: q, limit: 10 });
      setSearchResults(data.students);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const toggleMember = (student: User) => {
    setSelectedMembers((prev) =>
      prev.find((m) => m._id === student._id)
        ? prev.filter((m) => m._id !== student._id)
        : [...prev, student]
    );
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) { Alert.alert('Error', 'Group name is required.'); return; }
    setSaving(true);
    try {
      const memberIds = selectedMembers.map((m) => m._id);
      if (editingGroup) {
        await groupsAPI.updateGroup(editingGroup._id, { name: groupName.trim(), description: groupDesc.trim(), memberIds });
      } else {
        await groupsAPI.createGroup({ name: groupName.trim(), description: groupDesc.trim() || undefined, memberIds });
      }
      setModalVisible(false);
      fetchGroups();
    } catch {
      Alert.alert('Error', 'Failed to save group.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = (group: StudentGroup) => {
    Alert.alert('Delete Group', `Delete "${group.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await groupsAPI.deleteGroup(group._id);
            fetchGroups();
          } catch {
            Alert.alert('Error', 'Failed to delete group.');
          }
        },
      },
    ]);
  };

  const renderGroup = ({ item }: { item: StudentGroup }) => (
    <View style={styles.groupCard}>
      <LinearGradient colors={[Colors.primaryGhost, Colors.transparent]} style={styles.groupAccent} />
      <View style={styles.groupBody}>
        <View style={styles.groupTopRow}>
          <View style={styles.groupIconBg}>
            <Ionicons name="people" size={20} color={Colors.primary} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.description ? <Text style={styles.groupDesc}>{item.description}</Text> : null}
          </View>
          <View style={styles.groupActions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteGroup(item)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.memberRow}>
          {(item.members ?? []).slice(0, 5).map((m, i) => (
            <View key={m._id} style={[styles.memberAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
              <Avatar name={m.name} uri={m.profilePicture} size="xs" role="STUDENT" />
            </View>
          ))}
          <Text style={styles.memberCount}>
            {(item.memberCount ?? item.members?.length ?? 0)} member{(item.memberCount ?? item.members?.length ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><LoadingSpinner size={36} /></View>;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Groups</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g._id}
        renderItem={renderGroup}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptySubtitle}>Create a custom group to quickly target specific students in future notices.</Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={openCreateModal}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.createFirstText}>Create First Group</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingGroup ? 'Edit Group' : 'New Group'}</Text>
            <TouchableOpacity onPress={handleSaveGroup} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={styles.modalSaveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.modalInput}
              placeholder="Group Name *"
              placeholderTextColor={Colors.textMuted}
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={[styles.modalInput, { minHeight: 64 }]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textMuted}
              value={groupDesc}
              onChangeText={setGroupDesc}
              multiline
            />

            <Text style={styles.modalSectionLabel}>Add Students</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Search by name or roll..."
              placeholderTextColor={Colors.textMuted}
              value={studentSearch}
              onChangeText={handleStudentSearch}
            />

            {searching && <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />}

            {searchResults.map((s) => {
              const isSelected = selectedMembers.some((m) => m._id === s._id);
              return (
                <TouchableOpacity key={s._id} style={[styles.studentResult, isSelected && styles.studentResultSelected]} onPress={() => toggleMember(s)}>
                  <Avatar name={s.name} uri={s.profilePicture} size="sm" role="STUDENT" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentMeta}>Roll: {s.roll} · Year {s.year}</Text>
                  </View>
                  <Ionicons name={isSelected ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={isSelected ? Colors.success : Colors.textMuted} />
                </TouchableOpacity>
              );
            })}

            {selectedMembers.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedLabel}>Selected ({selectedMembers.length})</Text>
                {selectedMembers.map((m) => (
                  <View key={m._id} style={styles.selectedMember}>
                    <Avatar name={m.name} size="xs" role="STUDENT" />
                    <Text style={styles.selectedMemberName}>{m.name}</Text>
                    <TouchableOpacity onPress={() => toggleMember(m)}>
                      <Ionicons name="close-circle" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md },
  groupCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 12, flexDirection: 'row', overflow: 'hidden' },
  groupAccent: { width: 4 },
  groupBody: { flex: 1, padding: 14 },
  groupTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  groupIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  groupDesc: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  groupActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberAvatar: { zIndex: 1 },
  memberCount: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  createFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryGhost, borderRadius: BorderRadius.full, paddingHorizontal: 20, paddingVertical: 10 },
  createFirstText: { color: Colors.primary, fontWeight: '600', fontSize: Typography.fontSizes.sm },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
    paddingTop: 60,
  },
  modalTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  modalSaveText: { fontSize: Typography.fontSizes.md, color: Colors.primary, fontWeight: Typography.fontWeights.bold },
  modalScroll: { flex: 1, padding: Spacing.md },
  modalInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: 12, color: Colors.textPrimary, fontSize: Typography.fontSizes.md, marginBottom: 12,
  },
  modalSectionLabel: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  studentResult: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 6,
  },
  studentResultSelected: { borderColor: Colors.success, backgroundColor: Colors.successGhost },
  studentName: { fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, fontWeight: '600' },
  studentMeta: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },
  selectedSection: { marginTop: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm },
  selectedLabel: { fontSize: Typography.fontSizes.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 8 },
  selectedMember: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  selectedMemberName: { flex: 1, fontSize: Typography.fontSizes.sm, color: Colors.textPrimary },
});
