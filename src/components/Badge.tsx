import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

// A small red bubble showing how many NEW things are waiting (e.g. new invites).
// Shows nothing at all when the count is 0, and "9+" for big numbers.
type Props = {
  count: number;
  style?: StyleProp<ViewStyle>; // optional: change where it sits (e.g. a different corner)
};

function Badge({ count, style }: Props) {
  if (count <= 0) return null;

  return (
    <View style={[badgeStyles.badge, style]} accessibilityLabel={`${count} new`}>
      <Text style={badgeStyles.text}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    // By default it sits on the top-right corner of whatever it's placed inside
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#fff', // white ring so it stands out on the gold buttons
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default Badge;