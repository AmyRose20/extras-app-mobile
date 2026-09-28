import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';
import { ShootDayDetail, CallRequestSummary, Location } from '../types';
import { formatToDDMMYYYY, formatToHHMM, computeWrap, isNextDay } from '../dateUtils';

const OTHER = 'OTHER'; // dropdown value for "Other (enter address)"

type Props = {
  token: string;
  shootDay: ShootDayDetail | null;
  loading: boolean;
  message: string;
  onBack: () => void;
  onSaved: () => void; // App reloads the shoot day after a successful save

  editingCallRequestId: string | null;
  editDescription: string;
  setEditDescription: (value: string) => void;
  editQuantity: string;
  setEditQuantity: (value: string) => void;
  onStartEditCallRequest: (callRequest: CallRequestSummary) => void;
  onCancelEditCallRequest: () => void;
  onSaveCallRequest: () => void;
  onViewResponses: (callRequestId: string) => void;
};

function ShootDayDetailScreen({
  token,
  shootDay,
  loading,
  message,
  onBack,
  onSaved,
  editingCallRequestId,
  editDescription,
  setEditDescription,
  editQuantity,
  setEditQuantity,
  onStartEditCallRequest,
  onCancelEditCallRequest,
  onSaveCallRequest,
  onViewResponses,
}: Props) {
  // ----- Saved meeting points for the dropdown -----
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch(`${API_URL}/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) setLocations(await response.json());
      } catch (error) {
        // If this fails, the dropdown just offers "Other"
      }
    };
    loadLocations();
  }, [token]);

  // ----- Edit mode state (only used while editing) -----
  const [isEditing, setIsEditing] = useState(false);
  const [editDateTime, setEditDateTime] = useState<Date>(new Date());
  const [wrapTime, setWrapTime] = useState<Date | null>(null); // only the time of day matters
  const [selectedLocationId, setSelectedLocationId] = useState<string>(OTHER);
  const [otherName, setOtherName] = useState('');
  const [otherAddress, setOtherAddress] = useState('');
  const [saveForNextTime, setSaveForNextTime] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showWrapPicker, setShowWrapPicker] = useState(false);

  const [locationError, setLocationError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  // Full wrap date/time for the form, or null if no wrap set
  const currentWrap = wrapTime ? computeWrap(editDateTime, wrapTime) : null;

  // Fill the form with the shoot day's current details and switch to edit mode
  const startEdit = () => {
    if (!shootDay) return;
    setEditDateTime(new Date(shootDay.date));
    setWrapTime(shootDay.estimatedWrapAt ? new Date(shootDay.estimatedWrapAt) : null);

    // If the meeting point is one of the saved locations, select it;
    // otherwise open on "Other" with the current name/address filled in
    const match = locations.find((l) => l.name === shootDay.location);
    if (match) {
      setSelectedLocationId(match.id);
      setOtherName('');
      setOtherAddress('');
    } else {
      setSelectedLocationId(OTHER);
      setOtherName(shootDay.location);
      setOtherAddress(shootDay.locationAddress ?? '');
    }

    setSaveForNextTime(false);
    setLocationError('');
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setLocationError('');
    setSaveError('');
  };

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

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(editDateTime);
      combined.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEditDateTime(combined);
      setSaveError('');
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selected) {
      const combined = new Date(editDateTime);
      combined.setHours(selected.getHours(), selected.getMinutes());
      setEditDateTime(combined);
      setSaveError('');
    }
  };

  const handleWrapChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowWrapPicker(false);
    if (event.type === 'set' && selected) {
      setWrapTime(selected);
      setSaveError('');
    }
  };

  const handleSave = async () => {
    if (!shootDay) return;

    const meetingPoint = getCurrentMeetingPoint();
    if (!meetingPoint) {
      setLocationError('Enter a meeting point name and address.');
      return;
    }
    setLocationError('');
    setSaveError('');
    setSaving(true);

    try {
      // Optionally save an "Other" location for next time (not critical if it fails)
      if (selectedLocationId === OTHER && saveForNextTime) {
        try {
          const locResponse = await fetch(`${API_URL}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: meetingPoint.name, address: meetingPoint.address }),
          });
          if (locResponse.ok) {
            const saved: Location = await locResponse.json();
            setLocations((prev) =>
              prev.some((l) => l.id === saved.id)
                ? prev
                : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
            );
          }
        } catch (error) {
          // ignore — the shoot day still keeps its own copy of the address
        }
      }

      // Send everything; the backend works out what actually changed
      // (and only notifies extras about real changes)
      const response = await fetch(`${API_URL}/shoot-days/${shootDay.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: editDateTime.toISOString(),
          estimatedWrapAt: currentWrap ? currentWrap.toISOString() : null,
          location: meetingPoint.name,
          locationAddress: meetingPoint.address,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSaveError(data.error);
        return;
      }

      setIsEditing(false);
      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 3000);
      onSaved(); // App reloads the shoot day so view mode shows the new details
    } catch (error) {
      setSaveError('Something went wrong saving your changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={detailStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {showSavedPopup ? (
          <View style={detailStyles.savedPopup}>
            <Text style={detailStyles.savedPopupText}>Saved!</Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={detailStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={detailStyles.title}>Shoot Day</Text>

          {loading ? <Text style={detailStyles.message}>Loading...</Text> : null}

          {!loading && shootDay ? (
            <>
              <View style={detailStyles.card}>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Production: </Text>
                  {shootDay.production.name}
                </Text>

                {isEditing ? (
                  <>
                    {/* ----- Meeting point ----- */}
                    <Text style={detailStyles.fieldLabel}>Meeting point</Text>
                    <View style={detailStyles.pickerWrapper}>
                      <Picker
                        selectedValue={selectedLocationId}
                        onValueChange={(value) => {
                          setSelectedLocationId(value);
                          setLocationError('');
                        }}
                        style={detailStyles.picker}
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
                          style={detailStyles.input}
                          value={otherName}
                          onChangeText={(text) => {
                            setOtherName(text);
                            if (locationError) setLocationError('');
                          }}
                          placeholder="Name, e.g. Brittas Bay beach car park"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                        />
                        <TextInput
                          style={detailStyles.input}
                          value={otherAddress}
                          onChangeText={(text) => {
                            setOtherAddress(text);
                            if (locationError) setLocationError('');
                          }}
                          placeholder="Address, e.g. Brittas Bay, Co. Wicklow"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                        />
                        <TouchableOpacity
                          style={detailStyles.checkboxRow}
                          onPress={() => setSaveForNextTime((prev) => !prev)}
                        >
                          <View style={[detailStyles.checkbox, saveForNextTime && detailStyles.checkboxChecked]}>
                            {saveForNextTime ? <Text style={detailStyles.checkmark}>✓</Text> : null}
                          </View>
                          <Text style={detailStyles.checkboxLabel}>Save this location for next time</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={detailStyles.hintText}>
                        {locations.find((l) => l.id === selectedLocationId)?.address ?? ''}
                      </Text>
                    )}
                    <View style={{ minHeight: 18 }}>
                      {locationError ? <Text style={detailStyles.fieldError}>{locationError}</Text> : null}
                    </View>

                    {/* ----- Date + call time ----- */}
                    <Text style={detailStyles.fieldLabel}>Date</Text>
                    <TouchableOpacity style={detailStyles.input} onPress={() => setShowDatePicker(true)}>
                      <Text style={detailStyles.dateTimeText}>{formatToDDMMYYYY(editDateTime)}</Text>
                    </TouchableOpacity>

                    <Text style={detailStyles.fieldLabel}>Call time</Text>
                    <TouchableOpacity style={detailStyles.input} onPress={() => setShowTimePicker(true)}>
                      <Text style={detailStyles.dateTimeText}>{formatToHHMM(editDateTime)}</Text>
                    </TouchableOpacity>

                    {/* ----- Optional estimated wrap ----- */}
                    <Text style={detailStyles.fieldLabel}>Est. wrap time (optional)</Text>
                    {currentWrap ? (
                      <View style={detailStyles.row}>
                        <TouchableOpacity
                          style={[detailStyles.input, { flex: 1, marginBottom: 0 }]}
                          onPress={() => setShowWrapPicker(true)}
                        >
                          <Text style={detailStyles.dateTimeText}>
                            {formatToHHMM(currentWrap)}
                            {isNextDay(editDateTime, currentWrap) ? '  (next day)' : ''}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setWrapTime(null)}>
                          <Text style={detailStyles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => setShowWrapPicker(true)} style={{ marginBottom: 12 }}>
                        <Text style={detailStyles.addLinkText}>+ Add est. wrap time</Text>
                      </TouchableOpacity>
                    )}

                    {showDatePicker ? (
                      <DateTimePicker value={editDateTime} mode="date" display="default" themeVariant="dark" minimumDate={new Date()} onChange={handleDateChange} />
                    ) : null}
                    {showTimePicker ? (
                      <DateTimePicker value={editDateTime} mode="time" display="default" themeVariant="dark" onChange={handleTimeChange} />
                    ) : null}
                    {showWrapPicker ? (
                      <DateTimePicker
                        value={currentWrap ?? new Date(editDateTime.getTime() + 10 * 60 * 60 * 1000)}
                        mode="time"
                        display="default"
                        themeVariant="dark"
                        onChange={handleWrapChange}
                      />
                    ) : null}

                    {saveError ? <Text style={[detailStyles.fieldError, { marginTop: 8 }]}>{saveError}</Text> : null}

                    <TouchableOpacity
                      style={[detailStyles.button, saving && { opacity: 0.6 }]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      <Text style={detailStyles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={detailStyles.buttonGhost} onPress={cancelEdit}>
                      <Text style={detailStyles.buttonGhostText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* ----- View mode ----- */}
                    <Text style={[detailStyles.detailRow, { marginBottom: 2 }]}>
                      <Text style={detailStyles.fieldLabelInline}>Meeting point: </Text>
                      {shootDay.location}
                    </Text>
                    {shootDay.locationAddress ? (
                      <Text style={detailStyles.addressText}>{shootDay.locationAddress}</Text>
                    ) : null}

                    <Text style={detailStyles.detailRow}>
                      <Text style={detailStyles.fieldLabelInline}>Call: </Text>
                      {formatToDDMMYYYY(shootDay.date)} at {formatToHHMM(shootDay.date)}
                    </Text>
                    <Text style={detailStyles.detailRow}>
                      <Text style={detailStyles.fieldLabelInline}>Est. wrap: </Text>
                      {shootDay.estimatedWrapAt
                        ? `${formatToHHMM(shootDay.estimatedWrapAt)}${
                            isNextDay(shootDay.date, shootDay.estimatedWrapAt) ? ' (next day)' : ''
                          }`
                        : 'Not set'}
                    </Text>

                    {shootDay.isPast ? (
                      <Text style={detailStyles.pastNotice}>This shoot day has passed and can no longer be edited.</Text>
                    ) : (
                      <TouchableOpacity style={detailStyles.button} onPress={startEdit}>
                        <Text style={detailStyles.buttonText}>Edit Shoot Day</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

              <Text style={detailStyles.sectionHeading}>Call Requests</Text>

              {shootDay.callRequests.length === 0 ? (
                <Text style={detailStyles.message}>No call requests for this shoot day yet.</Text>
              ) : null}

              {shootDay.callRequests.map((cr) =>
                editingCallRequestId === cr.id ? (
                  <View key={cr.id} style={detailStyles.card}>
                    <Text style={detailStyles.fieldLabel}>Description</Text>
                    <TextInput
                      style={detailStyles.input}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />

                    <Text style={detailStyles.fieldLabel}>Quantity Needed</Text>
                    <TextInput
                      style={detailStyles.input}
                      value={editQuantity}
                      onChangeText={setEditQuantity}
                      keyboardType="numeric"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />

                    <TouchableOpacity style={detailStyles.button} onPress={onSaveCallRequest}>
                      <Text style={detailStyles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={detailStyles.buttonGhost} onPress={onCancelEditCallRequest}>
                      <Text style={detailStyles.buttonGhostText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View key={cr.id} style={detailStyles.card}>
                    <Text style={detailStyles.cardTitle}>{cr.description}</Text>
                    <Text style={detailStyles.cardDetail}>Needed: {cr.quantityNeeded}</Text>

                    <View style={detailStyles.linkRow}>
                      <TouchableOpacity onPress={() => onViewResponses(cr.id)}>
                        <Text style={detailStyles.linkText}>View Responses</Text>
                      </TouchableOpacity>
                      {!shootDay.isPast ? (
                        <TouchableOpacity onPress={() => onStartEditCallRequest(cr)}>
                          <Text style={detailStyles.linkText}>Edit</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                )
              )}
            </>
          ) : null}

          {!loading && !shootDay ? <Text style={detailStyles.message}>Shoot day not found.</Text> : null}

          {message ? <Text style={detailStyles.message}>{message}</Text> : null}

          <TouchableOpacity style={detailStyles.buttonGhost} onPress={onBack}>
            <Text style={detailStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const detailStyles = StyleSheet.create({
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
    marginBottom: 16,
  },
  detailRow: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  fieldLabelInline: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
    marginTop: 4,
  },
  pastNotice: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 8,
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
  dateTimeText: {
    color: '#fff',
    fontSize: 14,
  },
  fieldError: {
    color: '#ff9d9d',
    fontSize: 12,
    marginBottom: 6,
  },
  removeText: {
    color: '#ff9d9d',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  addLinkText: {
    color: '#d99c4a',
    fontSize: 14,
    fontWeight: '600',
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
  linkRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  linkText: {
    color: '#d99c4a',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
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

export default ShootDayDetailScreen;