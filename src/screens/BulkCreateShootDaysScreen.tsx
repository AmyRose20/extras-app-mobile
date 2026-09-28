import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';
import { formatToDDMMYYYY, formatToHHMM } from '../dateUtils';
import { Location } from '../types';

const OTHER = 'OTHER'; // dropdown value for "Other (enter address)"

type BatchDay = {
  date: Date;
  location: string;          // meeting point name
  locationAddress: string;
  estimatedWrapAt: Date | null;
};

type Props = {
  token: string;
  productionName: string | null; // the coordinator's production, shown read-only
  onBack: () => void;
};

// Puts the wrap's time of day onto the call's date. If that's not after the
// call time, it's an overnight shoot, so the wrap rolls to the next day.
function computeWrap(call: Date, wrapTimeOfDay: Date): Date {
  const wrap = new Date(call);
  wrap.setHours(wrapTimeOfDay.getHours(), wrapTimeOfDay.getMinutes(), 0, 0);
  if (wrap <= call) {
    wrap.setDate(wrap.getDate() + 1);
  }
  return wrap;
}

function isNextDay(call: Date, wrap: Date): boolean {
  return call.toDateString() !== wrap.toDateString();
}

function BulkCreateShootDaysScreen({ token, productionName, onBack }: Props) {
  // Saved meeting points for this production
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(OTHER);
  const [otherName, setOtherName] = useState('');
  const [otherAddress, setOtherAddress] = useState('');
  const [saveForNextTime, setSaveForNextTime] = useState(false);
  // True once the coordinator changes anything in the "Add a Day" form.
  // Used to decide whether the form's day should be created along with the batch.
  const [formTouched, setFormTouched] = useState(false);

  // The day currently being filled in
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [wrapTime, setWrapTime] = useState<Date | null>(null); // only the time of day matters
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showWrapPicker, setShowWrapPicker] = useState(false);

  const [batchDays, setBatchDays] = useState<BatchDay[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreatedPopup, setShowCreatedPopup] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [locationError, setLocationError] = useState('');
  const [dateError, setDateError] = useState('');

  // Load this production's saved meeting points once, when the screen opens
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch(`${API_URL}/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data: Location[] = await response.json();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocationId(data[0].id); // default to the first studio
        }
      } catch (error) {
        // If this fails, the dropdown just offers "Other"
      }
    };
    loadLocations();
  }, [token]);

  // The meeting point currently chosen in the form, or null if incomplete
  const getCurrentMeetingPoint = (): { name: string; address: string } | null => {
    if (selectedLocationId === OTHER) {
      const name = otherName.trim();
      const address = otherAddress.trim();
      return name && address ? { name, address } : null;
    }
    const saved = locations.find((l) => l.id === selectedLocationId);
    return saved ? { name: saved.name, address: saved.address } : null;
  };

  // Saves an "Other" location to this production's list, adds it to the
  // dropdown, and selects it so the next day can reuse it.
  const saveLocation = async (name: string, address: string) => {
    try {
      const response = await fetch(`${API_URL}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, address }),
      });
      if (!response.ok) return;

      const saved: Location = await response.json();
      setLocations((prev) =>
        prev.some((l) => l.id === saved.id)
          ? prev // already in the list
          : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
      );
      setSelectedLocationId(saved.id);
    } catch (error) {
      // Not critical — the shoot day still has its own copy of the address
    }
  };

  // The full wrap date/time for the current form, or null if no wrap set
  const currentWrap = wrapTime ? computeWrap(currentDateTime, wrapTime) : null;

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(currentDateTime);
      combined.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setCurrentDateTime(combined);
      setDateError('');
      setFormTouched(true);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(currentDateTime);
      combined.setHours(selected.getHours(), selected.getMinutes());
      setCurrentDateTime(combined);
      setDateError('');
      setFormTouched(true);
    }
  };

  const handleWrapChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowWrapPicker(false);
    if (event.type === 'set' && selected) {
      setWrapTime(selected);
      setFormTouched(true);
    }
  };

  // Builds a batch day from the form, or shows an error and returns null
  const buildCurrentDay = (): BatchDay | null => {
    const meetingPoint = getCurrentMeetingPoint();
    if (!meetingPoint) {
      setLocationError('Enter a meeting point name and address.');
      return null;
    }
    setLocationError('');
    return {
      date: currentDateTime,
      location: meetingPoint.name,
      locationAddress: meetingPoint.address,
      estimatedWrapAt: currentWrap,
    };
  };

  const resetForm = () => {
    setCurrentDateTime(new Date());
    setWrapTime(null);
    setOtherName('');
    setOtherAddress('');
    setSaveForNextTime(false);
    // keep the selected meeting point — the next day is often at the same studio
  };

  const handleAddDay = async () => {
  const day = buildCurrentDay();
  if (!day) return;

  const shouldSave = selectedLocationId === OTHER && saveForNextTime;

  setBatchDays((prev) => [...prev, day]);
  resetForm();
  setMessage('');

  if (shouldSave) {
    await saveLocation(day.location, day.locationAddress);
    }
  };

  const handleRemoveDay = (index: number) => {
    setBatchDays((prev) => prev.filter((_, i) => i !== index));
  };

  // Include the form's day if the batch is empty, or if the coordinator has
  // started filling in another day without tapping "Add Another Day".
  const includeFormDay = batchDays.length === 0 || formTouched;
  const totalToCreate = batchDays.length + (includeFormDay ? 1 : 0);

  const handleSubmitAll = async () => {
    setMessage('');
    setDateError('');

    // Create everything in the batch, plus the form's day if it's been filled in.
    let daysToCreate: BatchDay[] = [...batchDays];
    if (includeFormDay) {
      const day = buildCurrentDay();
      if (!day) return; // shows the meeting point error
      daysToCreate.push(day);
      if (selectedLocationId === OTHER && saveForNextTime) {
        await saveLocation(day.location, day.locationAddress);
      }
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
          shootDays: daysToCreate.map((day) => ({
            date: day.date.toISOString(),
            location: day.location,
            locationAddress: day.locationAddress,
            estimatedWrapAt: day.estimatedWrapAt ? day.estimatedWrapAt.toISOString() : null,
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
      resetForm();
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

        <ScrollView contentContainerStyle={bulkStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={bulkStyles.title}>Add Shoot Days</Text>

          <Text style={bulkStyles.fieldLabel}>Production</Text>
          <View style={bulkStyles.readOnlyBox}>
            <Text style={bulkStyles.readOnlyText}>{productionName ?? '—'}</Text>
          </View>

          <Text style={bulkStyles.sectionHeading}>Add a Day</Text>

          {/* Meeting point */}
          <Text style={bulkStyles.fieldLabel}>Meeting point</Text>
          <View style={bulkStyles.pickerWrapper}>
            <Picker
              selectedValue={selectedLocationId}
              onValueChange={(value) => {
                setSelectedLocationId(value);
                setLocationError('');
                setFormTouched(true);
              }}
              style={bulkStyles.picker}
              dropdownIconColor="#fff"
            >
              {locations.map((loc) => (
                <Picker.Item key={loc.id} label={loc.name} value={loc.id} color="#1a1330" />
              ))}
              <Picker.Item label="Other (enter address)" value={OTHER} color="#1a1330" />
            </Picker>
          </View>

          {selectedLocationId === OTHER ? (
            <>
              <TextInput
                style={bulkStyles.input}
                value={otherName}
                onChangeText={(text) => {
                  setOtherName(text);
                  setFormTouched(true);
                  if (locationError) setLocationError('');
                }}
                placeholder="Name, e.g. Brittas Bay beach car park"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TextInput
                style={bulkStyles.input}
                value={otherAddress}
                onChangeText={(text) => {
                  setOtherAddress(text);
                  setFormTouched(true);
                  if (locationError) setLocationError('');
                }}
                placeholder="Address, e.g. Brittas Bay, Co. Wicklow"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TouchableOpacity
                style={bulkStyles.checkboxRow}
                onPress={() => setSaveForNextTime((prev) => !prev)}
              >
                <View style={[bulkStyles.checkbox, saveForNextTime && bulkStyles.checkboxChecked]}>
                  {saveForNextTime ? <Text style={bulkStyles.checkmark}>✓</Text> : null}
                </View>
                <Text style={bulkStyles.checkboxLabel}>Save this location for next time</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={bulkStyles.hintText}>
              {locations.find((l) => l.id === selectedLocationId)?.address ?? ''}
            </Text>
          )}
          <View style={{ minHeight: 18 }}>
            {locationError ? <Text style={bulkStyles.fieldError}>{locationError}</Text> : null}
          </View>

          {/* Date + call time */}
          <Text style={bulkStyles.fieldLabel}>Date</Text>
          <View style={{ minHeight: 18 }}>
            {dateError ? <Text style={bulkStyles.fieldError}>{dateError}</Text> : null}
          </View>
          <TouchableOpacity style={bulkStyles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={bulkStyles.dateTimeText}>{formatToDDMMYYYY(currentDateTime)}</Text>
          </TouchableOpacity>

          <Text style={bulkStyles.fieldLabel}>Call time</Text>
          <TouchableOpacity style={bulkStyles.input} onPress={() => setShowTimePicker(true)}>
            <Text style={bulkStyles.dateTimeText}>{formatToHHMM(currentDateTime)}</Text>
          </TouchableOpacity>

          {/* Optional estimated wrap */}
          <Text style={bulkStyles.fieldLabel}>Est. wrap time (optional)</Text>
          {currentWrap ? (
            <View style={bulkStyles.row}>
              <TouchableOpacity style={[bulkStyles.input, { flex: 1, marginBottom: 0 }]} onPress={() => setShowWrapPicker(true)}>
                <Text style={bulkStyles.dateTimeText}>
                  {formatToHHMM(currentWrap)}
                  {isNextDay(currentDateTime, currentWrap) ? '  (next day)' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWrapTime(null)}>
                <Text style={bulkStyles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowWrapPicker(true)} style={{ marginBottom: 12 }}>
              <Text style={bulkStyles.linkText}>+ Add est. wrap time</Text>
            </TouchableOpacity>
          )}

          {showDatePicker ? (
            <DateTimePicker value={currentDateTime} mode="date" display="default" themeVariant="dark" onChange={handleDateChange} />
          ) : null}
          {showTimePicker ? (
            <DateTimePicker value={currentDateTime} mode="time" display="default" themeVariant="dark" onChange={handleTimeChange} />
          ) : null}
          {showWrapPicker ? (
            <DateTimePicker
              // start from the current wrap, or 10 hours after the call time
              value={currentWrap ?? new Date(currentDateTime.getTime() + 10 * 60 * 60 * 1000)}
              mode="time"
              display="default"
              themeVariant="dark"
              onChange={handleWrapChange}
            />
          ) : null}

          <TouchableOpacity style={[bulkStyles.buttonGhost, { marginTop: 12 }]} onPress={handleAddDay}>
            <Text style={bulkStyles.buttonGhostText}>Add Another Day</Text>
          </TouchableOpacity>

          {batchDays.length > 0 ? (
            <>
              <Text style={bulkStyles.sectionHeading}>Days in this batch ({batchDays.length})</Text>
              {batchDays.map((day, index) => (
                <View key={index} style={bulkStyles.card}>
                  <Text style={bulkStyles.cardTitle}>
                    {formatToDDMMYYYY(day.date)} · call {formatToHHMM(day.date)}
                    {day.estimatedWrapAt
                      ? ` · wrap ~${formatToHHMM(day.estimatedWrapAt)}${isNextDay(day.date, day.estimatedWrapAt) ? ' (+1)' : ''}`
                      : ''}
                  </Text>
                  <Text style={bulkStyles.cardDetail}>{day.location}</Text>
                  <Text style={bulkStyles.cardAddress}>{day.locationAddress}</Text>
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
              {submitting
                ? 'Creating...'
                : totalToCreate > 1
                ? `Create All (${totalToCreate})`
                : 'Create Shoot Day'}
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
  readOnlyBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  readOnlyText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    marginLeft: 4,
  },
    checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#d99c4a',
    borderColor: '#d99c4a',
  },
  checkmark: {
    color: '#1a1330',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  linkText: {
    color: '#d99c4a',
    fontSize: 14,
    fontWeight: '600',
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
    color: 'rgba(255,255,255,0.85)',
  },
  cardAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
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
    elevation: 10,
  },
  savedPopupText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default BulkCreateShootDaysScreen;