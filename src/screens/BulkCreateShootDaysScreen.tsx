import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { styles } from '../styles';
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

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(currentDateTime);
      combined.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setCurrentDateTime(combined);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(currentDateTime);
      combined.setHours(selected.getHours(), selected.getMinutes());
      setCurrentDateTime(combined);
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

    if (!productionName.trim()) {
      setMessage('Enter a production name before creating these shoot days.');
      return;
    }

    if (batchDays.length === 0) {
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
          shootDays: batchDays.map((day) => ({
            date: day.date.toISOString(),
            location: day.location,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Could not create shoot days: ${data.error}`);
        return;
      }

      setCreatedCount(data.length);
      setShowCreatedPopup(true);
      setTimeout(() => setShowCreatedPopup(false), 3000);
      setBatchDays([]);
      setProductionName('');
    } catch (error) {
      setMessage('Something went wrong creating those shoot days.');
    } finally {
      setSubmitting(false);
    }
  };

    return (
    <SafeAreaView style={styles.container}>
      {showCreatedPopup ? (
        <View style={styles.savedPopup}>
          <Text style={styles.savedPopupText}>Created {createdCount} shoot days.</Text>
        </View>
      ) : null}

      <ScrollView>
        <Text style={styles.title}>Bulk Create Shoot Days</Text>

        <Text style={styles.fieldLabel}>Production Name</Text>
        <TextInput
          style={styles.input}
          value={productionName}
          onChangeText={setProductionName}
          placeholder="e.g. Midnight Run"
        />

        <Text style={styles.sectionHeading}>Add a Day</Text>

        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput
          style={styles.input}
          value={currentLocation}
          onChangeText={(text) => {
            setCurrentLocation(text);
            if (locationError) setLocationError('');
          }}
          placeholder="e.g. Riverside Studios"
        />
        <View style={{ minHeight: 18 }}>
          {locationError ? <Text style={styles.fieldError}>{locationError}</Text> : null}
        </View>

        <Text style={styles.fieldLabel}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{formatToDDMMYYYY(currentDateTime)}</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text>{formatToHHMM(currentDateTime)}</Text>
        </TouchableOpacity>

        {showDatePicker ? (
          <DateTimePicker value={currentDateTime} mode="date" display="default" onChange={handleDateChange} />
        ) : null}
        {showTimePicker ? (
          <DateTimePicker value={currentDateTime} mode="time" display="default" onChange={handleTimeChange} />
        ) : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={handleAddDay}>
          <Text style={styles.buttonText}>Add Day</Text>
        </TouchableOpacity>

        {batchDays.length > 0 ? (
          <>
            <Text style={styles.sectionHeading}>Days in this batch ({batchDays.length})</Text>
            {batchDays.map((day, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {formatToDDMMYYYY(day.date)} at {formatToHHMM(day.date)}
                </Text>
                <Text style={styles.cardDetail}>{day.location}</Text>
                <TouchableOpacity onPress={() => handleRemoveDay(index)}>
                  <Text style={styles.editLinkText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.button, styles.buttonSpacing]}
          onPress={handleSubmitAll}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Creating...' : 'Create All'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default BulkCreateShootDaysScreen;