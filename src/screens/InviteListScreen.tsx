import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';

type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

type InviteRow = {
  extraProfileId: string;
  name: string;
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

  useEffect(() => {
    const loadInvites = async () => {
      try {
        const response = await fetch(`${API_URL}/call-requests/${callRequestId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          setMessage(`Could not load responses: ${data.error}`);
          setLoading(false);
          return;
        }

        const filtered = data.callRequest.invites
          .filter((invite: any) => invite.status === status)
          .map((invite: any) => ({
            extraProfileId: invite.extraProfileId,
            name: invite.extraProfile.user.name,
          }));

        setInvites(filtered);
        setLoading(false);
      } catch (error) {
        setMessage('Something went wrong loading responses.');
        setLoading(false);
      }
    };

    loadInvites();
  }, []);

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={inviteListStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={inviteListStyles.scrollContent}>
          <Text style={inviteListStyles.title}>{STATUS_LABELS[status]}</Text>

          {loading ? <Text style={inviteListStyles.message}>Loading...</Text> : null}

          {!loading && invites.length === 0 ? (
            <Text style={inviteListStyles.message}>No extras with this status yet.</Text>
          ) : null}

          {!loading &&
            invites.map((invite) => (
              <TouchableOpacity
                key={invite.extraProfileId}
                style={inviteListStyles.card}
                onPress={() => onSelectExtra(invite.extraProfileId)}
              >
                <Text style={inviteListStyles.cardTitle}>{invite.name}</Text>
              </TouchableOpacity>
            ))}

          {message ? <Text style={inviteListStyles.message}>{message}</Text> : null}

          <TouchableOpacity style={inviteListStyles.buttonGhost} onPress={onBack}>
            <Text style={inviteListStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const inviteListStyles = StyleSheet.create({
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
  message: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default InviteListScreen;