import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as callRequestsApi from '../api/callRequestsApi';
import { errorMessage } from '../api/client';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import GhostButton from '../components/GhostButton';
import { colors, text } from '../theme';

type Tally = {
  needed: number;
  accepted: number;
  declined: number;
  cancelled: number;
  pending: number;
};

type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

type Props = {
  token: string;
  callRequestId: string;
  onBack: () => void;
  onViewInvites: (status: InviteStatus) => void;
};

function CallRequestStatusScreen({ token, callRequestId, onBack, onViewInvites }: Props) {
  const [tally, setTally] = useState<Tally | null>(null);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const loadStatus = async () => {
    try {
      const data = await callRequestsApi.getCallRequest(callRequestId);
      setTally(data.tally);
      setDescription(data.callRequest.description);
      setMessage('');
    } catch (error) {
      setMessage(`Could not load status: ${errorMessage(error)}`);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <ScreenBackground scroll={false}>
      <Text style={text.title}>Call Request Status</Text>

      <GlassCard>
        {description ? <Text style={statusStyles.cardTitle}>{description}</Text> : null}

        {tally ? (
          <>
            <Text style={statusStyles.neededText}>Needed: {tally.needed}</Text>

            <TouchableOpacity style={statusStyles.statusRow} onPress={() => onViewInvites('ACCEPTED')}>
              <Text style={statusStyles.linkText}>Accepted: {tally.accepted}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={statusStyles.statusRow} onPress={() => onViewInvites('DECLINED')}>
              <Text style={statusStyles.linkText}>Declined: {tally.declined}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={statusStyles.statusRow} onPress={() => onViewInvites('CANCELLED')}>
              <Text style={statusStyles.linkText}>Cancelled: {tally.cancelled}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={statusStyles.statusRow} onPress={() => onViewInvites('PENDING')}>
              <Text style={statusStyles.linkText}>Pending: {tally.pending}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </GlassCard>

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GoldButton title="Refresh" onPress={loadStatus} />
      <GhostButton title="Back" onPress={onBack} style={statusStyles.backButton} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const statusStyles = StyleSheet.create({
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  neededText: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: 10,
  },
  statusRow: {
    paddingVertical: 6,
  },
  linkText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 0,
  },
});

export default CallRequestStatusScreen;