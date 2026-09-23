import React from 'react';
import { SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { styles, colors } from '../styles';

type Props = {
  title: string;
  markedDates: Record<string, { marked?: boolean; dotColor?: string }>;
  onSelectDay: (dateString: string) => void;
  onBack: () => void;
};

function CalendarScreen({ title, markedDates, onSelectDay, onBack }: Props) {
  const handleDayPress = (day: DateData) => {
    onSelectDay(day.dateString);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          dotColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
        }}
      />

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default CalendarScreen;