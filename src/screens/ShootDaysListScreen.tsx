import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Shoot Days</Text>

        {loading ? <Text style={styles.message}>Loading...</Text> : null}

        {!loading && shootDays.length === 0 ? (
          <Text style={styles.message}>No shoot days yet.</Text>
        ) : null}

        {shootDays.map((day) => (
          <TouchableOpacity key={day.id} style={styles.card} onPress={() => onSelectShootDay(day.id)}>
            <Text style={styles.cardTitle}>{day.productionName}</Text>
            <Text style={styles.cardDetail}>{day.location}</Text>
            <Text style={styles.cardDetail}>
              {formatToDDMMYYYY(day.date)} at {formatToHHMM(day.date)}
            </Text>
            <Text style={styles.cardStatus}>{day.isPast ? 'PAST' : 'UPCOMING'}</Text>
          </TouchableOpacity>
        ))}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ShootDaysListScreen;