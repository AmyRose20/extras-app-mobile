import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as authApi from '../api/authApi';
import { ApiError, errorMessage } from '../api/client';
import PasswordHints, { passwordChecks } from '../components/PasswordHints';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import GhostButton from '../components/GhostButton';
import TextField from '../components/TextField';
import { text } from '../theme';

// Change password while logged in. Other phones are logged out;
// this phone gets a fresh login token so it stays logged in.
type Props = {
  token: string;
  onChanged: (newToken: string) => void;
  onBack: () => void;
};

function ChangePasswordScreen({ token, onChanged, onBack }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [currentError, setCurrentError] = useState('');
  const [newError, setNewError] = useState('');

  const save = async () => {
    setCurrentError('');
    setNewError('');

    if (!currentPassword) {
      setCurrentError('Please enter your current password.');
      return;
    }
    if (!passwordChecks(newPassword).every((check) => check.ok)) {
      setNewError("Your new password doesn't meet the rules below yet.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setNewError("The two new passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.changePassword(currentPassword, newPassword);
      onChanged(data.token);
    } catch (error) {
      // The backend says which box the problem is in
      if (error instanceof ApiError && error.data?.field === 'currentPassword') {
        setCurrentError(error.message);
      } else {
        setNewError(errorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <Text style={text.title}>Change Password</Text>

      <GlassCard style={changeStyles.card}>
        <Text style={text.label}>Current password</Text>
        <TextField
          placeholder="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={text.fieldError}>{currentError || ' '}</Text>

        <Text style={text.label}>New password</Text>
        <TextField
          placeholder="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          placeholder="Type the new password again"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={[text.link, changeStyles.showLink]}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
        </TouchableOpacity>

        <PasswordHints password={newPassword} />
        <Text style={text.fieldError}>{newError || ' '}</Text>

        <Text style={[text.muted, changeStyles.note]}>
          For your security, you'll be logged out on any other phones.
        </Text>

        <GoldButton
          title="Change password"
          loadingTitle="Saving..."
          loading={loading}
          onPress={save}
          style={changeStyles.lastInCard}
        />
      </GlassCard>

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const changeStyles = StyleSheet.create({
  card: {
    padding: 18,
  },
  showLink: {
    fontWeight: 'normal',
    marginBottom: 10,
  },
  note: {
    marginBottom: 12,
  },
  lastInCard: {
    marginBottom: 0,
  },
});

export default ChangePasswordScreen;