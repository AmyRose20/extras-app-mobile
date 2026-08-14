import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { API_URL } from '../api';

type Tally = {
  needed: number;
  accepted: number;
  declined: number;
  pending: number;
};

type Props = {
  token: string;
  callRequestId: string;
  onBack: () => void;
};

function CallRequestStatusScreen({ token, callRequestId, onBack }: Props) {
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

      {description ? <Text style={styles.message}>{description}</Text> : null}

      {tally ? (
        <>
          <Text style={styles.message}>Needed: {tally.needed}</Text>
          <Text style={styles.message}>Accepted: {tally.accepted}</Text>
          <Text style={styles.message}>Declined: {tally.declined}</Text>
          <Text style={styles.message}>Pending: {tally.pending}</Text>
        </>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={loadStatus}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default CallRequestStatusScreen;