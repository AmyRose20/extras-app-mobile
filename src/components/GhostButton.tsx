import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

// The see-through outline button, e.g. "Back".
//   <GhostButton title="Back" onPress={onBack} />
type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function GhostButton({ title, onPress, disabled = false, style }: Props) {
  return (
    <TouchableOpacity style={[styles.button, disabled && { opacity: 0.6 }, style]} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.ghostBorder,
    borderRadius: radius.control,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  text: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default GhostButton;