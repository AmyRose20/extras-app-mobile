import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';
import { formatToDDMMYYYY, formatToHHMM } from '../dateUtils';

type BatchDay = {
  date: Date;
  location: string;
};

type Props = {
  token: string;
  onBack: () => void;
};

function BulkCreateShootDaysScreen({ token, onBack }: Props) {
  const [productionName, setProductionName] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [batchDays, setBatchDays] = useState<BatchDay[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreatedPopup, setShowCreatedPopup] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [locationError, setLocationError] = useState('');
  const [dateError, setDateError] = useState('');

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(currentDateTime);
      combined.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setCurrentDateTime(combined);
      setDateError('');
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(currentDateTime);
      combined.setHours(selected.getHours(), selected.getMinutes());
      setCurrentDateTime(combined);
      setDateError('');
    }
  };

  const handleAddDay = () => {
    if (!currentLocation.trim()) {
      setLocationError('Location is required.');
      return;
    }

    setLocationError('');
    setBatchDays((prev) => [...prev, { date: currentDateTime, location: currentLocation.trim() }]);
    setCurrentLocation('');
    setCurrentDateTime(new Date());
    setMessage('');
  };

  const handleRemoveDay = (index: number) => {
    setBatchDays((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    setMessage('');
    setDateError('');

    if (!productionName.trim()) {
      setMessage('Enter a production name before creating these shoot days.');
      return;
    }

    // If there's a day currently filled in that hasn't been added to the
    // batch yet, include it automatically — you shouldn't have to press
    // "Add Another Day" just to create a single shoot day.
    const daysToCreate = [...batchDays];
    if (currentLocation.trim()) {
      daysToCreate.push({ date: currentDateTime, location: currentLocation.trim() });
    }

    if (daysToCreate.length === 0) {
      setMessage('Add at least one day before creating.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/shoot-days/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productionName: productionName.trim(),
          shootDays: daysToCreate.map((day) => ({
            date: day.date.toISOString(),
            location: day.location,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDateError(data.error);
        return;
      }

      setCreatedCount(data.length);
      setShowCreatedPopup(true);
      setTimeout(() => setShowCreatedPopup(false), 3000);
      setBatchDays([]);
      setProductionName('');
      setCurrentLocation('');
      setCurrentDateTime(new Date());
    } catch (error) {
      setMessage('Something went wrong creating those shoot days.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={bulkStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {showCreatedPopup ? (
          <View style={bulkStyles.savedPopup}>
            <Text style={bulkStyles.savedPopupText}>
              Created {createdCount} shoot {createdCount === 1 ? 'day' : 'days'}.
            </Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={bulkStyles.scrollContent}>
          <Text style={bulkStyles.title}>Add Shoot Days</Text>

          <Text style={bulkStyles.fieldLabel}>Production Name</Text>
          <TextInput
            style={bulkStyles.input}
            value={productionName}
            onChangeText={setProductionName}
            placeholder="e.g. Midnight Run"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />

          <Text style={bulkStyles.sectionHeading}>Add a Day</Text>

          <Text style={bulkStyles.fieldLabel}>Location</Text>
          <TextInput
            style={bulkStyles.input}
            value={currentLocation}
            onChangeText={(text) => {
              setCurrentLocation(text);
              if (locationError) setLocationError('');
            }}
            placeholder="e.g. Riverside Studios"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
          <View style={{ minHeight: 18 }}>
            {locationError ? <Text style={bulkStyles.fieldError}>{locationError}</Text> : null}
          </View>

          <Text style={bulkStyles.fieldLabel}>Date</Text>
          <View style={{ minHeight: 18 }}>
            {dateError ? <Text style={bulkStyles.fieldError}>{dateError}</Text> : null}
          </View>
          <TouchableOpacity style={bulkStyles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={bulkStyles.dateTimeText}>{formatToDDMMYYYY(currentDateTime)}</Text>
          </TouchableOpacity>

          <Text style={bulkStyles.fieldLabel}>Time</Text>
          <TouchableOpacity style={bulkStyles.input} onPress={() => setShowTimePicker(true)}>
            <Text style={bulkStyles.dateTimeText}>{formatToHHMM(currentDateTime)}</Text>
          </TouchableOpacity>

          {showDatePicker ? (
            <DateTimePicker value={currentDateTime} mode="date" display="default" themeVariant="dark" onChange={handleDateChange} />
          ) : null}
          {showTimePicker ? (
            <DateTimePicker value={currentDateTime} mode="time" display="default" themeVariant="dark" onChange={handleTimeChange} />
          ) : null}

          <TouchableOpacity style={bulkStyles.buttonGhost} onPress={handleAddDay}>
            <Text style={bulkStyles.buttonGhostText}>Add Another Day</Text>
          </TouchableOpacity>

          {batchDays.length > 0 ? (
            <>
              <Text style={bulkStyles.sectionHeading}>Days in this batch ({batchDays.length})</Text>
              {batchDays.map((day, index) => (
                <View key={index} style={bulkStyles.card}>
                  <Text style={bulkStyles.cardTitle}>
                    {formatToDDMMYYYY(day.date)} at {formatToHHMM(day.date)}
                  </Text>
                  <Text style={bulkStyles.cardDetail}>{day.location}</Text>
                  <TouchableOpacity onPress={() => handleRemoveDay(index)}>
                    <Text style={bulkStyles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : null}

          {message ? <Text style={bulkStyles.message}>{message}</Text> : null}

          <TouchableOpacity
            style={[bulkStyles.button, submitting && { opacity: 0.6 }]}
            onPress={handleSubmitAll}
            disabled={submitting}
          >
            <Text style={bulkStyles.buttonText}>
              {submitting ? 'Creating...' : batchDays.length > 0 ? 'Create All' : 'Create Shoot Day'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={bulkStyles.buttonGhost} onPress={onBack}>
            <Text style={bulkStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const bulkStyles = StyleSheet.create({
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 18,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 14,
  },
  fieldError: {
    color: '#ff9d9d',
    fontSize: 12,
    marginBottom: 6,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 8,
  },
  removeText: {
    color: '#ff9d9d',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  buttonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  savedPopup: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 10,
  },
  savedPopupText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default BulkCreateShootDaysScreen;