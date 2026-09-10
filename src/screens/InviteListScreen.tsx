import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{STATUS_LABELS[status]}</Text>

        {loading ? <Text style={styles.message}>Loading...</Text> : null}

        {!loading && invites.length === 0 ? (
          <Text style={styles.message}>No extras with this status yet.</Text>
        ) : null}

        {!loading &&
          invites.map((invite) => (
            <TouchableOpacity
              key={invite.extraProfileId}
              style={styles.card}
              onPress={() => onSelectExtra(invite.extraProfileId)}
            >
              <Text style={styles.cardTitle}>{invite.name}</Text>
            </TouchableOpacity>
          ))}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default InviteListScreen;