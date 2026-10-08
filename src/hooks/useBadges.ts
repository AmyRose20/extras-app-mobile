import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { Screen } from '../types';
import * as badgesApi from '../api/badgesApi';

const NO_BADGES = { invites: 0, deletionRequests: 0, productionRequests: 0 };

// Red notification badges: how many NEW things since each screen was last opened.
// Refreshes on Home, when the app comes back to the front, and when a push arrives.
export function useBadges(screen: Screen, token: string) {
  const [badgeCounts, setBadgeCounts] = useState(NO_BADGES);

  const loadBadgeCounts = async () => {
    try {
      const data = await badgesApi.getBadgeCounts();
      setBadgeCounts({
        invites: data.invites ?? 0,
        deletionRequests: data.deletionRequests ?? 0,
        productionRequests: data.productionRequests ?? 0,
      });
    } catch (error) {
      // Non-critical — the app just won't show badges if this fails.
    }
  };

  // Opening a screen clears its badge (until something newer arrives)
  const markBadgeSeen = async (type: badgesApi.BadgeType) => {
    setBadgeCounts((prev) => ({ ...prev, [type]: 0 })); // clear it on screen straight away
    try {
      await badgesApi.markBadgeSeen(type);
    } catch (error) {
      // Non-critical — worst case the badge reappears next time counts load.
    }
  };

  // Refresh on Home, and clear one when its screen is opened
  useEffect(() => {
    if (!token) return; // not logged in
    if (screen === 'home') loadBadgeCounts();
    if (screen === 'invites') markBadgeSeen('invites');
    if (screen === 'deletionRequests') markBadgeSeen('deletionRequests');
    if (screen === 'productionRequests') markBadgeSeen('productionRequests');
  }, [screen, token]);

  // Also refresh when the app comes back to the front,
  // or a push notification arrives while the app is open
  useEffect(() => {
    if (!token) return; // not logged in

    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadBadgeCounts();
    });

    const stopListeningForPush = onMessage(getMessaging(getApp()), () => {
      loadBadgeCounts();
    });

    // Clean up when logging out (token changes), so listeners don't pile up
    return () => {
      appStateListener.remove();
      stopListeningForPush();
    };
  }, [token]);

  // On log out, so the next person doesn't see the last person's counts
  const resetBadges = () => setBadgeCounts(NO_BADGES);

  return { badgeCounts, resetBadges };
}