import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

// The main gold button.
//   <GoldButton title="Save" onPress={save} />
//   <GoldButton title="Save" loadingTitle="Saving..." loading={saving} onPress={save} />
type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;       // shows loadingTitle, faded, and can't be pressed
  loadingTitle?: string;   // e.g. "Saving..." (defaults to the normal title)
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode; // anything extra inside the button, e.g. a red badge
};

function GoldButton({ title, onPress, loading = false, loadingTitle, disabled = false, style, children }: Props) {
  const inactive = loading || disabled;
  return (
    <TouchableOpacity
      style={[styles.button, inactive && styles.inactive, style]}
      onPress={onPress}
      disabled={inactive}
    >
      <Text style={styles.text}>{loading ? loadingTitle ?? title : title}</Text>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.control,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  inactive: {
    opacity: 0.6,
  },
  text: {
    color: colors.onGold,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

export default GoldButton;