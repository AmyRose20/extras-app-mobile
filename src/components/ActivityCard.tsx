import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import { colors } from '../theme';
import { Tally } from '../types';

// The Worked / Declined / Cancelled / No-shows box.
// Used on My Invites (an extra's own numbers) and on Extra Profile (coordinator's view).
//   <ActivityCard title="My Activity" tally={tally} />
type Props = {
  title: string;
  tally: Tally;
  children?: React.ReactNode; // anything extra under the numbers, e.g. a warning
};

function ActivityCard({ title, tally, children }: Props) {
  const stats = [
    { label: 'Worked', value: tally.worked },
    { label: 'Declined', value: tally.declined },
    { label: 'Cancelled', value: tally.cancelled },
    { label: 'No-shows', value: tally.noShows },
  ];

  return (
    <GlassCard>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.column}>
            <Text style={styles.number}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  column: {
    alignItems: 'center',
  },
  number: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default ActivityCard;