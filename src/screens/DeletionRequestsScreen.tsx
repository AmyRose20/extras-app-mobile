import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { DeletionRequestSummary, DialogConfig } from '../types';

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
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={deletionStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={deletionStyles.scrollContent}>
          <Text style={deletionStyles.title}>Deletion Requests</Text>

          {loading ? (
            <Text style={deletionStyles.message}>Loading...</Text>
          ) : requests.length === 0 ? (
            <Text style={deletionStyles.message}>No pending deletion requests.</Text>
          ) : (
            requests.map((request) => (
              <View key={request.id} style={deletionStyles.card}>
                <Text style={deletionStyles.detailRow}><Text style={deletionStyles.fieldLabelInline}>Name: </Text>{request.name}</Text>
                <Text style={deletionStyles.detailRow}><Text style={deletionStyles.fieldLabelInline}>Email: </Text>{request.email}</Text>
                <Text style={deletionStyles.detailRow}><Text style={deletionStyles.fieldLabelInline}>Requested by: </Text>{request.deletionRequestedBy === 'ADMIN' ? 'Admin' : 'Extra (self)'}</Text>
                <Text style={deletionStyles.detailRow}><Text style={deletionStyles.fieldLabelInline}>Requested at: </Text>{new Date(request.deletionRequestedAt).toLocaleString()}</Text>
                {request.deletionReason ? (
                  <Text style={deletionStyles.detailRow}><Text style={deletionStyles.fieldLabelInline}>Reason: </Text>{request.deletionReason}</Text>
                ) : null}

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
              </View>
            ))
          )}

          {message ? <Text style={deletionStyles.message}>{message}</Text> : null}

          <TouchableOpacity style={deletionStyles.buttonGhost} onPress={onBack}>
            <Text style={deletionStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const deletionStyles = StyleSheet.create({
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
    marginBottom: 14,
  },
  detailRow: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  fieldLabelInline: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
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
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 13,
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

export default DeletionRequestsScreen;