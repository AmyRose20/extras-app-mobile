import { useEffect, useState } from 'react';
import { Screen, Role, Invite, Tally } from '../types';
import { errorMessage } from '../api/client';
import * as invitesApi from '../api/invitesApi';

// The logged-in extra's invites (My Invites, and the calendar on Home)
// plus their activity numbers (worked / declined / cancelled / no-shows).
export function useMyInvites(screen: Screen, role: Role) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesMessage, setInvitesMessage] = useState('');
  const [tally, setTally] = useState<Tally | null>(null);

  const loadInvites = async () => {
    setInvitesLoading(true);
    setInvitesMessage('');
    try {
      setInvites(await invitesApi.getMyInvites());
    } catch (error) {
      setInvitesMessage(`Could not load invites: ${errorMessage(error)}`);
    } finally {
      setInvitesLoading(false);
    }
  };

  const loadTally = async () => {
    try {
      setTally(await invitesApi.getMyTally());
    } catch (error) {
      // Non-critical — the invites screen just doesn't show the widget if this fails.
    }
  };

  // Load on My Invites, and on Home for extras (the calendar shows them)
  useEffect(() => {
    if (screen === 'invites') {
      loadInvites();
      loadTally();
    }
    if (screen === 'home' && role === 'EXTRA') {
      loadInvites();
    }
  }, [screen, role]);

  // Accept / decline / cancel, then reload so the list re-sorts
  const respondToInvite = async (inviteId: string, status: invitesApi.InviteAnswer) => {
    try {
      await invitesApi.respondToInvite(inviteId, status);
      loadInvites();
    } catch (error) {
      setInvitesMessage(`Could not update invite: ${errorMessage(error)}`);
    }
  };

  return { invites, invitesLoading, invitesMessage, tally, respondToInvite };
}