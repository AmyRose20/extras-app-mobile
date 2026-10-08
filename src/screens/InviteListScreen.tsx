import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, RefreshControl } from 'react-native';
import * as callRequestsApi from '../api/callRequestsApi';
import { errorMessage } from '../api/client';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GhostButton from '../components/GhostButton';
import { colors, text } from '../theme';

type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

type InviteRow = {
  extraProfileId: string;
  name: string;
  hasSmartphone: boolean; // false = gets invites by email (shown with an "Email" tag)
};

type Props = {
  token: string;
  callRequestId: string;
  status: InviteStatus;
  onBack: () => void;
  onSelectExtra: (extraProfileId: string) => void;
};

const STATUS_LABELS: Record<InviteStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

function InviteListScreen({ token, callRequestId, status, onBack, onSelectExtra }: Props) {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false); // true while the pull-to-refresh spinner shows

  // Loads the extras with this status. Used when the screen opens, and when the list is pulled down.
  const loadInvites = async () => {
    try {
      const data = await callRequestsApi.getCallRequest(callRequestId);

      const filtered = data.callRequest.invites
        .filter((invite: any) => invite.status === status)
        .map((invite: any) => ({
          extraProfileId: invite.extraProfileId,
          name: invite.extraProfile.user.name,
          hasSmartphone: invite.extraProfile.hasSmartphone !== false,
        }));

      setInvites(filtered);
      setMessage('');
    } catch (error) {
      setMessage(`Could not load responses: ${errorMessage(error)}`);
    } finally {
      setLoading(false); // runs whether it worked or not
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  // Pull the list down to reload it (e.g. to see someone who's just answered by email)
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvites();
    setRefreshing(false);
  };

  return (
    <ScreenBackground
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} />
      }
    >
      <Text style={text.title}>{STATUS_LABELS[status]}</Text>

      {loading ? <Text style={text.message}>Loading...</Text> : null}

      {!loading && invites.length === 0 ? (
        <Text style={text.message}>No extras with this status yet.</Text>
      ) : null}

      {!loading &&
        invites.map((invite) => (
          <TouchableOpacity key={invite.extraProfileId} onPress={() => onSelectExtra(invite.extraProfileId)}>
            <GlassCard style={inviteListStyles.card}>
              <View style={inviteListStyles.nameRow}>
                <Text style={inviteListStyles.name}>{invite.name}</Text>
                {!invite.hasSmartphone ? <Text style={inviteListStyles.emailTag}>Email</Text> : null}
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const inviteListStyles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  // Small pill next to extras without a smartphone (they get invites by email)
  emailTag: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gold,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
});

export default InviteListScreen;