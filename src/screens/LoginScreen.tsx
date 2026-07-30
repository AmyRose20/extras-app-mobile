import React from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

// This component receives everything it needs as "props" (short for
// properties) — values and functions passed in from App.tsx, rather
// than managing its own state. This keeps the login logic (like the
// token) living in one place (App.tsx) that every screen can share.
type Props = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  message: string;
  onLogin: () => void;
};

function LoginScreen({ email, setEmail, password, setPassword, message, onLogin }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Extras App</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </SafeAreaView>
  );
}

export default LoginScreen;