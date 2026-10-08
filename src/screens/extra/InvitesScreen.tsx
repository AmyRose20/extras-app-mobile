import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { DialogConfig, Invite, Tally } from '../../types';
import { formatToDDMMYYYY, formatToHHMM, isNextDay } from '../../dateUtils';
import ScreenBackground from '../../components/ScreenBackground';
import GlassCard from '../../components/GlassCard';
import GhostButton from '../../components/GhostButton';
import Pager from '../../components/Pager';
import ActivityCard from '../../components/ActivityCard';
import { colors, text } from '../../theme';

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
  if (status === 'DECLINED' || status === 'CANCELLED' || status === 'NO_SHOW') return invitesStyles.statusNegative;
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
  // Uses the exact map pin if there is one; otherwise the address (or name).
  const openDirections = (
    name: string,
    address: string | null,
    latitude: number | null,
    longitude: number | null
  ) => {
    const destination =
      latitude != null && longitude != null
        ? `${latitude},${longitude}` // exact pin
        : encodeURIComponent(address || name);
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
    <ScreenBackground scrollRef={scrollRef}>
      <Text style={text.title}>My Invites</Text>

      {tally ? <ActivityCard title="My Activity" tally={tally} /> : null}

      {loading ? <Text style={text.message}>Loading...</Text> : null}

      {!loading && invites.length === 0 ? <Text style={text.message}>No invites yet.</Text> : null}

      {pageItems.map((invite) => {
        const shootDay = invite.callRequest.shootDay;
        const shootDayPassed = new Date(shootDay.date) < new Date();

        return (
          <GlassCard key={invite.id} style={invitesStyles.card}>
            <Text style={invitesStyles.cardTitle}>{invite.callRequest.description}</Text>
            <Text style={invitesStyles.cardDetail}>{shootDay.production.name}</Text>

            <Text style={invitesStyles.cardDetail}>
              {formatToDDMMYYYY(shootDay.date)} · Call {formatToHHMM(shootDay.date)}
              {shootDay.estimatedWrapAt
                ? ` · Est. wrap ${formatToHHMM(shootDay.estimatedWrapAt)}${
                    isNextDay(shootDay.date, shootDay.estimatedWrapAt) ? ' (next day)' : ''
                  }`
                : ''}
            </Text>
            <Text style={[invitesStyles.cardDetail, { marginTop: 6 }]}>📍 {shootDay.location}</Text>
            {shootDay.locationAddress ? <Text style={invitesStyles.addressText}>{shootDay.locationAddress}</Text> : null}

            {!shootDayPassed ? (
              <TouchableOpacity
                onPress={() =>
                  openDirections(shootDay.location, shootDay.locationAddress, shootDay.latitude, shootDay.longitude)
                }
              >
                <Text style={[text.link, invitesStyles.directionsText]}>Get directions</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={[invitesStyles.status, statusStyle(invite.status, invite.isExpired)]}>
              Status: {invite.isExpired ? 'EXPIRED' : invite.status === 'NO_SHOW' ? 'NO-SHOW' : invite.status}
            </Text>

            {invite.status === 'PENDING' && !invite.isExpired ? (
              <View style={invitesStyles.cardButtonRow}>
                <TouchableOpacity
                  style={[invitesStyles.smallButton, invitesStyles.acceptButton]}
                  onPress={() => onRespond(invite.id, 'ACCEPTED')}
                >
                  <Text style={invitesStyles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[invitesStyles.smallButton, invitesStyles.declineButton]}
                  onPress={() => confirmDecline(invite.id)}
                >
                  <Text style={invitesStyles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {invite.status === 'ACCEPTED' && !shootDayPassed ? (
              <TouchableOpacity onPress={() => confirmCancel(invite.id)}>
                <Text style={[text.link, invitesStyles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </GlassCard>
        );
      })}

      {/* Page controls (hidden when there's only one page) */}
      {!loading ? <Pager page={page} totalPages={totalPages} onChange={goToPage} /> : null}

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const invitesStyles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
    marginTop: 6,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  statusPending: {
    color: colors.gold,
  },
  statusAccepted: {
    color: '#8fd9a8',
  },
  statusNegative: {
    color: colors.error,
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
    color: colors.onGold,
    fontWeight: '700',
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  declineButtonText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
  cancelText: {
    color: colors.error,
    marginTop: 10,
  },
});

export default InvitesScreen;