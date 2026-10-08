import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

// The gold "Saved!" bar that floats at the bottom of the screen for a moment after saving.
// Put it after <ScreenBackground>, inside a View with flex: 1, so it floats above the content.
//   <SavedPopup visible={showSavedPopup} />
function SavedPopup({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.popup}>
      <Text style={styles.text}>Saved!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  text: {
    color: colors.onGold,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default SavedPopup;