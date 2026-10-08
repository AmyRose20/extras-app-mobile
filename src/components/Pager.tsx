import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

// "‹ Prev   Page 2 of 5   Next ›" under a long list.
// Shows nothing when everything fits on one page.
//   <Pager page={page} totalPages={totalPages} onChange={goToPage} />
type Props = {
  page: number;
  totalPages: number;
  onChange: (newPage: number) => void;
};

function Pager({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const isFirst = page === 1;
  const isLast = page === totalPages;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.button, isFirst && styles.disabled]}
        onPress={() => onChange(page - 1)}
        disabled={isFirst}
      >
        <Text style={styles.buttonText}>‹ Prev</Text>
      </TouchableOpacity>

      <Text style={styles.label}>
        Page {page} of {totalPages}
      </Text>

      <TouchableOpacity
        style={[styles.button, isLast && styles.disabled]}
        onPress={() => onChange(page + 1)}
        disabled={isLast}
      >
        <Text style={styles.buttonText}>Next ›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  button: {
    borderWidth: 1,
    borderColor: colors.ghostBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.35,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default Pager;