import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ImageBackground, View, StyleSheet, LayoutChangeEvent } from 'react-native';

type Props = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  message: string;
  onLogin: () => void;
  notice: string; // friendly green message, e.g. after a password reset
  onForgotPassword: () => void;
};

const IMAGE_ASPECT = 1746 / 901;
const CARD_TOP_FRACTION = 0.63;

function getCardTop(boxWidth: number, boxHeight: number): number {
  const boxAspect = boxHeight / boxWidth;

  if (boxAspect >= IMAGE_ASPECT) {
    return boxHeight * CARD_TOP_FRACTION;
  } else {
    const renderedImageHeight = boxWidth * IMAGE_ASPECT;
    const croppedFromTop = (renderedImageHeight - boxHeight) / 2;
    return renderedImageHeight * CARD_TOP_FRACTION - croppedFromTop;
  }
}

function LoginScreen({ email, setEmail, password, setPassword, message, onLogin, notice, onForgotPassword }: Props) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  }

  const cardTop = box ? getCardTop(box.width, box.height) : null;

  return (
    <ImageBackground
      source={require('../../assets/images/riverside_studios_logo.png')}
      style={loginStyles.background}
      resizeMode="cover"
      onLayout={handleLayout}
    >
      {cardTop !== null && (
        <View style={[loginStyles.cardWrapper, { top: cardTop }]}>
          <View style={loginStyles.card}>
            <TextInput
              style={loginStyles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={loginStyles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={loginStyles.button} onPress={onLogin}>
              <Text style={loginStyles.buttonText}>Log In</Text>
            </TouchableOpacity>

            {notice && !message ? (
              <Text style={loginStyles.noticeText}>{notice}</Text>
            ) : (
              <Text style={loginStyles.errorText}>{message || ' '}</Text>
            )}

            <TouchableOpacity onPress={onForgotPassword}>
              <Text style={loginStyles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const loginStyles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    // no "bottom": the card is only as tall as what's inside it
  },
  card: {
    backgroundColor: 'rgba(20,18,28,0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 18,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
    width: '100%',
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  buttonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#ff9d9d',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    minHeight: 18,
  },
  noticeText: {
    color: '#8fd9a8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    minHeight: 18,
  },
  forgotText: {
    color: '#d99c4a',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 6,
  },
});

export default LoginScreen;