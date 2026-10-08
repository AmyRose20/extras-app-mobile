import { useState } from 'react';
import { Screen } from '../types';

export type InviteListStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

// Which screen is showing, plus the little bits of "where am I / where do I go back to"
// that some screens need. (We switch screens with plain state, not React Navigation.)
export function useNavigation() {
  const [screen, setScreen] = useState<Screen>('login');

  // Where the Back button goes on screens that can be opened from more than one place
  const [callRequestStatusReturnTo, setCallRequestStatusReturnTo] = useState<Screen>('home');
  const [extraProfileReturnTo, setExtraProfileReturnTo] = useState<Screen>('extrasList');
  const [shootDayDetailReturnTo, setShootDayDetailReturnTo] = useState<Screen>('shootDaysList');

  // Set when Create Call Request is opened from a shoot day (undefined = opened from Home)
  const [callRequestShootDayId, setCallRequestShootDayId] = useState<string | undefined>(undefined);

  // The call request shown on View Responses, and which list of extras was tapped
  const [activeCallRequestId, setActiveCallRequestId] = useState('');
  const [inviteListStatus, setInviteListStatus] = useState<InviteListStatus>('PENDING');

  // View Responses → tap "Accepted: 3" etc.
  const viewInviteList = (status: InviteListStatus) => {
    setInviteListStatus(status);
    setScreen('inviteList');
  };

  // Shoot Day → "View Responses" on a call request
  const viewResponses = (callRequestId: string) => {
    setActiveCallRequestId(callRequestId);
    setCallRequestStatusReturnTo('shootDayDetail');
    setScreen('callRequestStatus');
  };

  return {
    screen,
    setScreen,
    callRequestStatusReturnTo,
    setCallRequestStatusReturnTo,
    extraProfileReturnTo,
    setExtraProfileReturnTo,
    shootDayDetailReturnTo,
    setShootDayDetailReturnTo,
    callRequestShootDayId,
    setCallRequestShootDayId,
    activeCallRequestId,
    setActiveCallRequestId,
    inviteListStatus,
    viewInviteList,
    viewResponses,
  };
}