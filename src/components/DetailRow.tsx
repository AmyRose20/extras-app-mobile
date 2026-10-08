import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme';

// One "LABEL: value" line on a detail card, e.g.  EMAIL: sam@example.com
//   <DetailRow label="Email">{request.email}</DetailRow>
type Props = {
  label: string;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>; // e.g. { marginBottom: 0 } on the last row
};

function DetailRow({ label, children, style }: Props) {
  return (
    <Text style={[styles.row, style]}>
      <Text style={styles.label}>{label}: </Text>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
});

export default DetailRow;