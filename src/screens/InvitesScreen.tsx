import React from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles, spacing } from '../styles';
import { Invite, Tally } from '../types';

type Props = {
  invites: Invite[];
  loading: boolean;
  message: string;
  onRespond: (inviteId: string, status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED') => void;
  onBack: () => void;
  tally: Tally | null;
};

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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>My Invites</Text>

        {tally ? (
          <View style={[styles.card, { marginBottom: spacing.lg }]}>
            <Text style={styles.widgetTitle}>My Activity</Text>
            <View style={styles.statsRow}>
              <View style={styles.statColumn}>
                <Text style={styles.statNumber}>{tally.worked}</Text>
                <Text style={styles.cardDetail}>Worked</Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={styles.statNumber}>{tally.declined}</Text>
                <Text style={styles.cardDetail}>Declined</Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={styles.statNumber}>{tally.cancelled}</Text>
                <Text style={styles.cardDetail}>Cancelled</Text>
              </View>
            </View>
          </View>
        ) : null}

        {loading ? <Text style={styles.message}>Loading...</Text> : null}

        {!loading && invites.length === 0 ? (
          <Text style={styles.message}>No invites yet.</Text>
        ) : null}

        {invites.map((invite) => {
          const shootDayPassed = new Date(invite.callRequest.shootDay.date) < new Date();

          return (
            <View key={invite.id} style={styles.card}>
              <Text style={styles.cardTitle}>{invite.callRequest.description}</Text>
              <Text style={styles.cardDetail}>
                {invite.callRequest.shootDay.productionName} — {invite.callRequest.shootDay.location}
              </Text>
              <Text style={styles.cardDetail}>
                {new Date(invite.callRequest.shootDay.date).toDateString()}
              </Text>
              <Text style={styles.cardStatus}>
                Status: {invite.isExpired ? 'EXPIRED' : invite.status}
              </Text>

              {invite.status === 'PENDING' && !invite.isExpired ? (
                <View style={styles.cardButtonRow}>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.acceptButton]}
                    onPress={() => onRespond(invite.id, 'ACCEPTED')}>
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.declineButton]}
                    onPress={() => confirmDecline(invite.id)}>
                    <Text style={styles.buttonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {invite.status === 'ACCEPTED' && !shootDayPassed ? (
                <TouchableOpacity onPress={() => confirmCancel(invite.id)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default InvitesScreen;