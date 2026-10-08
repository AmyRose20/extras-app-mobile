import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Role, ShootDaySummary, Invite } from '../types';
import { formatToCalendarKey } from '../dateUtils';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import * as profilesApi from '../api/profilesApi';
import Badge from '../components/Badge';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import { colors, text } from '../theme';

type Props = {
  userName: string;
  role: Role;
  shootDays: ShootDaySummary[];
  invites: Invite[];
  onNavigate: (
    screen: 'profile' | 'invites' | 'createCallRequest' | 'extrasList' | 'shootDaysList' | 'bulkCreateShootDays' | 'deletionRequests'
  ) => void;
  onSelectShootDay: (id: string) => void;
  invitesBadge?: number; // extras: how many NEW invites (red badge on My Invites)
};

async function registerForPushNotifications() {
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
    await profilesApi.saveFcmToken(fcmToken);
    console.log('FCM token saved to backend');
  } catch (error) {
    console.log('Could not save FCM token to backend:', error);
  }
}

function HomeScreen({ userName, role, shootDays, invites, onNavigate, onSelectShootDay, invitesBadge = 0 }: Props) {

  useEffect(() => {
    registerForPushNotifications();
  }, []);

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
    <ScreenBackground>
      <Text style={text.title}>Welcome, {userName}</Text>

      <GlassCard style={homeStyles.calendarCard}>
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            calendarBackground: 'transparent',
            textSectionTitleColor: colors.textMuted,
            dayTextColor: colors.text,
            textDisabledColor: 'rgba(255,255,255,0.25)',
            monthTextColor: colors.text,
            todayTextColor: colors.gold,
            arrowColor: colors.gold,
            selectedDayBackgroundColor: colors.gold,
            selectedDayTextColor: colors.onGold,
            dotColor: colors.gold,
            selectedDotColor: colors.onGold,
          }}
        />
      </GlassCard>

      {/* Extras see profile/invites options; admins see coordinator options.
          This is what makes Amy2 and extra2 see different Home screens. */}
      {role === 'EXTRA' ? (
        <>
          <GoldButton title="My Profile" onPress={() => onNavigate('profile')} />
          <GoldButton title="My Invites" onPress={() => onNavigate('invites')}>
            <Badge count={invitesBadge} />
          </GoldButton>
        </>
      ) : (
        <>
          <Text style={[text.sectionHeading, homeStyles.sectionHeading]}>Schedule</Text>
          <GoldButton title="Add Shoot Days" onPress={() => onNavigate('bulkCreateShootDays')} />
          <GoldButton title="Shoot Days" onPress={() => onNavigate('shootDaysList')} />

          <Text style={[text.sectionHeading, homeStyles.sectionHeading]}>Casting</Text>
          <GoldButton title="Create Call Request" onPress={() => onNavigate('createCallRequest')} />
          <GoldButton title="View Extra Profiles" onPress={() => onNavigate('extrasList')} />
        </>
      )}
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const homeStyles = StyleSheet.create({
  calendarCard: {
    padding: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionHeading: {
    marginTop: 8,
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
 smaller screens — the ScrollView means it just scrolls instead. (Since Part 12b, that
 SafeAreaView + ScrollView pair lives inside the shared ScreenBackground component.) */