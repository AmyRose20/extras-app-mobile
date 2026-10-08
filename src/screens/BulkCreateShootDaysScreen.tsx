import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as locationsApi from '../api/locationsApi';
import * as shootDaysApi from '../api/shootDaysApi';
import { ApiError, errorMessage } from '../api/client';
import { formatToDDMMYYYY, formatToHHMM, computeWrap, isNextDay } from '../dateUtils';
import { Location } from '../types';
import MapPinPicker, { Pin } from '../components/MapPinPicker';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import GhostButton from '../components/GhostButton';
import TextField from '../components/TextField';
import { colors, text } from '../theme';

const OTHER = 'OTHER'; // dropdown value for "Other (enter address)"

type BatchDay = {
  date: Date;
  location: string;          // meeting point name
  locationAddress: string;
  estimatedWrapAt: Date | null;
  latitude: number | null;   // map pin (null if none)
  longitude: number | null;
};

type Props = {
  token: string;
  productionName: string | null; // the coordinator's production, shown read-only
  onBack: () => void;
  onCreated: (count: number) => void; // App shows a message and goes to the shoot days list
};

function BulkCreateShootDaysScreen({ token, productionName, onBack, onCreated }: Props) {
  // Saved meeting points for this production
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(OTHER);
  const [otherName, setOtherName] = useState('');
  const [otherAddress, setOtherAddress] = useState('');
  const [otherNameEdited, setOtherNameEdited] = useState(false); // true once the coordinator types a name
  const [otherPin, setOtherPin] = useState<Pin | null>(null); // map pin for "Other"
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
  const [locationError, setLocationError] = useState('');
  const [dateError, setDateError] = useState('');

  // Load this production's saved meeting points once, when the screen opens
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await locationsApi.getLocations();
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

  // The meeting point currently chosen in the form, or null if incomplete.
  // Includes the map pin: from the map for "Other", or from the saved location.
  const getCurrentMeetingPoint = (): {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  } | null => {
    if (selectedLocationId === OTHER) {
      const name = otherName.trim();
      const address = otherAddress.trim();
      if (!name || !address) return null;
      return {
        name,
        address,
        latitude: otherPin?.latitude ?? null,
        longitude: otherPin?.longitude ?? null,
      };
    }
    const saved = locations.find((l) => l.id === selectedLocationId);
    return saved
      ? { name: saved.name, address: saved.address, latitude: saved.latitude, longitude: saved.longitude }
      : null;
  };

  // Saves an "Other" location to this production's list, adds it to the
  // dropdown, and selects it so the next day can reuse it.
  const saveLocation = async (
    name: string,
    address: string,
    latitude: number | null,
    longitude: number | null
  ) => {
    try {
      const saved = await locationsApi.saveLocation({ name, address, latitude, longitude });
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
      setLocationError(
        selectedLocationId === OTHER && !otherPin
          ? 'Search for the meeting point, or tap the map to drop a pin.'
          : 'Give the meeting point a name.'
      );
      return null;
    }
    setLocationError('');
    return {
      date: currentDateTime,
      location: meetingPoint.name,
      locationAddress: meetingPoint.address,
      estimatedWrapAt: currentWrap,
      latitude: meetingPoint.latitude,
      longitude: meetingPoint.longitude,
    };
  };

  const resetForm = () => {
    setCurrentDateTime(new Date());
    setWrapTime(null);
    setOtherName('');
    setOtherAddress('');
    setSaveForNextTime(false);
    setOtherPin(null);
    setOtherNameEdited(false);
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
      await saveLocation(day.location, day.locationAddress, day.latitude, day.longitude);
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
        await saveLocation(day.location, day.locationAddress, day.latitude, day.longitude);
      }
    }

    setSubmitting(true);
    try {
      const created = await shootDaysApi.createShootDays(
        daysToCreate.map((day) => ({
          date: day.date.toISOString(),
          location: day.location,
          locationAddress: day.locationAddress,
          estimatedWrapAt: day.estimatedWrapAt ? day.estimatedWrapAt.toISOString() : null,
          latitude: day.latitude,
          longitude: day.longitude,
        }))
      );

      setBatchDays([]);
      resetForm();
      onCreated(created.length); // App shows "Created N shoot days." and opens the list
    } catch (error) {
      if (error instanceof ApiError && error.status !== 0) {
        // e.g. "Wednesday season 3 already has a shoot day on 22-10-2026" — shown under the date
        setDateError(error.message);
      } else {
        setMessage(errorMessage(error, 'Something went wrong creating those shoot days.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenBackground>
      <Text style={text.title}>Add Shoot Days</Text>

      <Text style={text.label}>Production</Text>
      <View style={bulkStyles.readOnlyBox}>
        <Text style={bulkStyles.readOnlyText}>{productionName ?? '—'}</Text>
      </View>

      <Text style={[text.sectionHeading, bulkStyles.sectionGap]}>Add a Day</Text>

      {/* Meeting point */}
      <Text style={text.label}>Meeting point</Text>
      <View style={bulkStyles.pickerWrapper}>
        <Picker
          selectedValue={selectedLocationId}
          onValueChange={(value) => {
            setSelectedLocationId(value);
            setLocationError('');
            setFormTouched(true);
          }}
          style={bulkStyles.picker}
          dropdownIconColor={colors.text}
        >
          {locations.map((loc) => (
            <Picker.Item key={loc.id} label={loc.name} value={loc.id} color={colors.onGold} />
          ))}
          <Picker.Item label="Other (enter address)" value={OTHER} color={colors.onGold} />
        </Picker>
      </View>

      {selectedLocationId === OTHER ? (
        <>
          <MapPinPicker
            token={token}
            pin={otherPin}
            onPinChange={(p) => {
              setOtherPin(p);
              setFormTouched(true);
              if (locationError) setLocationError('');
            }}
            onAddressFound={(address) => {
              setOtherAddress(address);
              // Until the coordinator types a name, use the first part of the address
              if (!otherNameEdited) setOtherName(address.split(',')[0].trim());
            }}
            onNameFound={(name) => {
              // A search result has a proper place name — prefer it (unless they've typed one)
              if (!otherNameEdited) setOtherName(name);
            }}
          />

          {/* Only shown once there's a pin (dropped on the map or picked from search) */}
          {otherPin ? (
            <>
              <Text style={bulkStyles.pinAddress}>📍 {otherAddress}</Text>

              <Text style={text.label}>Name for extras</Text>
              <TextField
                style={bulkStyles.compactInput}
                value={otherName}
                onChangeText={(value) => {
                  setOtherName(value);
                  setOtherNameEdited(true);
                  setFormTouched(true);
                  if (locationError) setLocationError('');
                }}
                placeholder="e.g. Beach car park"
              />

              <TouchableOpacity style={bulkStyles.checkboxRow} onPress={() => setSaveForNextTime((prev) => !prev)}>
                <View style={[bulkStyles.checkbox, saveForNextTime && bulkStyles.checkboxChecked]}>
                  {saveForNextTime ? <Text style={bulkStyles.checkmark}>✓</Text> : null}
                </View>
                <Text style={bulkStyles.checkboxLabel}>Save this location for next time</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </>
      ) : (
        <Text style={bulkStyles.hintText}>{locations.find((l) => l.id === selectedLocationId)?.address ?? ''}</Text>
      )}
      <View style={bulkStyles.errorSpace}>
        {locationError ? <Text style={bulkStyles.fieldError}>{locationError}</Text> : null}
      </View>

      {/* Date + call time */}
      <Text style={text.label}>Date</Text>
      <View style={bulkStyles.errorSpace}>
        {dateError ? <Text style={bulkStyles.fieldError}>{dateError}</Text> : null}
      </View>
      <TouchableOpacity style={bulkStyles.fieldBox} onPress={() => setShowDatePicker(true)}>
        <Text style={bulkStyles.dateTimeText}>{formatToDDMMYYYY(currentDateTime)}</Text>
      </TouchableOpacity>

      <Text style={text.label}>Call time</Text>
      <TouchableOpacity style={bulkStyles.fieldBox} onPress={() => setShowTimePicker(true)}>
        <Text style={bulkStyles.dateTimeText}>{formatToHHMM(currentDateTime)}</Text>
      </TouchableOpacity>

      {/* Optional estimated wrap */}
      <Text style={text.label}>Est. wrap time (optional)</Text>
      {currentWrap ? (
        <View style={bulkStyles.row}>
          <TouchableOpacity
            style={[bulkStyles.fieldBox, { flex: 1, marginBottom: 0 }]}
            onPress={() => setShowWrapPicker(true)}
          >
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
        <DateTimePicker
          value={currentDateTime}
          mode="date"
          display="default"
          themeVariant="dark"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      ) : null}
      {showTimePicker ? (
        <DateTimePicker
          value={currentDateTime}
          mode="time"
          display="default"
          themeVariant="dark"
          onChange={handleTimeChange}
        />
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

      <GhostButton title="Add Another Day" onPress={handleAddDay} style={bulkStyles.addDayButton} />

      {batchDays.length > 0 ? (
        <>
          <Text style={[text.sectionHeading, bulkStyles.sectionGap]}>Days in this batch ({batchDays.length})</Text>
          {batchDays.map((day, index) => (
            <GlassCard key={index} style={bulkStyles.card}>
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
            </GlassCard>
          ))}
        </>
      ) : null}

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GoldButton
        title={totalToCreate > 1 ? `Create All (${totalToCreate})` : 'Create Shoot Day'}
        loadingTitle="Creating..."
        loading={submitting}
        onPress={handleSubmitAll}
        style={bulkStyles.createButton}
      />

      <GhostButton title="Back" onPress={onBack} style={bulkStyles.backButton} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const bulkStyles = StyleSheet.create({
  sectionGap: {
    marginTop: 18,
  },
  // Slightly smaller than the normal TextField
  compactInput: {
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  // Looks like an input, but tapping it opens a date/time picker
  fieldBox: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dateTimeText: {
    color: colors.text,
    fontSize: 14,
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
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    marginLeft: 4,
  },
  pinAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
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
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  checkmark: {
    color: colors.onGold,
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: colors.textSoft,
    fontSize: 13,
  },
  errorSpace: {
    minHeight: 18, // keeps the space so the form doesn't jump when an error appears
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  linkText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  addDayButton: {
    marginTop: 12,
    marginBottom: 10,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 13,
    color: colors.textSoft,
  },
  cardAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  removeText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  createButton: {
    marginTop: 14,
  },
  backButton: {
    marginTop: 0,
    marginBottom: 10,
  },
});

export default BulkCreateShootDaysScreen;