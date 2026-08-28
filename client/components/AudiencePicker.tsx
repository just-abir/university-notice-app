import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TargetAudience } from '@/types';
import { StudentSelectorTable } from './StudentSelectorTable';

interface AudiencePickerProps {
  value: TargetAudience | null;
  onChange: (audience: TargetAudience) => void;
}

export const AudiencePicker: React.FC<AudiencePickerProps> = ({ value, onChange }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(value?.selectedIds || [])
  );

  // Synchronize when value changes externally
  useEffect(() => {
    if (value?.type === 'SELECTED_STUDENTS' && value.selectedIds) {
      setSelectedIds(new Set(value.selectedIds));
    }
  }, [value]);

  const handleSelectionChange = useCallback(
    (newSelected: Set<string>) => {
      setSelectedIds(newSelected);
      onChange({
        type: 'SELECTED_STUDENTS',
        selectedIds: Array.from(newSelected),
      });
    },
    [onChange]
  );

  return (
    <View style={styles.container}>
      <StudentSelectorTable
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
