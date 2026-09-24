import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ShootDaySummary } from '../types';
import { formatToDDMMYYYY, formatToHHMM } from '../dateUtils';

type Props = {
  shootDays: ShootDaySummary[];
  loading: boolean;
  message: string;
  onSelectShootDay: (id: string) => void;
  onBack: () => void;
};

function ShootDaysListScreen({ shootDays, loading, message, onSelectShootDay, onBack }: Props) {
  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={shootDaysStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={shootDaysStyles.scrollContent}>
          <Text style={shootDaysStyles.title}>Shoot Days</Text>

          {loading ? <Text style={shootDaysStyles.message}>Loading...</Text> : null}

          {!loading && shootDays.length === 0 ? (
            <Text style={shootDaysStyles.message}>No shoot days yet.</Text>
          ) : null}

          {shootDays.map((day) => (
            <TouchableOpacity key={day.id} style={shootDaysStyles.card} onPress={() => onSelectShootDay(day.id)}>
              <Text style={shootDaysStyles.cardTitle}>{day.productionName}</Text>
              <Text style={shootDaysStyles.cardDetail}>{day.location}</Text>
              <Text style={shootDaysStyles.cardDetail}>
                {formatToDDMMYYYY(day.date)} at {formatToHHMM(day.date)}
              </Text>
              <Text style={day.isPast ? shootDaysStyles.statusPast : shootDaysStyles.statusUpcoming}>
                {day.isPast ? 'PAST' : 'UPCOMING'}
              </Text>
            </TouchableOpacity>
          ))}

          {message ? <Text style={shootDaysStyles.message}>{message}</Text> : null}

          <TouchableOpacity style={shootDaysStyles.buttonGhost} onPress={onBack}>
            <Text style={shootDaysStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const shootDaysStyles = StyleSheet.create({
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
  statusUpcoming: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#d99c4a',
    marginTop: 8,
  },
  statusPast: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
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

export default ShootDaysListScreen;