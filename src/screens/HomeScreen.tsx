import React, { useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { Role } from '../types';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { API_URL } from '../api';

type Props = {
  userName: string;
  role: Role;
  token: string;
  onNavigate: (screen: 'profile' | 'invites' | 'createShootDay' | 'createCallRequest' | 'callRequestStatus' | 'extrasList' | 'shootDaysList' | 'bulkCreateShootDays') => void;
  onLogout: () => void;
};

async function registerForPushNotifications(token: string) {
  const messaging = getMessaging(getApp());

  // Ask the user for permission to send notifications
  const authStatus = await requestPermission(messaging);
  const enabled = authStatus === AuthorizationStatus.AUTHORIZED ||
  authStatus === AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('Push notification permission denied');
    return;
  }

  // Get this device's unique FCM token
  const fcmToken = await getToken(messaging);
  console.log('FCM Token:', fcmToken);

  // Send it to our backend so it's saved against this extra's profile
  try {
    const response = await fetch(`${API_URL}/profiles/me/fcm-token`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fcmToken }),
    });

    if (!response.ok) {
      console.log('Failed to save FCM token to backend');
    } else {
      console.log('FCM token saved to backend');
    }
  } catch (error) {
    console.log('Error sending FCM token to backend:', error);
  }
}

function HomeScreen({ userName, role, token,  onNavigate, onLogout }: Props) {

  useEffect(() => {
    registerForPushNotifications(token);
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome, {userName}</Text>

      {/* Extras see profile/invites options; admins see coordinator options.
          This is what makes Amy2 and extra2 see different Home screens. */}
      {role === 'EXTRA' ? (
        <>
          <TouchableOpacity style={styles.button} onPress={() => onNavigate('profile')}>
            <Text style={styles.buttonText}>My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('invites')}>
            <Text style={styles.buttonText}>My Invites</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={() => onNavigate('createShootDay')}>
            <Text style={styles.buttonText}>Create Shoot Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('createCallRequest')}>
            <Text style={styles.buttonText}>Create Call Request</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('shootDaysList')}>
            <Text style={styles.buttonText}>Shoot Days</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('bulkCreateShootDays')}>
            <Text style={styles.buttonText}>Bulk Create Shoot Days</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('extrasList')}>
            <Text style={styles.buttonText}>View Extra Profiles</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default HomeScreen;

/* A couple of things worth understanding:

1. role === 'EXTRA' ? (...) : (...) — this is a conditional (an "if/else" written as an expression). 
If the logged-in user's role is EXTRA, show the extra buttons; otherwise (meaning ADMIN), show 
the coordinator buttons instead.
2. import { Role } from '../types' — this is why we made types.ts first. Role is defined there as
 'ADMIN' | 'EXTRA', and now any file can import and reuse that exact definition instead of retyping it. */