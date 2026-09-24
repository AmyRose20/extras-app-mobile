import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={statusStyles.container}
    >
      <SafeAreaView style={statusStyles.inner}>
        <Text style={statusStyles.title}>Call Request Status</Text>

        <View style={statusStyles.card}>
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
        </View>

        {message ? <Text style={statusStyles.message}>{message}</Text> : null}

        <TouchableOpacity style={statusStyles.button} onPress={loadStatus}>
          <Text style={statusStyles.buttonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={statusStyles.buttonGhost} onPress={onBack}>
          <Text style={statusStyles.buttonGhostText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const statusStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 20,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  neededText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  statusRow: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#d99c4a',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CallRequestStatusScreen;