import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';
import PasswordHints, { passwordChecks } from '../components/PasswordHints';

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
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        // The backend says which box the problem is in
        if (data.field === 'currentPassword') setCurrentError(data.error);
        else setNewError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      onChanged(data.token);
    } catch (error) {
      setNewError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={changeStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={changeStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={changeStyles.title}>Change Password</Text>

          <View style={changeStyles.card}>
            <Text style={changeStyles.label}>Current password</Text>
            <TextInput
              style={changeStyles.input}
              placeholder="Current password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={changeStyles.fieldError}>{currentError || ' '}</Text>

            <Text style={changeStyles.label}>New password</Text>
            <TextInput
              style={changeStyles.input}
              placeholder="New password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={changeStyles.input}
              placeholder="Type the new password again"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={changeStyles.linkText}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
            </TouchableOpacity>

            <PasswordHints password={newPassword} />
            <Text style={changeStyles.fieldError}>{newError || ' '}</Text>

            <Text style={changeStyles.note}>
              For your security, you'll be logged out on any other phones.
            </Text>

            <TouchableOpacity
              style={[changeStyles.button, loading && { opacity: 0.6 }]}
              onPress={save}
              disabled={loading}
            >
              <Text style={changeStyles.buttonText}>{loading ? 'Saving...' : 'Change password'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={changeStyles.buttonGhost} onPress={onBack}>
            <Text style={changeStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const changeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  fieldError: {
    color: '#ff9d9d',
    fontSize: 12,
    minHeight: 16,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 13,
    color: '#d99c4a',
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
  note: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ChangePasswordScreen;