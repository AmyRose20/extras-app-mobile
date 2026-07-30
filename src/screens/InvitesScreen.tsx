import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';
import { Invite } from '../types';

type Props = {
  invites: Invite[];
  loading: boolean;
  message: string;
  onRespond: (inviteId: string, status: 'ACCEPTED' | 'DECLINED') => void;
  onBack: () => void;
};

function InvitesScreen({ invites, loading, message, onRespond, onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>My Invites</Text>

        {loading ? <Text style={styles.message}>Loading...</Text> : null}

        {!loading && invites.length === 0 ? (
          <Text style={styles.message}>No invites yet.</Text>
        ) : null}

        {invites.map((invite) => (
          <View key={invite.id} style={styles.card}>
            <Text style={styles.cardTitle}>{invite.callRequest.description}</Text>
            <Text style={styles.cardDetail}>
              {invite.callRequest.shootDay.productionName} — {invite.callRequest.shootDay.location}
            </Text>
            <Text style={styles.cardDetail}>
              {new Date(invite.callRequest.shootDay.date).toDateString()}
            </Text>
            <Text style={styles.cardStatus}>Status: {invite.status}</Text>

            {invite.status === 'PENDING' ? (
              <View style={styles.cardButtonRow}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.acceptButton]}
                  onPress={() => onRespond(invite.id, 'ACCEPTED')}>
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.declineButton]}
                  onPress={() => onRespond(invite.id, 'DECLINED')}>
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default InvitesScreen;