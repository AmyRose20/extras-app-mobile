import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import * as signupInvitesApi from '../../api/signupInvitesApi';
import { errorMessage } from '../../api/client';
import { SignupInvite, SignupInviteStatus } from '../../types';
import { formatToDDMMYYYY } from '../../dateUtils';
import ScreenBackground from '../../components/ScreenBackground';
import GlassCard from '../../components/GlassCard';
import GoldButton from '../../components/GoldButton';
import GhostButton from '../../components/GhostButton';
import TextField from '../../components/TextField';
import { colors, text } from '../../theme';

// Coordinators email sign-up links to new extras (Phase 3 Part 11).
// Whoever signs up through a link is added to this production straight away.
// If the email already has an account, the production is added to it instead.
type Props = {
  productionName: string | null;
  onBack: () => void;
};

const STATUS_LABELS: Record<SignupInviteStatus, string> = {
  SENT: 'Waiting to sign up',
  SIGNED_UP: 'Signed up',
  ADDED: 'Added (already had an account)',
  EXPIRED: 'Link expired',
};

const STATUS_COLOURS: Record<SignupInviteStatus, string> = {
  SENT: colors.gold,         // gold: waiting
  SIGNED_UP: colors.success, // green: done
  ADDED: colors.success,
  EXPIRED: colors.error,     // red: needs sending again
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteExtrasScreen({ productionName, onBack }: Props) {
  const production = productionName ?? 'your production';

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [invites, setInvites] = useState<SignupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [listMessage, setListMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false); // true while the pull-to-refresh spinner shows

  const loadInvites = async () => {
    try {
      setInvites(await signupInvitesApi.getSignupInvites());
      setListMessage('');
    } catch (error) {
      setListMessage(`Could not load invites: ${errorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  // Pull the list down to reload it (e.g. to see someone who's just signed up)
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvites();
    setRefreshing(false);
  };

  // Sends an invite. Used by the Send button, and by "Send again" on a waiting/expired invite.
  const sendInvite = async (address: string) => {
    setEmailError('');
    setSuccessMessage('');

    const trimmed = address.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      const data = await signupInvitesApi.sendSignupInvite(trimmed);
      setSuccessMessage(data.message);
      setEmail('');
      loadInvites(); // refresh the list so the new invite shows
    } catch (error) {
      setEmailError(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  // The date line under each invite
  const dateLine = (invite: SignupInvite): string => {
    if (invite.status === 'SENT') {
      return `Sent ${formatToDDMMYYYY(invite.sentAt)} · link works until ${formatToDDMMYYYY(invite.expiresAt)}`;
    }
    if ((invite.status === 'SIGNED_UP' || invite.status === 'ADDED') && invite.usedAt) {
      return `${formatToDDMMYYYY(invite.usedAt)}`;
    }
    return `Sent ${formatToDDMMYYYY(invite.sentAt)}`;
  };

  return (
    <ScreenBackground
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} />
      }
    >
      <Text style={text.title}>Invite Extras</Text>

      <GlassCard style={inviteStyles.card}>
        <Text style={text.label}>Email address</Text>
        <TextField
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[text.fieldError, inviteStyles.fieldError]}>{emailError || ' '}</Text>
        {successMessage ? <Text style={inviteStyles.successText}>{successMessage}</Text> : null}

        <Text style={inviteStyles.note}>
          They'll get an email with a sign-up link for {production}. It works once and lasts 7 days.
          If they already have an account, they're added to {production} straight away.
        </Text>

        <GoldButton
          title="Send invite"
          loadingTitle="Sending..."
          loading={sending}
          onPress={() => sendInvite(email)}
          style={inviteStyles.lastInCard}
        />
      </GlassCard>

      <Text style={inviteStyles.sectionTitle}>Sent invites</Text>

      {loading ? <Text style={text.message}>Loading...</Text> : null}
      {!loading && invites.length === 0 && !listMessage ? (
        <Text style={text.message}>No invites sent yet.</Text>
      ) : null}
      {listMessage ? <Text style={text.message}>{listMessage}</Text> : null}

      {invites.map((invite) => (
        <GlassCard key={invite.id} style={inviteStyles.inviteCard}>
          <Text style={inviteStyles.inviteEmail}>{invite.email}</Text>
          {invite.name ? <Text style={inviteStyles.inviteName}>{invite.name}</Text> : null}
          <Text style={[inviteStyles.inviteStatus, { color: STATUS_COLOURS[invite.status] }]}>
            {STATUS_LABELS[invite.status]}
          </Text>
          <Text style={inviteStyles.inviteDate}>{dateLine(invite)}</Text>

          {invite.status === 'SENT' || invite.status === 'EXPIRED' ? (
            <TouchableOpacity onPress={() => sendInvite(invite.email)} disabled={sending}>
              <Text style={[text.link, inviteStyles.sendAgain]}>Send again</Text>
            </TouchableOpacity>
          ) : null}
        </GlassCard>
      ))}

      <GhostButton title="Back" onPress={onBack} style={inviteStyles.backButton} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const inviteStyles = StyleSheet.create({
  card: {
    padding: 18,
    marginBottom: 20,
  },
  fieldError: {
    marginBottom: 4,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  lastInCard: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  inviteCard: {
    padding: 14,
    marginBottom: 10,
  },
  inviteEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  inviteName: {
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 2,
  },
  inviteStatus: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  inviteDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  sendAgain: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 10,
  },
});

export default InviteExtrasScreen;