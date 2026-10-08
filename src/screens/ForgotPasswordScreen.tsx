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
import { colors, text } from '../theme';

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
    <ScreenBackground contentStyle={forgotStyles.content}>
      <Text style={[text.title, forgotStyles.title]}>Reset your password</Text>

      <GlassCard style={forgotStyles.card}>
        {stage === 'email' ? (
          <>
            <Text style={forgotStyles.intro}>
              Enter the email you log in with, and we'll send you a 6-digit code.
            </Text>
            <TextField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Text style={text.fieldError}>{emailError || ' '}</Text>
            <GoldButton
              title="Send code"
              loadingTitle="Sending..."
              loading={loading}
              onPress={requestCode}
              style={forgotStyles.lastInCard}
            />
          </>
        ) : (
          <>
            {notice ? <Text style={forgotStyles.notice}>{notice}</Text> : null}
            <Text style={[text.muted, forgotStyles.hint]}>Can't see it? Check your spam folder.</Text>

            <Text style={text.label}>Code</Text>
            <TextField
              style={forgotStyles.codeInput}
              placeholder="123456"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={code}
              onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={text.fieldError}>{codeError || ' '}</Text>

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
              placeholder="Type it again"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={[text.link, forgotStyles.link]}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
            </TouchableOpacity>

            <PasswordHints password={newPassword} />
            <Text style={text.fieldError}>{passwordError || ' '}</Text>

            <GoldButton
              title="Reset password"
              loadingTitle="Saving..."
              loading={loading}
              onPress={resetPassword}
              style={forgotStyles.lastInCard}
            />

            <TouchableOpacity
              onPress={() => {
                setStage('email');
                setCode('');
                setCodeError('');
              }}
            >
              <Text style={[text.link, forgotStyles.link, forgotStyles.resendLink]}>Didn't get a code? Send a new one</Text>
            </TouchableOpacity>
          </>
        )}
      </GlassCard>

      <GhostButton title="Back to log in" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const forgotStyles = StyleSheet.create({
  content: {
    paddingTop: 48, // there's no hamburger menu before logging in, so start a little lower
  },
  title: {
    fontSize: 22,
  },
  card: {
    padding: 18,
  },
  intro: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
  },
  notice: {
    fontSize: 14,
    color: '#8fd9a8',
    marginBottom: 6,
  },
  hint: {
    marginBottom: 14,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  link: {
    fontWeight: 'normal',
    marginBottom: 10,
  },
  resendLink: {
    marginTop: 14,
  },
  lastInCard: {
    marginBottom: 0,
  },
});

export default ForgotPasswordScreen;