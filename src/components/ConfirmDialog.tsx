import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;      // leave out (with onConfirm) for an info-only dialog
  onConfirm?: () => void;
  onCancel: () => void;
  cancelText?: string;       // defaults to "Cancel"
  destructive?: boolean;     // red confirm button for risky actions
};

// An in-app "Are you sure?" dialog, styled to match the dusk theme.
// It's drawn on top of the screen as a normal View (not a native Android popup).
function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  cancelText = 'Cancel',
  destructive = false,
}: Props) {
  if (!visible) return null;

  return (
    <View style={dialogStyles.backdrop}>
      <View style={dialogStyles.card}>
        <Text style={dialogStyles.title}>{title}</Text>
        <Text style={dialogStyles.message}>{message}</Text>

        <View style={dialogStyles.buttonRow}>
        <TouchableOpacity style={dialogStyles.cancelButton} onPress={onCancel}>
            <Text style={dialogStyles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
          {onConfirm && confirmText ? (
            <TouchableOpacity
              style={[dialogStyles.confirmButton, destructive && dialogStyles.confirmButtonDanger]}
              onPress={onConfirm}
            >
              <Text style={[dialogStyles.confirmText, destructive && dialogStyles.confirmTextDanger]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const dialogStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute', // covers the whole screen
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,// covers the whole screen
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
    elevation: 100,
  },
  card: {
    width: '100%',
    backgroundColor: '#241d3d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#d99c4a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  confirmButtonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff9d9d',
  },
  confirmText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmTextDanger: {
    color: '#ff9d9d',
  },
});

export default ConfirmDialog;