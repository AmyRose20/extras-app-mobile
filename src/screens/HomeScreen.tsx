import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { styles, colors } from '../styles';
import { Role, ShootDaySummary, Invite } from '../types';
import { formatToCalendarKey } from '../dateUtils';
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
  shootDays: ShootDaySummary[];
  invites: Invite[];
  onNavigate: (
    screen: 'profile' | 'invites' | 'createCallRequest' | 'extrasList' | 'shootDaysList' | 'bulkCreateShootDays'
  ) => void;
  onSelectShootDay: (id: string) => void;
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

function HomeScreen({ userName, role, token, shootDays, invites, onNavigate, onSelectShootDay }: Props) {

  useEffect(() => {
    registerForPushNotifications(token);
  }, [token]);

  // Build the calendar's marked dates differently depending on who's looking:
  // admins see every shoot day, extras only see the ones they've accepted.
  const markedDates: Record<string, { marked: boolean }> = {};
  const dateToShootDayId: Record<string, string> = {};

  if (role === 'ADMIN') {
    shootDays.forEach((day) => {
      const key = formatToCalendarKey(day.date);
      markedDates[key] = { marked: true };
      dateToShootDayId[key] = day.id;
    });
  } else {
    invites
      .filter((invite) => invite.status === 'ACCEPTED')
      .forEach((invite) => {
        const key = formatToCalendarKey(invite.callRequest.shootDay.date);
        markedDates[key] = { marked: true };
      });
  }

  const handleDayPress = (day: DateData) => {
    if (role === 'ADMIN') {
      const shootDayId = dateToShootDayId[day.dateString];
      if (shootDayId) {
        onSelectShootDay(shootDayId);
      }
    } else {
      onNavigate('invites');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome, {userName}</Text>

        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
            dotColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
          }}
        />

        {/* Extras see profile/invites options; admins see coordinator options.
            This is what makes Amy2 and extra2 see different Home screens. */}
        {role === 'EXTRA' ? (
          <>
            <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('profile')}>
              <Text style={styles.buttonText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('invites')}>
              <Text style={styles.buttonText}>My Invites</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.sectionHeading}>Schedule</Text>

            <TouchableOpacity style={styles.button} onPress={() => onNavigate('bulkCreateShootDays')}>
              <Text style={styles.buttonText}>Add Shoot Days</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('shootDaysList')}>
              <Text style={styles.buttonText}>Shoot Days</Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeading}>Casting</Text>

            <TouchableOpacity style={styles.button} onPress={() => onNavigate('createCallRequest')}>
              <Text style={styles.buttonText}>Create Call Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => onNavigate('extrasList')}>
              <Text style={styles.buttonText}>View Extra Profiles</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

/* A couple of things worth understanding:

1. role === 'EXTRA' ? (...) : (...) — this is a conditional (an "if/else" written as an expression). 
If the logged-in user's role is EXTRA, show the extra buttons; otherwise (meaning ADMIN), show 
the coordinator buttons instead.
2. import { Role } from '../types' — this is why we made types.ts first. Role is defined there as
 'ADMIN' | 'EXTRA', and now any file can import and reuse that exact definition instead of retyping it.
3. We swapped the outer SafeAreaView for a SafeAreaView + ScrollView pair. Now that there's a
 calendar sitting above the buttons, the content is tall enough that it could get cut off on
 smaller screens — the ScrollView means it just scrolls instead. */