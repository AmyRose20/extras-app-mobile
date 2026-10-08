import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as authApi from '../api/authApi';
import { ApiError, errorMessage } from '../api/client';
import PasswordHints, { passwordChecks } from '../components/PasswordHints';

// Forgot password, in two stages:
//   1. enter your email → we email a 6-digit code
//   2. enter the code + a new password
type Props = {
  initialEmail: string; // whatever was typed on the login screen
  onBack: () => void;
  onDone: (email: string) => void; // password reset → back to login with this email filled in
};

function ForgotPasswordScreen({ initialEmail, onBack, onDone }: Props) {
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(''); // friendly info (e.g. "we've sent a code")
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ----- Stage 1: ask for a code -----
  const requestCode = async () => {
    setEmailError('');
    setNotice('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.requestPasswordReset(email.trim());
      setNotice(data.message);
      setStage('code');
    } catch (error) {
      setEmailError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ----- Stage 2: code + new password -----
  const resetPassword = async () => {
    setCodeError('');
    setPasswordError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('Please enter the 6-digit code from the email.');
      return;
    }
    if (!passwordChecks(newPassword).every((check) => check.ok)) {
      setPasswordError('Your new password doesn\'t meet the rules below yet.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The two passwords don\'t match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      onDone(email.trim());
    } catch (error) {
      // The backend says which box the problem is in
      if (error instanceof ApiError && error.data?.field === 'newPassword') {
        setPasswordError(error.message);
      } else {
        setCodeError(errorMessage(error));
      }
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
      style={forgotStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={forgotStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={forgotStyles.title}>Reset your password</Text>

          <View style={forgotStyles.card}>
            {stage === 'email' ? (
              <>
                <Text style={forgotStyles.text}>
                  Enter the email you log in with, and we'll send you a 6-digit code.
                </Text>
                <TextInput
                  style={forgotStyles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                <Text style={forgotStyles.fieldError}>{emailError || ' '}</Text>
                <TouchableOpacity
                  style={[forgotStyles.button, loading && { opacity: 0.6 }]}
                  onPress={requestCode}
                  disabled={loading}
                >
                  <Text style={forgotStyles.buttonText}>{loading ? 'Sending...' : 'Send code'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {notice ? <Text style={forgotStyles.notice}>{notice}</Text> : null}
                <Text style={forgotStyles.hint}>Can't see it? Check your spam folder.</Text>

                <Text style={forgotStyles.label}>Code</Text>
                <TextInput
                  style={[forgotStyles.input, forgotStyles.codeInput]}
                  placeholder="123456"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={forgotStyles.fieldError}>{codeError || ' '}</Text>

                <Text style={forgotStyles.label}>New password</Text>
                <TextInput
                  style={forgotStyles.input}
                  placeholder="New password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  style={forgotStyles.input}
                  placeholder="Type it again"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={forgotStyles.linkText}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
                </TouchableOpacity>

                <PasswordHints password={newPassword} />
                <Text style={forgotStyles.fieldError}>{passwordError || ' '}</Text>

                <TouchableOpacity
                  style={[forgotStyles.button, loading && { opacity: 0.6 }]}
                  onPress={resetPassword}
                  disabled={loading}
                >
                  <Text style={forgotStyles.buttonText}>{loading ? 'Saving...' : 'Reset password'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStage('email');
                    setCode('');
                    setCodeError('');
                  }}
                >
                  <Text style={[forgotStyles.linkText, { marginTop: 14 }]}>Didn't get a code? Send a new one</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity style={forgotStyles.buttonGhost} onPress={onBack}>
            <Text style={forgotStyles.buttonGhostText}>Back to log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const forgotStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
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
  text: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 14,
  },
  notice: {
    fontSize: 14,
    color: '#8fd9a8',
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 14,
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
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
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

export default ForgotPasswordScreen;