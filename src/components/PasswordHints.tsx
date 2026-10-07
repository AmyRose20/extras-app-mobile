import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Live checklist shown under a "new password" box. These are the easy-to-see rules;
// the backend also blocks common passwords and ones containing your name or email.
export function passwordChecks(password: string) {
  return [
    { label: 'At least 10 characters', ok: password.length >= 10 },
    { label: 'At least one letter and one number', ok: /[a-zA-Z]/.test(password) && /[0-9]/.test(password) },
  ];
}

type Props = {
  password: string;
};

function PasswordHints({ password }: Props) {
  return (
    <View style={hintStyles.wrapper}>
      {passwordChecks(password).map((check) => (
        <Text key={check.label} style={[hintStyles.item, check.ok && hintStyles.itemOk]}>
          {check.ok ? '✓' : '•'} {check.label}
        </Text>
      ))}
      <Text style={hintStyles.item}>• Not a common password, and not your name or email</Text>
    </View>
  );
}

const hintStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  item: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 2,
  },
  itemOk: {
    color: '#8fd9a8',
  },
});

export default PasswordHints;