import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TargetAudience, AudienceType, StudentGroup } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';
import { studentsAPI } from '@/services/api';

interface AudiencePickerProps {
  value: TargetAudience | null;
  onChange: (audience: TargetAudience) => void;
  groups?: StudentGroup[];
}

interface AudienceOption {
  type: AudienceType;
  label: string;
  icon: string;
  description: string;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  { type: 'SPECIFIC_ROLL', label: 'Specific Roll(s)', icon: 'person', description: 'Target by roll number' },
  { type: 'ROLL_RANGE', label: 'Roll Range', icon: 'people', description: 'From roll to roll' },
  { type: 'YEAR_ALL', label: 'All (Year)', icon: 'school', description: 'All students of a year' },
  { type: 'YEAR_FEMALE', label: 'Female (Year)', icon: 'woman', description: 'Female students of a year' },
  { type: 'ALL_CSE', label: 'All CSE', icon: 'globe', description: 'Every CSE student' },
  { type: 'ALL_CSE_FEMALE', label: 'All CSE Female', icon: 'heart', description: 'All female CSE students' },
  { type: 'CUSTOM_GROUP', label: 'Custom Group', icon: 'star', description: 'Teacher-defined group' },
];

const YEAR_OPTIONS = [
  { label: '1st Year', value: 1 },
  { label: '2nd Year', value: 2 },
  { label: '3rd Year', value: 3 },
  { label: '4th Year', value: 4 },
  { label: 'Masters', value: 5 },
];

const getAudienceSummary = (audience: TargetAudience, groups?: StudentGroup[]): string => {
  switch (audience.type) {
    case 'SPECIFIC_ROLL':
      return `Rolls: ${(audience.rolls ?? []).join(', ')}`;
    case 'ROLL_RANGE':
      return `Range: ${audience.rollStart ?? '?'} – ${audience.rollEnd ?? '?'}`;
    case 'YEAR_ALL':
      return `All Year ${audience.year} Students`;
    case 'YEAR_FEMALE':
      return `Year ${audience.year} Female Students`;
    case 'ALL_CSE':
      return 'All CSE Students';
    case 'ALL_CSE_FEMALE':
      return 'All CSE Female Students';
    case 'CUSTOM_GROUP': {
      const g = groups?.find((g) => g._id === audience.customGroupId);
      return g ? `Group: ${g.name}` : 'Custom Group';
    }
    default:
      return '';
  }
};

export const AudiencePicker: React.FC<AudiencePickerProps> = ({ value, onChange, groups = [] }) => {
  const [selectedType, setSelectedType] = useState<AudienceType | null>(value?.type ?? null);
  const [rollInput, setRollInput] = useState(value?.rolls?.join(', ') ?? '');
  const [rollStart, setRollStart] = useState(value?.rollStart ?? '');
  const [rollEnd, setRollEnd] = useState(value?.rollEnd ?? '');
  const [selectedYear, setSelectedYear] = useState<number>(value?.year ?? 1);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(value?.customGroupId ?? '');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const buildAudience = useCallback((): TargetAudience | null => {
    if (!selectedType) return null;
    const base: TargetAudience = { type: selectedType };
    switch (selectedType) {
      case 'SPECIFIC_ROLL':
        base.rolls = rollInput.split(',').map((r) => r.trim()).filter(Boolean);
        break;
      case 'ROLL_RANGE':
        base.rollStart = rollStart;
        base.rollEnd = rollEnd;
        break;
      case 'YEAR_ALL':
      case 'YEAR_FEMALE':
        base.year = selectedYear;
        break;
      case 'CUSTOM_GROUP':
        base.customGroupId = selectedGroupId;
        break;
    }
    return base;
  }, [selectedType, rollInput, rollStart, rollEnd, selectedYear, selectedGroupId]);

  const handlePreview = useCallback(async () => {
    const audience = buildAudience();
    if (!audience) return;
    setPreviewLoading(true);
    try {
      const data = await studentsAPI.resolveAudience(audience);
      setPreviewCount(data.count);
      onChange(audience);
    } catch {
      setPreviewCount(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [buildAudience, onChange]);

  const handleTypeSelect = (type: AudienceType) => {
    setSelectedType(type);
    setPreviewCount(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Target Audience</Text>

      {/* Audience Type Grid */}
      <View style={styles.grid}>
        {AUDIENCE_OPTIONS.map((opt) => {
          const isSelected = selectedType === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => handleTypeSelect(opt.type)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={opt.icon as any}
                size={22}
                color={isSelected ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.optionDesc}>{opt.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Config Panel */}
      {selectedType && (
        <View style={styles.configPanel}>
          {selectedType === 'SPECIFIC_ROLL' && (
            <TextInput
              style={styles.configInput}
              placeholder="Enter rolls separated by commas (e.g. 2021001, 2021002)"
              placeholderTextColor={Colors.textMuted}
              value={rollInput}
              onChangeText={setRollInput}
              multiline
            />
          )}

          {selectedType === 'ROLL_RANGE' && (
            <View style={styles.rangeRow}>
              <TextInput
                style={[styles.configInput, styles.rangeInput]}
                placeholder="From Roll"
                placeholderTextColor={Colors.textMuted}
                value={rollStart}
                onChangeText={setRollStart}
              />
              <Text style={styles.rangeDash}>–</Text>
              <TextInput
                style={[styles.configInput, styles.rangeInput]}
                placeholder="To Roll"
                placeholderTextColor={Colors.textMuted}
                value={rollEnd}
                onChangeText={setRollEnd}
              />
            </View>
          )}

          {(selectedType === 'YEAR_ALL' || selectedType === 'YEAR_FEMALE') && (
            <View style={styles.yearRow}>
              {YEAR_OPTIONS.map((y) => (
                <TouchableOpacity
                  key={y.value}
                  style={[styles.yearBtn, selectedYear === y.value && styles.yearBtnSelected]}
                  onPress={() => setSelectedYear(y.value)}
                >
                  <Text style={[styles.yearLabel, selectedYear === y.value && styles.yearLabelSelected]}>
                    {y.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedType === 'CUSTOM_GROUP' && (
            <View>
              {groups.length === 0 ? (
                <Text style={styles.emptyGroups}>No custom groups yet. Create one in the Groups tab.</Text>
              ) : (
                groups.map((g) => (
                  <TouchableOpacity
                    key={g._id}
                    style={[styles.groupItem, selectedGroupId === g._id && styles.groupItemSelected]}
                    onPress={() => setSelectedGroupId(g._id)}
                  >
                    <Ionicons name="people" size={16} color={selectedGroupId === g._id ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.groupName, selectedGroupId === g._id && styles.groupNameSelected]}>
                      {g.name}
                    </Text>
                    <Text style={styles.groupCount}>{g.memberCount ?? g.members?.length ?? 0} members</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Preview Button */}
          <TouchableOpacity style={styles.previewBtn} onPress={handlePreview} disabled={previewLoading}>
            {previewLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="eye-outline" size={16} color={Colors.primary} />
            )}
            <Text style={styles.previewBtnText}>Preview Recipients</Text>
          </TouchableOpacity>

          {previewCount !== null && (
            <View style={styles.previewResult}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.previewResultText}>
                {previewCount === 0
                  ? 'No students match this criteria'
                  : `${previewCount} student${previewCount !== 1 ? 's' : ''} will receive this notice`}
              </Text>
            </View>
          )}

          {value && (
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Selected: </Text>
              <Text style={styles.summaryValue}>{getAudienceSummary(value, groups)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: Spacing.md },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    width: '30%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGhost,
  },
  optionLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.semibold,
    textAlign: 'center',
  },
  optionLabelSelected: { color: Colors.primary },
  optionDesc: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  configPanel: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: 10,
  },
  configInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.sm,
    padding: 10,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    minHeight: 44,
  },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeInput: { flex: 1 },
  rangeDash: { color: Colors.textMuted, fontSize: Typography.fontSizes.lg },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  yearBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  yearLabel: { fontSize: Typography.fontSizes.sm, color: Colors.textSecondary },
  yearLabelSelected: { color: Colors.primary, fontWeight: Typography.fontWeights.semibold },
  emptyGroups: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.sm },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 6,
  },
  groupItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  groupName: { flex: 1, fontSize: Typography.fontSizes.sm, color: Colors.textSecondary },
  groupNameSelected: { color: Colors.primary },
  groupCount: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  previewBtnText: { fontSize: Typography.fontSizes.sm, color: Colors.primary },
  previewResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successGhost,
    padding: 10,
    borderRadius: BorderRadius.sm,
  },
  previewResultText: { fontSize: Typography.fontSizes.sm, color: Colors.success },
  summary: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  summaryLabel: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },
  summaryValue: { fontSize: Typography.fontSizes.xs, color: Colors.primary, fontWeight: Typography.fontWeights.semibold },
});
