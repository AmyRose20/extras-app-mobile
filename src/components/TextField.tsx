import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

// A TextInput with the app's dark style already on it.
// Takes every normal TextInput prop:
//   <TextField value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
function TextField({ style, placeholderTextColor, ...rest }: TextInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor ?? colors.textFaint}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
});

export default TextField;