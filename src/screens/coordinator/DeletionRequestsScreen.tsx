import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { DeletionRequestSummary, DialogConfig } from '../../types';
import ScreenBackground from '../../components/ScreenBackground';
import GlassCard from '../../components/GlassCard';
import GhostButton from '../../components/GhostButton';
import DetailRow from '../../components/DetailRow';
import { colors, text } from '../../theme';

type Props = {
  requests: DeletionRequestSummary[];
  loading: boolean;
  message: string;
  onApprove: (userId: string) => void;
  onDeny: (userId: string) => void;
  onBack: () => void;
  showDialog: (config: DialogConfig) => void; // opens the app-wide confirmation dialog
};

function DeletionRequestsScreen({ requests, loading, message, onApprove, onDeny, onBack, showDialog }: Props) {
  const confirmApprove = (request: DeletionRequestSummary) => {
    showDialog({
      title: 'Approve Deletion?',
      message: `${request.name}'s account will be deactivated and they will no longer be able to log in.`,
      confirmText: 'Approve',
      destructive: true,
      onConfirm: () => onApprove(request.id),
    });
  };

  const confirmDeny = (request: DeletionRequestSummary) => {
    showDialog({
      title: 'Deny Deletion Request?',
      message: `${request.name}'s account will remain active.`,
      confirmText: 'Deny',
      onConfirm: () => onDeny(request.id),
    });
  };

  return (
    <ScreenBackground>
      <Text style={text.title}>Deletion Requests</Text>

      {loading ? (
        <Text style={text.message}>Loading...</Text>
      ) : requests.length === 0 ? (
        <Text style={text.message}>No pending deletion requests.</Text>
      ) : (
        requests.map((request) => (
          <GlassCard key={request.id} style={deletionStyles.card}>
            <DetailRow label="Name">{request.name}</DetailRow>
            <DetailRow label="Email">{request.email}</DetailRow>
            <DetailRow label="Requested by">
              {request.deletionRequestedBy === 'ADMIN' ? 'Admin' : 'Extra (self)'}
            </DetailRow>
            <DetailRow label="Requested at">{new Date(request.deletionRequestedAt).toLocaleString()}</DetailRow>
            {request.deletionReason ? <DetailRow label="Reason">{request.deletionReason}</DetailRow> : null}

            <View style={deletionStyles.buttonRow}>
              <TouchableOpacity
                style={[deletionStyles.smallButton, deletionStyles.approveButton]}
                onPress={() => confirmApprove(request)}
              >
                <Text style={deletionStyles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[deletionStyles.smallButton, deletionStyles.denyButton]}
                onPress={() => confirmDeny(request)}
              >
                <Text style={deletionStyles.denyButtonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))
      )}

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const deletionStyles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  smallButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8fd9a8',
  },
  approveButtonText: {
    color: '#8fd9a8',
    fontWeight: '700',
    fontSize: 13,
  },
  denyButton: {
    backgroundColor: '#8fd9a8',
  },
  denyButtonText: {
    color: colors.onGold,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default DeletionRequestsScreen;