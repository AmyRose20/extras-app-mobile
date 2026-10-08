import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShootDaySummary } from '../types';
import { formatToDDMMYYYY, formatToHHMM } from '../dateUtils';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GhostButton from '../components/GhostButton';
import Pager from '../components/Pager';
import { colors, text } from '../theme';

const PAGE_SIZE = 6; // shoot days per page

type Props = {
  shootDays: ShootDaySummary[];
  loading: boolean;
  message: string;
  onSelectShootDay: (id: string) => void;
  onBack: () => void;
};

function ShootDaysListScreen({ shootDays, loading, message, onSelectShootDay, onBack }: Props) {
  const [page, setPage] = useState(1);
  const scrollRef = useRef<ScrollView>(null); // lets us scroll back to the top

  // Upcoming first (soonest at the top), then past (most recent first)
  const sortedShootDays = useMemo(() => {
    const time = (d: ShootDaySummary) => new Date(d.date).getTime();
    const upcoming = shootDays.filter((d) => !d.isPast).sort((a, b) => time(a) - time(b));
    const past = shootDays.filter((d) => d.isPast).sort((a, b) => time(b) - time(a));
    return [...upcoming, ...past];
  }, [shootDays]);

  const totalPages = Math.max(1, Math.ceil(sortedShootDays.length / PAGE_SIZE));
  const pageItems = sortedShootDays.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Whenever the list changes (e.g. new shoot days created), go back to page 1
  useEffect(() => {
    setPage(1);
  }, [shootDays]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ScreenBackground scrollRef={scrollRef}>
      <Text style={text.title}>Shoot Days</Text>

      {loading ? <Text style={text.message}>Loading...</Text> : null}

      {!loading && shootDays.length === 0 ? <Text style={text.message}>No shoot days yet.</Text> : null}

      {pageItems.map((day) => (
        <TouchableOpacity key={day.id} onPress={() => onSelectShootDay(day.id)}>
          <GlassCard style={shootDaysStyles.card}>
            <Text style={shootDaysStyles.cardTitle}>{day.production.name}</Text>
            <Text style={shootDaysStyles.cardDetail}>{day.location}</Text>
            <Text style={shootDaysStyles.cardDetail}>
              {formatToDDMMYYYY(day.date)} at {formatToHHMM(day.date)}
            </Text>
            <Text style={[shootDaysStyles.status, day.isPast ? shootDaysStyles.statusPast : shootDaysStyles.statusUpcoming]}>
              {day.isPast ? 'PAST' : 'UPCOMING'}
            </Text>
          </GlassCard>
        </TouchableOpacity>
      ))}

      {/* Page controls (hidden when there's only one page) */}
      {!loading ? <Pager page={page} totalPages={totalPages} onChange={goToPage} /> : null}

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const shootDaysStyles = StyleSheet.create({
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
  status: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  statusUpcoming: {
    color: colors.gold,
  },
  statusPast: {
    color: 'rgba(255,255,255,0.4)',
  },
});

export default ShootDaysListScreen;