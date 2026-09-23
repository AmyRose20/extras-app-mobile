import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles';

type Props = {
  isHome: boolean;
  onGoHome: () => void;
  onLogout: () => void;
};

function HeaderMenu({ isHome, onGoHome, onLogout }: Props) {
  const [open, setOpen] = useState(false);

  const handleGoHome = () => {
    if (isHome) return;
    setOpen(false);
    onGoHome();
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <View style={localStyles.wrapper}>
        <TouchableOpacity style={localStyles.hamburger} onPress={() => setOpen(!open)}>
        <View style={localStyles.bar} />
        <View style={localStyles.bar} />
        <View style={localStyles.bar} />
      </TouchableOpacity>

      {open && (
        <View style={localStyles.dropdown}>
          <TouchableOpacity
            style={localStyles.dropdownItem}
            onPress={handleGoHome}
            disabled={isHome}
          >
            <Text style={[localStyles.dropdownText, isHome && localStyles.disabledText]}>
              Home
            </Text>
          </TouchableOpacity>
          <View style={localStyles.divider} />
          <TouchableOpacity style={localStyles.dropdownItem} onPress={handleLogout}>
            <Text style={[localStyles.dropdownText, localStyles.logoutText]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
      wrapper: {
    position: 'absolute',
    top: spacing.lg + spacing.md - 2,
    right: spacing.md,
    zIndex: 100,
    elevation: 100,
  },
  hamburger: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
    marginVertical: 1.5,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 130,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  disabledText: {
    color: colors.border,
  },
  logoutText: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default HeaderMenu;