import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

// The see-through dark card used on every screen.
//   <GlassCard>...</GlassCard>   or   <GlassCard style={{ padding: 8 }}>...</GlassCard>
type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; // changes for one card (added on top of the normal card style)
};

function GlassCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});

export default GlassCard;