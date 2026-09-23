import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { styles, colors } from '../styles';
import { DeletionRequestSummary } from '../types';

type Props = {
  requests: DeletionRequestSummary[];
  loading: boolean;
  message: string;
  onApprove: (userId: string) => void;
  onDeny: (userId: string) => void;
  onBack: () => void;
};

function DeletionRequestsScreen({ requests, loading, message, onApprove, onDeny, onBack }: Props) {
  const confirmApprove = (request: DeletionRequestSummary) => {
    Alert.alert(
      'Approve Deletion?',
      `${request.name}'s account will be deactivated and they will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', style: 'destructive', onPress: () => onApprove(request.id) },
      ]
    );
  };

  const confirmDeny = (request: DeletionRequestSummary) => {
    Alert.alert(
      'Deny Deletion Request?',
      `${request.name}'s account will remain active.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deny', onPress: () => onDeny(request.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Deletion Requests</Text>

        {loading ? (
          <Text style={styles.message}>Loading...</Text>
        ) : requests.length === 0 ? (
          <Text style={styles.message}>No pending deletion requests.</Text>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={[styles.card, styles.buttonSpacing]}>
              <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Name: </Text>{request.name}</Text>
              <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Email: </Text>{request.email}</Text>
              <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Requested by: </Text>{request.deletionRequestedBy === 'ADMIN' ? 'Admin' : 'Extra (self)'}</Text>
              <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Requested at: </Text>{new Date(request.deletionRequestedAt).toLocaleString()}</Text>
              {request.deletionReason ? (
                <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Reason: </Text>{request.deletionReason}</Text>
              ) : null}

              <View style={[styles.row, styles.buttonSpacing]}>
                <TouchableOpacity
                  style={[styles.button, { flex: 1, marginRight: 8, backgroundColor: colors.error }]}
                  onPress={() => confirmApprove(request)}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { flex: 1 }]}
                  onPress={() => confirmDeny(request)}
                >
                  <Text style={styles.buttonText}>Deny</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default DeletionRequestsScreen;