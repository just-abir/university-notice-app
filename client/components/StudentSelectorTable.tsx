import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { studentsAPI } from '@/services/api';

interface StudentSelectorTableProps {
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

const YEAR_OPTIONS = [
  { label: '1st Year', value: 1 },
  { label: '2nd Year', value: 2 },
  { label: '3rd Year', value: 3 },
  { label: '4th Year', value: 4 },
  { label: 'Masters', value: 5 },
];

export const StudentSelectorTable: React.FC<StudentSelectorTableProps> = ({
  selectedIds,
  onSelectionChange,
}) => {
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ── Fetch students when years change ────────────────────────────────────────
  const fetchStudents = useCallback(async (years: Set<number>) => {
    if (years.size === 0) {
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      const data = await studentsAPI.getByYear(Array.from(years));
      setStudents(data.students);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleYearToggle = useCallback(
    (year: number) => {
      setSelectedYears((prev) => {
        const next = new Set(prev);
        if (next.has(year)) {
          next.delete(year);
        } else {
          next.add(year);
        }
        fetchStudents(next);
        return next;
      });
    },
    [fetchStudents]
  );

  // ── Filter students by search ───────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.roll && s.roll.toLowerCase().includes(q)) ||
        (s.registrationNo && s.registrationNo.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // ── Selection handlers ──────────────────────────────────────────────────────
  const handleToggleStudent = useCallback(
    (studentId: string) => {
      const next = new Set(selectedIds);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange]
  );

  const handleSelectAll = useCallback(() => {
    const next = new Set(selectedIds);
    const allVisible = filteredStudents.map((s) => s._id);
    const allSelected = allVisible.every((id) => next.has(id));

    if (allSelected) {
      // Deselect all visible
      allVisible.forEach((id) => next.delete(id));
    } else {
      // Select all visible
      allVisible.forEach((id) => next.add(id));
    }
    onSelectionChange(next);
  }, [selectedIds, filteredStudents, onSelectionChange]);

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.has(s._id));

  const someVisibleSelected =
    !allVisibleSelected && filteredStudents.some((s) => selectedIds.has(s._id));

  // ── Toggle info expand ──────────────────────────────────────────────────────
  const handleToggleExpand = useCallback((studentId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Year Selector Buttons ──────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Select Year(s)</Text>
      <View style={styles.yearRow}>
        {YEAR_OPTIONS.map((y) => {
          const isSelected = selectedYears.has(y.value);
          return (
            <TouchableOpacity
              key={y.value}
              style={[styles.yearBtn, isSelected && styles.yearBtnSelected]}
              onPress={() => handleYearToggle(y.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSelected ? 'school' : 'school-outline'}
                size={14}
                color={isSelected ? Colors.white : Colors.textMuted}
              />
              <Text
                style={[
                  styles.yearLabel,
                  isSelected && styles.yearLabelSelected,
                ]}
              >
                {y.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Search Bar ─────────────────────────────────────────────────────── */}
      {selectedYears.size > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or roll..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={16}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      )}

      {/* ── Student Table ──────────────────────────────────────────────────── */}
      {!loading && selectedYears.size > 0 && (
        <>
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={32}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No students match your search'
                  : 'No students found for the selected year(s)'}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* ── Table Header ───────────────────────────────────────── */}
                <View style={styles.tableHeader}>
                  <TouchableOpacity
                    style={styles.checkboxCol}
                    onPress={handleSelectAll}
                  >
                    <Ionicons
                      name={
                        allVisibleSelected
                          ? 'checkbox'
                          : someVisibleSelected
                          ? 'remove-outline'
                          : 'square-outline'
                      }
                      size={20}
                      color={
                        allVisibleSelected || someVisibleSelected
                          ? Colors.primary
                          : Colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                  <Text style={[styles.headerText, styles.serialCol]}>#</Text>
                  <Text style={[styles.headerText, styles.photoCol]}>
                    Photo
                  </Text>
                  <Text style={[styles.headerText, styles.nameCol]}>Name</Text>
                  <Text style={[styles.headerText, styles.rollCol]}>Roll</Text>
                  <Text style={[styles.headerText, styles.regCol]}>
                    Reg. No
                  </Text>
                  <Text style={[styles.headerText, styles.genderCol]}>
                    Gender
                  </Text>
                  <Text style={[styles.headerText, styles.infoCol]}>Info</Text>
                </View>

                {/* ── Table Rows ─────────────────────────────────────────── */}
                {filteredStudents.map((student, index) => {
                  const isChecked = selectedIds.has(student._id);
                  const isEven = index % 2 === 0;
                  const isExpanded = expandedRows.has(student._id);

                  return (
                    <View key={student._id}>
                      <TouchableOpacity
                        style={[
                          styles.tableRow,
                          isEven && styles.tableRowEven,
                          isChecked && styles.tableRowChecked,
                        ]}
                        onPress={() => handleToggleStudent(student._id)}
                        activeOpacity={0.7}
                      >
                        {/* Checkbox */}
                        <View style={styles.checkboxCol}>
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={
                              isChecked ? Colors.primary : Colors.textMuted
                            }
                          />
                        </View>

                        {/* Serial */}
                        <Text style={[styles.cellText, styles.serialCol]}>
                          {index + 1}
                        </Text>

                        {/* Photo */}
                        <View style={styles.photoCol}>
                          {student.profilePicture ? (
                            <Image
                              source={{ uri: student.profilePicture }}
                              style={styles.avatar}
                            />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Ionicons
                                name="person"
                                size={16}
                                color={Colors.textMuted}
                              />
                            </View>
                          )}
                        </View>

                        {/* Name */}
                        <Text
                          style={[styles.cellText, styles.nameCol]}
                          numberOfLines={1}
                        >
                          {student.name}
                        </Text>

                        {/* Roll */}
                        <Text
                          style={[
                            styles.cellText,
                            styles.rollCol,
                            styles.monoText,
                          ]}
                          numberOfLines={1}
                        >
                          {student.roll || '—'}
                        </Text>

                        {/* Reg No */}
                        <Text
                          style={[
                            styles.cellText,
                            styles.regCol,
                            styles.monoText,
                          ]}
                          numberOfLines={1}
                        >
                          {student.registrationNo || '—'}
                        </Text>

                        {/* Gender */}
                        <View style={styles.genderCol}>
                          <View
                            style={[
                              styles.genderBadge,
                              student.gender === 'MALE'
                                ? styles.genderMale
                                : student.gender === 'FEMALE'
                                ? styles.genderFemale
                                : styles.genderOther,
                            ]}
                          >
                            <Ionicons
                              name={
                                student.gender === 'MALE'
                                  ? 'male'
                                  : student.gender === 'FEMALE'
                                  ? 'female'
                                  : 'person'
                              }
                              size={10}
                              color={Colors.white}
                            />
                            <Text style={styles.genderText}>
                              {student.gender === 'MALE'
                                ? 'M'
                                : student.gender === 'FEMALE'
                                ? 'F'
                                : '?'}
                            </Text>
                          </View>
                        </View>

                        {/* Info Toggle */}
                        <TouchableOpacity
                          style={styles.infoCol}
                          onPress={() => handleToggleExpand(student._id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name={
                              isExpanded
                                ? 'chevron-up-circle'
                                : 'information-circle-outline'
                            }
                            size={20}
                            color={Colors.primary}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>

                      {/* ── Expanded Info Row ────────────────────────────── */}
                      {isExpanded && (
                        <View style={styles.expandedRow}>
                          <View style={styles.infoItem}>
                            <Ionicons
                              name="mail-outline"
                              size={12}
                              color={Colors.textMuted}
                            />
                            <Text style={styles.infoText}>
                              {student.email || '—'}
                            </Text>
                          </View>
                          <View style={styles.infoItem}>
                            <Ionicons
                              name="call-outline"
                              size={12}
                              color={Colors.textMuted}
                            />
                            <Text style={styles.infoText}>
                              {student.phone || '—'}
                            </Text>
                          </View>
                          <View style={styles.infoItem}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color={Colors.textMuted}
                            />
                            <Text style={styles.infoText}>
                              {student.address || '—'}
                            </Text>
                          </View>
                          <View style={styles.infoItem}>
                            <Ionicons
                              name="calendar-outline"
                              size={12}
                              color={Colors.textMuted}
                            />
                            <Text style={styles.infoText}>
                              Year {student.year}
                              {student.batch ? ` · Batch ${student.batch}` : ''}
                              {student.semester
                                ? ` · Sem ${student.semester}`
                                : ''}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* ── Selection Counter ────────────────────────────────────────── */}
          <View style={styles.selectionBar}>
            <Ionicons name="people" size={16} color={Colors.secondary} />
            <Text style={styles.selectionText}>
              {selectedIds.size === 0
                ? 'No students selected'
                : `${selectedIds.size} student${
                    selectedIds.size !== 1 ? 's' : ''
                  } selected`}
            </Text>
            {selectedIds.size > 0 && (
              <TouchableOpacity
                onPress={() => onSelectionChange(new Set())}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* ── Empty state when no years selected ─────────────────────────────── */}
      {!loading && selectedYears.size === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>
            Select one or more years above to browse students
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────────
const COL_WIDTHS = {
  checkbox: 44,
  serial: 36,
  photo: 44,
  name: 130,
  roll: 100,
  reg: 120,
  gender: 56,
  info: 44,
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  // ── Year Buttons ──────────────────────────────────────────────────────────
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  yearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  yearBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  yearLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.semibold,
  },
  yearLabelSelected: {
    color: Colors.white,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    paddingVertical: 10,
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 8,
  },
  emptyText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Table Header ──────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.white,
    fontWeight: Typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Table Row ─────────────────────────────────────────────────────────────
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  tableRowEven: {
    backgroundColor: Colors.surfaceLight,
  },
  tableRowChecked: {
    backgroundColor: Colors.primaryGhost,
  },

  // ── Column widths ─────────────────────────────────────────────────────────
  checkboxCol: {
    width: COL_WIDTHS.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialCol: {
    width: COL_WIDTHS.serial,
    textAlign: 'center',
  },
  photoCol: {
    width: COL_WIDTHS.photo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    width: COL_WIDTHS.name,
    paddingHorizontal: 4,
  },
  rollCol: {
    width: COL_WIDTHS.roll,
    paddingHorizontal: 4,
  },
  regCol: {
    width: COL_WIDTHS.reg,
    paddingHorizontal: 4,
  },
  genderCol: {
    width: COL_WIDTHS.gender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    width: COL_WIDTHS.info,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Cell content ──────────────────────────────────────────────────────────
  cellText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
  },
  monoText: {
    fontVariant: ['tabular-nums'],
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceBorder,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },

  // ── Gender Badge ──────────────────────────────────────────────────────────
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  genderMale: {
    backgroundColor: 'rgba(99, 145, 255, 0.7)',
  },
  genderFemale: {
    backgroundColor: 'rgba(255, 99, 177, 0.7)',
  },
  genderOther: {
    backgroundColor: Colors.textMuted,
  },
  genderText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: Typography.fontWeights.bold,
  },

  // ── Expanded Info ─────────────────────────────────────────────────────────
  expandedRow: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.surfaceBorder,
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },

  // ── Selection Bar ─────────────────────────────────────────────────────────
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.secondaryGhost,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.secondary,
    padding: 12,
    marginTop: Spacing.sm,
  },
  selectionText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.secondary,
    fontWeight: Typography.fontWeights.semibold,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  clearBtnText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    fontWeight: Typography.fontWeights.semibold,
  },
});
