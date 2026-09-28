import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { DialogConfig, Invite, Tally } from '../types';
import { formatToDDMMYYYY, formatToHHMM, isNextDay } from '../dateUtils';

type Props = {
  invites: Invite[];
  loading: boolean;
  message: string;
  onRespond: (inviteId: string, status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED') => void;
  onBack: () => void;
  tally: Tally | null;
  showDialog: (config: DialogConfig) => void; // opens the app-wide confirmation dialog
};

function statusStyle(status: string, isExpired: boolean) {
  if (isExpired || status === 'EXPIRED') return invitesStyles.statusNegative;
  if (status === 'ACCEPTED') return invitesStyles.statusAccepted;
  if (status === 'DECLINED' || status === 'CANCELLED') return invitesStyles.statusNegative;
  return invitesStyles.statusPending;
}

function InvitesScreen({ invites, loading, message, onRespond, onBack, tally, showDialog }: Props) {
   const confirmDecline = (inviteId: string) => {
    showDialog({
      title: 'Decline this invite?',
      message: 'Are you sure you want to decline?',
      cancelText: 'Never mind',
      confirmText: 'Yes, decline',
      destructive: true,
      onConfirm: () => onRespond(inviteId, 'DECLINED'),
    });
  };

  const confirmCancel = (inviteId: string) => {
    showDialog({
      title: 'Cancel this invite?',
      message: 'You already accepted this one. Cancelling after accepting counts toward your cancellation history.',
      cancelText: 'Never mind',
      confirmText: 'Yes, cancel',
      destructive: true,
      onConfirm: () => onRespond(inviteId, 'CANCELLED'),
    });
  };

  
  // Opens Google Maps with directions to the meeting point.
  // Uses the address if there is one, otherwise the meeting point's name.
  const openDirections = (name: string, address: string | null) => {
    const destination = encodeURIComponent(address || name);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  };

  
  // ----- Sorting + paging -----
  const PAGE_SIZE = 5; // invites per page
  const [page, setPage] = useState(1);
  const scrollRef = useRef<ScrollView>(null); // lets us scroll back to the top

  // 1) Needs an answer (pending, upcoming) — soonest first
  // 2) Booked (accepted, upcoming) — soonest first
  // 3) History (everything else) — most recent first
  const sortedInvites = useMemo(() => {
    const now = new Date();
    const time = (inv: Invite) => new Date(inv.callRequest.shootDay.date).getTime();
    const isUpcoming = (inv: Invite) => time(inv) >= now.getTime();

    const needsAnswer = invites
      .filter((i) => i.status === 'PENDING' && !i.isExpired && isUpcoming(i))
      .sort((a, b) => time(a) - time(b));
    const booked = invites
      .filter((i) => i.status === 'ACCEPTED' && isUpcoming(i))
      .sort((a, b) => time(a) - time(b));
    const history = invites
      .filter((i) => !needsAnswer.includes(i) && !booked.includes(i))
      .sort((a, b) => time(b) - time(a));

    return [...needsAnswer, ...booked, ...history];
  }, [invites]);

  const totalPages = Math.max(1, Math.ceil(sortedInvites.length / PAGE_SIZE));
  const pageItems = sortedInvites.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stay on the same page when the list re-sorts (e.g. after Accept),
  // but move back if that page no longer exists.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
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
        <ScrollView ref={scrollRef} contentContainerStyle={invitesStyles.scrollContent}>
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

          {pageItems.map((invite) => {
            const shootDayPassed = new Date(invite.callRequest.shootDay.date) < new Date();

            return (
              <View key={invite.id} style={invitesStyles.card}>
                <Text style={invitesStyles.cardTitle}>{invite.callRequest.description}</Text>
                <Text style={invitesStyles.cardDetail}>{invite.callRequest.shootDay.production.name}</Text>

                <Text style={invitesStyles.cardDetail}>
                  {formatToDDMMYYYY(invite.callRequest.shootDay.date)} · Call {formatToHHMM(invite.callRequest.shootDay.date)}
                  {invite.callRequest.shootDay.estimatedWrapAt
                    ? ` · Est. wrap ${formatToHHMM(invite.callRequest.shootDay.estimatedWrapAt)}${
                        isNextDay(invite.callRequest.shootDay.date, invite.callRequest.shootDay.estimatedWrapAt)
                          ? ' (next day)'
                          : ''
                      }`
                    : ''}
                </Text>
                <Text style={[invitesStyles.cardDetail, { marginTop: 6 }]}>
                  📍 {invite.callRequest.shootDay.location}
                </Text>
                {invite.callRequest.shootDay.locationAddress ? (
                  <Text style={invitesStyles.addressText}>{invite.callRequest.shootDay.locationAddress}</Text>
                ) : null}

                {!shootDayPassed ? (
                  <TouchableOpacity
                    onPress={() =>
                      openDirections(invite.callRequest.shootDay.location, invite.callRequest.shootDay.locationAddress)
                    }
                  >
                    <Text style={invitesStyles.directionsText}>Get directions</Text>
                  </TouchableOpacity>
                ) : null}
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

          
          {/* Page controls — only when there's more than one page */}
          {!loading && totalPages > 1 ? (
            <View style={invitesStyles.pagination}>
              <TouchableOpacity
                style={[invitesStyles.pageButton, page === 1 && invitesStyles.pageButtonDisabled]}
                onPress={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                <Text style={invitesStyles.pageButtonText}>‹ Prev</Text>
              </TouchableOpacity>

              <Text style={invitesStyles.pageLabel}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[invitesStyles.pageButton, page === totalPages && invitesStyles.pageButtonDisabled]}
                onPress={() => goToPage(page + 1)}
                disabled={page === totalPages}
              >
                <Text style={invitesStyles.pageButtonText}>Next ›</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
    addressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  directionsText: {
    color: '#d99c4a',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 6,
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff9d9d',
  },
  declineButtonText: {
    color: '#ff9d9d',
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
    pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  pageButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pageButtonDisabled: {
    opacity: 0.35,
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  pageLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '600',
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