import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';
import { API_URL } from '../api';

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
      const response = await fetch(`${API_URL}/call-requests/${callRequestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(`Could not load status: ${data.error}`);
        return;
      }

      setTally(data.tally);
      setDescription(data.callRequest.description);
    } catch (error) {
      setMessage('Something went wrong loading the status.');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Call Request Status</Text>

      <View style={styles.card}>
        {description ? <Text style={styles.cardTitle}>{description}</Text> : null}

        {tally ? (
          <>
            <Text style={styles.cardDetail}>Needed: {tally.needed}</Text>

            <TouchableOpacity onPress={() => onViewInvites('ACCEPTED')}>
              <Text style={styles.editLinkText}>Accepted: {tally.accepted}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onViewInvites('DECLINED')}>
              <Text style={styles.editLinkText}>Declined: {tally.declined}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onViewInvites('CANCELLED')}>
              <Text style={styles.editLinkText}>Cancelled: {tally.cancelled}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onViewInvites('PENDING')}>
              <Text style={styles.editLinkText}>Pending: {tally.pending}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={loadStatus}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default CallRequestStatusScreen;