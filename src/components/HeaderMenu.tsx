import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing } from '../styles';
import Badge from './Badge';

// One extra option in the menu (e.g. "Remove from production")
export type MenuItem = {
  label: string;
  onPress: () => void;
  danger?: boolean;   // shown in red
  disabled?: boolean; // greyed out and not tappable
  badge?: number;     // red count shown next to the label
};

type Props = {
  isHome: boolean;
  onGoHome: () => void;
  onLogout: () => void;
  items?: MenuItem[]; // screen-specific options, shown between Home and Log Out
  badgeCount?: number; // red count on the hamburger icon itself
};

function HeaderMenu({ isHome, onGoHome, onLogout, items = [], badgeCount = 0 }: Props) {
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
        <Badge count={badgeCount} />
      </TouchableOpacity>

      {open && (
        <View style={localStyles.dropdown}>
          <TouchableOpacity style={localStyles.dropdownItem} onPress={handleGoHome} disabled={isHome}>
            <Text style={[localStyles.dropdownText, isHome && localStyles.disabledText]}>Home</Text>
          </TouchableOpacity>

          {items.length > 0 && (
            <>
              <View style={localStyles.divider} />
              {items.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={localStyles.dropdownItem}
                  disabled={item.disabled}
                  onPress={() => {
                    setOpen(false); // close the menu first, then run the action
                    item.onPress();
                  }}
                >
                  <Text
                    style={[
                      localStyles.dropdownText,
                      item.danger && localStyles.dangerText,
                      item.disabled && localStyles.disabledText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.badge ? <Badge count={item.badge} style={localStyles.inlineBadge} /> : null}
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={localStyles.divider} />
          <TouchableOpacity style={localStyles.dropdownItem} onPress={handleLogout}>
            <Text style={[localStyles.dropdownText, localStyles.dangerText]}>Log Out</Text>
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
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginVertical: 1.5,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 210,
    backgroundColor: '#241d3d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row', // label and badge side by side
    alignItems: 'center',
  },
  inlineBadge: {
    // In the menu, the badge sits next to the text instead of on a corner
    position: 'relative',
    top: 0,
    right: 0,
    marginLeft: 8,
    borderColor: '#241d3d', // ring matches the menu background
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.35)',
  },
  dangerText: {
    color: '#ff9d9d',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});

export default HeaderMenu;