import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import LinearGradient from 'react-native-linear-gradient';
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
    screen: 'profile' | 'invites' | 'createCallRequest' | 'extrasList' | 'shootDaysList' | 'bulkCreateShootDays' | 'deletionRequests'
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
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={homeStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={homeStyles.scrollContent}>
          <Text style={homeStyles.title}>Welcome, {userName}</Text>

          <View style={homeStyles.calendarCard}>
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                calendarBackground: 'transparent',
                textSectionTitleColor: 'rgba(255,255,255,0.72)',
                dayTextColor: '#fff',
                textDisabledColor: 'rgba(255,255,255,0.25)',
                monthTextColor: '#fff',
                todayTextColor: '#d99c4a',
                arrowColor: '#d99c4a',
                selectedDayBackgroundColor: '#d99c4a',
                selectedDayTextColor: '#1a1330',
                dotColor: '#d99c4a',
                selectedDotColor: '#1a1330',
              }}
            />
          </View>

          {/* Extras see profile/invites options; admins see coordinator options.
              This is what makes Amy2 and extra2 see different Home screens. */}
          {role === 'EXTRA' ? (
            <>
              <TouchableOpacity style={homeStyles.button} onPress={() => onNavigate('profile')}>
                <Text style={homeStyles.buttonText}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={homeStyles.button} onPress={() => onNavigate('invites')}>
                <Text style={homeStyles.buttonText}>My Invites</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={homeStyles.sectionHeading}>Schedule</Text>

              <TouchableOpacity style={homeStyles.button} onPress={() => onNavigate('bulkCreateShootDays')}>
                <Text style={homeStyles.buttonText}>Add Shoot Days</Text>
              </TouchableOpacity>

              <TouchableOpacity style={homeStyles.button} onPress={() => onNavigate('shootDaysList')}>
                <Text style={homeStyles.buttonText}>Shoot Days</Text>
              </TouchableOpacity>

              <Text style={homeStyles.sectionHeading}>Casting</Text>

              <TouchableOpacity style={homeStyles.button} onPress={() => onNavigate('createCallRequest')}>
                <Text style={homeStyles.buttonText}>Create Call Request</Text>
              </TouchableOpacity>

              <TouchableOpacity style={homeStyles.button} onPress={() => onNavigate('extrasList')}>
                <Text style={homeStyles.buttonText}>View Extra Profiles</Text>
              </TouchableOpacity>

              <TouchableOpacity style={homeStyles.button} onPress={() => onNavigate('deletionRequests')}>
                <Text style={homeStyles.buttonText}>Deletion Requests</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const homeStyles = StyleSheet.create({
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
  calendarCard: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

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