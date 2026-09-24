import React from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Invite, Tally } from '../types';

type Props = {
  invites: Invite[];
  loading: boolean;
  message: string;
  onRespond: (inviteId: string, status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED') => void;
  onBack: () => void;
  tally: Tally | null;
};

function statusStyle(status: string, isExpired: boolean) {
  if (isExpired) return invitesStyles.statusNegative;
  if (status === 'ACCEPTED') return invitesStyles.statusAccepted;
  if (status === 'DECLINED' || status === 'CANCELLED') return invitesStyles.statusNegative;
  return invitesStyles.statusPending;
}

function InvitesScreen({ invites, loading, message, onRespond, onBack, tally }: Props) {
  const confirmDecline = (inviteId: string) => {
    Alert.alert(
      'Decline this invite?',
      'Are you sure you want to decline?',
      [
        { text: 'Never mind', style: 'cancel' },
        { text: 'Yes, decline', style: 'destructive', onPress: () => onRespond(inviteId, 'DECLINED') },
      ],
    );
  };

  const confirmCancel = (inviteId: string) => {
    Alert.alert(
      'Cancel this invite?',
      'You already accepted this one. Cancelling after accepting counts toward your cancellation history.',
      [
        { text: 'Never mind', style: 'cancel' },
        { text: 'Yes, cancel', style: 'destructive', onPress: () => onRespond(inviteId, 'CANCELLED') },
      ],
    );
  };

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={invitesStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={invitesStyles.scrollContent}>
          <Text style={invitesStyles.title}>My Invites</Text>

          {tally ? (
            <View style={invitesStyles.card}>
              <Text style={invitesStyles.widgetTitle}>My Activity</Text>
              <View style={invitesStyles.statsRow}>
                <View style={invitesStyles.statColumn}>
                  <Text style={invitesStyles.statNumber}>{tally.worked}</Text>
                  <Text style={invitesStyles.statLabel}>Worked</Text>
                </View>
                <View style={invitesStyles.statColumn}>
                  <Text style={invitesStyles.statNumber}>{tally.declined}</Text>
                  <Text style={invitesStyles.statLabel}>Declined</Text>
                </View>
                <View style={invitesStyles.statColumn}>
                  <Text style={invitesStyles.statNumber}>{tally.cancelled}</Text>
                  <Text style={invitesStyles.statLabel}>Cancelled</Text>
                </View>
              </View>
            </View>
          ) : null}

          {loading ? <Text style={invitesStyles.message}>Loading...</Text> : null}

          {!loading && invites.length === 0 ? (
            <Text style={invitesStyles.message}>No invites yet.</Text>
          ) : null}

          {invites.map((invite) => {
            const shootDayPassed = new Date(invite.callRequest.shootDay.date) < new Date();

            return (
              <View key={invite.id} style={invitesStyles.card}>
                <Text style={invitesStyles.cardTitle}>{invite.callRequest.description}</Text>
                <Text style={invitesStyles.cardDetail}>
                  {invite.callRequest.shootDay.productionName} — {invite.callRequest.shootDay.location}
                </Text>
                <Text style={invitesStyles.cardDetail}>
                  {new Date(invite.callRequest.shootDay.date).toDateString()}
                </Text>
                <Text style={statusStyle(invite.status, invite.isExpired)}>
                  Status: {invite.isExpired ? 'EXPIRED' : invite.status}
                </Text>

                {invite.status === 'PENDING' && !invite.isExpired ? (
                  <View style={invitesStyles.cardButtonRow}>
                    <TouchableOpacity
                      style={[invitesStyles.smallButton, invitesStyles.acceptButton]}
                      onPress={() => onRespond(invite.id, 'ACCEPTED')}>
                      <Text style={invitesStyles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[invitesStyles.smallButton, invitesStyles.declineButton]}
                      onPress={() => confirmDecline(invite.id)}>
                      <Text style={invitesStyles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {invite.status === 'ACCEPTED' && !shootDayPassed ? (
                  <TouchableOpacity onPress={() => confirmCancel(invite.id)}>
                    <Text style={invitesStyles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}

          {message ? <Text style={invitesStyles.message}>{message}</Text> : null}

          <TouchableOpacity style={invitesStyles.buttonGhost} onPress={onBack}>
            <Text style={invitesStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const invitesStyles = StyleSheet.create({
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
  widgetTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 2,
  },
  statusPending: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d99c4a',
    marginTop: 8,
  },
  statusAccepted: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8fd9a8',
    marginTop: 8,
  },
  statusNegative: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff9d9d',
    marginTop: 8,
  },
  cardButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  smallButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#8fd9a8',
  },
  acceptButtonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: '#DC2626',
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelText: {
    color: '#ff9d9d',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 10,
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

export default InvitesScreen;