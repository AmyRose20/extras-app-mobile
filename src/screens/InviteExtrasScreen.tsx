import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';
import { SignupInvite, SignupInviteStatus } from '../types';
import { formatToDDMMYYYY } from '../dateUtils';

// Coordinators email sign-up links to new extras (Phase 3 Part 11).
// Whoever signs up through a link is added to this production straight away.
// If the email already has an account, the production is added to it instead.
type Props = {
  token: string;
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
  SENT: '#d99c4a',      // gold: waiting
  SIGNED_UP: '#86efac', // green: done
  ADDED: '#86efac',
  EXPIRED: '#ff9d9d',   // red: needs sending again
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteExtrasScreen({ token, productionName, onBack }: Props) {
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
      const response = await fetch(`${API_URL}/signup-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setListMessage(data.error || 'Could not load invites.');
        return;
      }
      setInvites(data);
      setListMessage('');
    } catch (error) {
      setListMessage('Something went wrong loading invites.');
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
      const response = await fetch(`${API_URL}/signup-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setEmailError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSuccessMessage(data.message);
      setEmail('');
      loadInvites(); // refresh the list so the new invite shows
    } catch (error) {
      setEmailError('Something went wrong. Please try again.');
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
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={inviteStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={inviteStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d99c4a" colors={['#d99c4a']} />
          }
        >
          <Text style={inviteStyles.title}>Invite Extras</Text>

          <View style={inviteStyles.card}>
            <Text style={inviteStyles.label}>Email address</Text>
            <TextInput
              style={inviteStyles.input}
              placeholder="name@example.com"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={inviteStyles.fieldError}>{emailError || ' '}</Text>
            {successMessage ? <Text style={inviteStyles.successText}>{successMessage}</Text> : null}

            <Text style={inviteStyles.note}>
              They'll get an email with a sign-up link for {production}. It works once and lasts 7 days.
              If they already have an account, they're added to {production} straight away.
            </Text>

            <TouchableOpacity
              style={[inviteStyles.button, sending && { opacity: 0.6 }]}
              onPress={() => sendInvite(email)}
              disabled={sending}
            >
              <Text style={inviteStyles.buttonText}>{sending ? 'Sending...' : 'Send invite'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={inviteStyles.sectionTitle}>Sent invites</Text>

          {loading ? <Text style={inviteStyles.message}>Loading...</Text> : null}
          {!loading && invites.length === 0 && !listMessage ? (
            <Text style={inviteStyles.message}>No invites sent yet.</Text>
          ) : null}
          {listMessage ? <Text style={inviteStyles.message}>{listMessage}</Text> : null}

          {invites.map((invite) => (
            <View key={invite.id} style={inviteStyles.inviteCard}>
              <Text style={inviteStyles.inviteEmail}>{invite.email}</Text>
              {invite.name ? <Text style={inviteStyles.inviteName}>{invite.name}</Text> : null}
              <Text style={[inviteStyles.inviteStatus, { color: STATUS_COLOURS[invite.status] }]}>
                {STATUS_LABELS[invite.status]}
              </Text>
              <Text style={inviteStyles.inviteDate}>{dateLine(invite)}</Text>

              {invite.status === 'SENT' || invite.status === 'EXPIRED' ? (
                <TouchableOpacity onPress={() => sendInvite(invite.email)} disabled={sending}>
                  <Text style={inviteStyles.linkText}>Send again</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <TouchableOpacity style={inviteStyles.buttonGhost} onPress={onBack}>
            <Text style={inviteStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const inviteStyles = StyleSheet.create({
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
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  fieldError: {
    color: '#ff9d9d',
    fontSize: 12,
    minHeight: 16,
    marginBottom: 4,
  },
  successText: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 17,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  inviteCard: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 14,
    marginBottom: 10,
  },
  inviteEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  inviteName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
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
  linkText: {
    fontSize: 13,
    color: '#d99c4a',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default InviteExtrasScreen;