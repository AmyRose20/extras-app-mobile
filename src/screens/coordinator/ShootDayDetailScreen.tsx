import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as locationsApi from '../../api/locationsApi';
import * as shootDaysApi from '../../api/shootDaysApi';
import * as callRequestsApi from '../../api/callRequestsApi';
import { errorMessage } from '../../api/client';
import { ShootDayDetail, ShootDaySummary, CallRequestSummary, Location } from '../../types';
import { formatToDDMMYYYY, formatToHHMM, computeWrap, isNextDay } from '../../dateUtils';
import MapPinPicker, { Pin } from '../../components/MapPinPicker';
import ScreenBackground from '../../components/ScreenBackground';
import GlassCard from '../../components/GlassCard';
import GoldButton from '../../components/GoldButton';
import GhostButton from '../../components/GhostButton';
import TextField from '../../components/TextField';
import DetailRow from '../../components/DetailRow';
import SavedPopup from '../../components/SavedPopup';
import { colors, text } from '../../theme';

const OTHER = 'OTHER'; // dropdown value for "Other (enter address)"

type Props = {
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
  onAddCallRequest: () => void; // opens Create Call Request with this shoot day selected
  onOpenAttendance: () => void; // past shoot days: no-shows, finish times, payroll
};

function ShootDayDetailScreen({
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
  onAddCallRequest,
  onOpenAttendance,
}: Props) {
  // ----- Saved meeting points for the dropdown -----
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocations(await locationsApi.getLocations());
      } catch (error) {
        // If this fails, the dropdown just offers "Other"
      }
    };
    loadLocations();
  }, []);

  // ----- Edit mode state (only used while editing) -----
  const [isEditing, setIsEditing] = useState(false);
  const [editDateTime, setEditDateTime] = useState<Date>(new Date());
  const [wrapTime, setWrapTime] = useState<Date | null>(null); // only the time of day matters
  const [selectedLocationId, setSelectedLocationId] = useState<string>(OTHER);
  const [otherName, setOtherName] = useState('');
  const [otherAddress, setOtherAddress] = useState('');
  const [otherPin, setOtherPin] = useState<Pin | null>(null); // map pin for "Other"
  const [otherNameEdited, setOtherNameEdited] = useState(false); // true once the coordinator types a name
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
      setOtherPin(null);
      setOtherNameEdited(false);
    } else {
      setSelectedLocationId(OTHER);
      setOtherName(shootDay.location);
      setOtherAddress(shootDay.locationAddress ?? '');
      // Open the map on the existing pin, if this shoot day has one
      setOtherPin(
        shootDay.latitude != null && shootDay.longitude != null
          ? { latitude: shootDay.latitude, longitude: shootDay.longitude }
          : null
      );
      setOtherNameEdited(true); // keep the existing name if the pin is moved
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
      setLocationError(
        selectedLocationId === OTHER && !otherPin && !otherAddress
          ? 'Search for the meeting point, or tap the map to drop a pin.'
          : 'Give the meeting point a name.'
      );
      return;
    }
    setLocationError('');
    setSaveError('');
    setSaving(true);

    try {
      // Optionally save an "Other" location for next time (not critical if it fails)
      if (selectedLocationId === OTHER && saveForNextTime) {
        try {
          const saved = await locationsApi.saveLocation({
            name: meetingPoint.name,
            address: meetingPoint.address,
            latitude: meetingPoint.latitude,
            longitude: meetingPoint.longitude,
          });
          setLocations((prev) =>
            prev.some((l) => l.id === saved.id)
              ? prev
              : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
          );
        } catch (error) {
          // ignore — the shoot day still keeps its own copy of the address
        }
      }

      // Send everything; the backend works out what actually changed
      // (and only notifies extras about real changes)
      await shootDaysApi.updateShootDay(shootDay.id, {
        date: editDateTime.toISOString(),
        estimatedWrapAt: currentWrap ? currentWrap.toISOString() : null,
        location: meetingPoint.name,
        locationAddress: meetingPoint.address,
        latitude: meetingPoint.latitude,
        longitude: meetingPoint.longitude,
      });

      setIsEditing(false);
      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 3000);
      onSaved(); // App reloads the shoot day so view mode shows the new details
    } catch (error) {
      // e.g. "Wednesday season 3 already has a shoot day on 22-10-2026"
      setSaveError(errorMessage(error, 'Something went wrong saving your changes.'));
    } finally {
      setSaving(false);
    }
  };

  
  // ----- Copy a call request to other shoot days -----
  const [copyingId, setCopyingId] = useState<string | null>(null); // which call request's panel is open
  const [copyTargets, setCopyTargets] = useState<ShootDaySummary[]>([]); // other upcoming shoot days
  const [copySelected, setCopySelected] = useState<string[]>([]); // ticked shoot day ids
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [copyNotice, setCopyNotice] = useState('');

  const openCopy = async (callRequestId: string) => {
    setCopyingId(callRequestId);
    setCopySelected([]);
    setCopyError('');
    setCopyTargets([]);
    setCopyLoading(true);
    try {
      const all = await shootDaysApi.getShootDays();
      // Other upcoming shoot days, soonest first
      setCopyTargets(
        all
          .filter((d) => !d.isPast && d.id !== shootDay?.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    } catch (error) {
      setCopyError(errorMessage(error, 'Could not load shoot days.'));
    } finally {
      setCopyLoading(false);
    }
  };

  const closeCopy = () => {
    setCopyingId(null);
    setCopySelected([]);
    setCopyError('');
  };

  const toggleCopyTarget = (id: string) => {
    setCopySelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setCopyError('');
  };

  const submitCopy = async () => {
    if (!copyingId || copySelected.length === 0) return;
    setCopyLoading(true);
    setCopyError('');
    try {
      const data = await callRequestsApi.copyCallRequest(copyingId, copySelected);

      const days = data.copied.length;
      const invited = data.copied.reduce((sum: number, c: { matchedCount: number }) => sum + c.matchedCount, 0);
      setCopyNotice(
        `Copied to ${days} shoot ${days === 1 ? 'day' : 'days'} · ${invited} ${invited === 1 ? 'extra' : 'extras'} invited.`
      );
      setTimeout(() => setCopyNotice(''), 4000);
      closeCopy();
    } catch (error) {
      setCopyError(errorMessage(error, 'Something went wrong copying that call request.'));
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <View style={detailStyles.fill}>
      <ScreenBackground>
        <Text style={text.title}>Shoot Day</Text>

        {loading ? <Text style={text.message}>Loading...</Text> : null}

        {!loading && shootDay ? (
          <>
            <GlassCard>
              <DetailRow label="Production">{shootDay.production.name}</DetailRow>

              {isEditing ? (
                <>
                  {/* ----- Meeting point ----- */}
                  <Text style={[text.label, detailStyles.formLabel]}>Meeting point</Text>
                  <View style={detailStyles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedLocationId}
                      onValueChange={(value) => {
                        setSelectedLocationId(value);
                        setLocationError('');
                      }}
                      style={detailStyles.picker}
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
                        pin={otherPin}
                        onPinChange={(p) => {
                          setOtherPin(p);
                          if (locationError) setLocationError('');
                        }}
                        onAddressFound={(address) => {
                          setOtherAddress(address);
                          if (!otherNameEdited) setOtherName(address.split(',')[0].trim());
                        }}
                        onNameFound={(name) => {
                          if (!otherNameEdited) setOtherName(name);
                        }}
                      />

                      {/* Shown once there's a pin, or if this shoot day already has an address */}
                      {otherPin || otherAddress ? (
                        <>
                          <Text style={detailStyles.pinAddress}>📍 {otherAddress}</Text>

                          <Text style={[text.label, detailStyles.formLabel]}>Name for extras</Text>
                          <TextField
                            style={detailStyles.compactInput}
                            value={otherName}
                            onChangeText={(value) => {
                              setOtherName(value);
                              setOtherNameEdited(true);
                              if (locationError) setLocationError('');
                            }}
                            placeholder="e.g. Beach car park"
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
                      ) : null}
                    </>
                  ) : (
                    <Text style={detailStyles.hintText}>
                      {locations.find((l) => l.id === selectedLocationId)?.address ?? ''}
                    </Text>
                  )}
                  <View style={detailStyles.errorSpace}>
                    {locationError ? <Text style={detailStyles.fieldError}>{locationError}</Text> : null}
                  </View>

                  {/* ----- Date + call time ----- */}
                  <Text style={[text.label, detailStyles.formLabel]}>Date</Text>
                  <TouchableOpacity style={detailStyles.fieldBox} onPress={() => setShowDatePicker(true)}>
                    <Text style={detailStyles.dateTimeText}>{formatToDDMMYYYY(editDateTime)}</Text>
                  </TouchableOpacity>

                  <Text style={[text.label, detailStyles.formLabel]}>Call time</Text>
                  <TouchableOpacity style={detailStyles.fieldBox} onPress={() => setShowTimePicker(true)}>
                    <Text style={detailStyles.dateTimeText}>{formatToHHMM(editDateTime)}</Text>
                  </TouchableOpacity>

                  {/* ----- Optional estimated wrap ----- */}
                  <Text style={[text.label, detailStyles.formLabel]}>Est. wrap time (optional)</Text>
                  {currentWrap ? (
                    <View style={detailStyles.row}>
                      <TouchableOpacity
                        style={[detailStyles.fieldBox, { flex: 1, marginBottom: 0 }]}
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
                    <DateTimePicker
                      value={editDateTime}
                      mode="date"
                      display="default"
                      themeVariant="dark"
                      minimumDate={new Date()}
                      onChange={handleDateChange}
                    />
                  ) : null}
                  {showTimePicker ? (
                    <DateTimePicker
                      value={editDateTime}
                      mode="time"
                      display="default"
                      themeVariant="dark"
                      onChange={handleTimeChange}
                    />
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

                  <GoldButton
                    title="Save Changes"
                    loadingTitle="Saving..."
                    loading={saving}
                    onPress={handleSave}
                    style={detailStyles.cardGoldButton}
                  />
                  <GhostButton title="Cancel" onPress={cancelEdit} style={detailStyles.cardGhostButton} />
                </>
              ) : (
                <>
                  {/* ----- View mode ----- */}
                  <DetailRow label="Meeting point" style={{ marginBottom: 2 }}>
                    {shootDay.location}
                  </DetailRow>
                  {shootDay.locationAddress ? (
                    <Text style={detailStyles.addressText}>{shootDay.locationAddress}</Text>
                  ) : null}

                  <DetailRow label="Call">
                    {formatToDDMMYYYY(shootDay.date)} at {formatToHHMM(shootDay.date)}
                  </DetailRow>
                  <DetailRow label="Est. wrap">
                    {shootDay.estimatedWrapAt
                      ? `${formatToHHMM(shootDay.estimatedWrapAt)}${
                          isNextDay(shootDay.date, shootDay.estimatedWrapAt) ? ' (next day)' : ''
                        }`
                      : 'Not set'}
                  </DetailRow>

                  {shootDay.isPast ? (
                    <>
                      <Text style={detailStyles.pastNotice}>This shoot day has passed and can no longer be edited.</Text>
                      <GoldButton
                        title="Attendance"
                        onPress={onOpenAttendance}
                        style={[detailStyles.cardGoldButton, { marginTop: 12 }]}
                      />
                    </>
                  ) : (
                    <GoldButton title="Edit Shoot Day" onPress={startEdit} style={detailStyles.cardGoldButton} />
                  )}
                </>
              )}
            </GlassCard>

            <View style={detailStyles.sectionHeaderRow}>
              <Text style={[text.sectionHeading, { marginBottom: 0 }]}>Call Requests</Text>
              {!shootDay.isPast ? (
                <TouchableOpacity onPress={onAddCallRequest}>
                  <Text style={detailStyles.addLinkText}>+ Add Call Request</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {copyNotice ? <Text style={detailStyles.noticeText}>{copyNotice}</Text> : null}

            {shootDay.callRequests.length === 0 ? (
              <Text style={text.message}>No call requests for this shoot day yet.</Text>
            ) : null}

            {shootDay.callRequests.map((cr) =>
              editingCallRequestId === cr.id ? (
                <GlassCard key={cr.id}>
                  <Text style={[text.label, detailStyles.formLabel]}>Description</Text>
                  <TextField style={detailStyles.compactInput} value={editDescription} onChangeText={setEditDescription} />

                  <Text style={[text.label, detailStyles.formLabel]}>Quantity Needed</Text>
                  <TextField
                    style={detailStyles.compactInput}
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    keyboardType="numeric"
                  />

                  <GoldButton title="Save" onPress={onSaveCallRequest} style={detailStyles.cardGoldButton} />
                  <GhostButton title="Cancel" onPress={onCancelEditCallRequest} style={detailStyles.cardGhostButton} />
                </GlassCard>
              ) : (
                <GlassCard key={cr.id}>
                  <Text style={detailStyles.cardTitle}>{cr.description}</Text>
                  <Text style={detailStyles.cardDetail}>Needed: {cr.quantityNeeded}</Text>

                  <View style={detailStyles.linkRow}>
                    <TouchableOpacity onPress={() => onViewResponses(cr.id)}>
                      <Text style={text.link}>View Responses</Text>
                    </TouchableOpacity>
                    {!shootDay.isPast ? (
                      <TouchableOpacity onPress={() => onStartEditCallRequest(cr)}>
                        <Text style={text.link}>Edit</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={() => (copyingId === cr.id ? closeCopy() : openCopy(cr.id))}>
                      <Text style={text.link}>Copy</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ----- Copy panel (only for the call request being copied) ----- */}
                  {copyingId === cr.id ? (
                    <View style={detailStyles.copyPanel}>
                      <Text style={[text.label, detailStyles.formLabel]}>Copy to other shoot days</Text>

                      {copyLoading && copyTargets.length === 0 ? (
                        <Text style={detailStyles.hintText}>Loading shoot days...</Text>
                      ) : copyTargets.length === 0 ? (
                        <Text style={detailStyles.hintText}>No other upcoming shoot days to copy to.</Text>
                      ) : (
                        copyTargets.map((d) => {
                          const ticked = copySelected.includes(d.id);
                          return (
                            <TouchableOpacity
                              key={d.id}
                              style={detailStyles.checkboxRow}
                              onPress={() => toggleCopyTarget(d.id)}
                            >
                              <View style={[detailStyles.checkbox, ticked && detailStyles.checkboxChecked]}>
                                {ticked ? <Text style={detailStyles.checkmark}>✓</Text> : null}
                              </View>
                              <Text style={detailStyles.checkboxLabel}>
                                {formatToDDMMYYYY(d.date)} {formatToHHMM(d.date)} · {d.location}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}

                      {copyError ? <Text style={detailStyles.fieldError}>{copyError}</Text> : null}

                      <View style={detailStyles.copyButtonRow}>
                        <TouchableOpacity
                          style={[
                            detailStyles.copyButton,
                            (copySelected.length === 0 || copyLoading) && { opacity: 0.5 },
                          ]}
                          onPress={submitCopy}
                          disabled={copySelected.length === 0 || copyLoading}
                        >
                          <Text style={detailStyles.copyButtonText}>
                            {copyLoading && copySelected.length > 0 ? 'Copying...' : `Copy (${copySelected.length})`}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={closeCopy}>
                          <Text style={detailStyles.removeText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </GlassCard>
              )
            )}
          </>
        ) : null}

        {!loading && !shootDay ? <Text style={text.message}>Shoot day not found.</Text> : null}

        {message ? <Text style={text.message}>{message}</Text> : null}

        <GhostButton title="Back" onPress={onBack} style={detailStyles.cardGhostButton} />
      </ScreenBackground>

      {/* "Saved!" pop-up, floating above the screen */}
      <SavedPopup visible={showSavedPopup} />
    </View>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const detailStyles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  formLabel: {
    marginTop: 4,
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
  addressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  pastNotice: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  errorSpace: {
    minHeight: 18, // keeps the space so the form doesn't jump when an error appears
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 6,
  },
  removeText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  addLinkText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
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
  cardGoldButton: {
    paddingVertical: 14,
    marginTop: 6,
  },
  cardGhostButton: {
    marginTop: 0,
    marginBottom: 10,
  },
  noticeText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  copyPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  copyButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  copyButton: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  copyButtonText: {
    color: colors.onGold,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ShootDayDetailScreen;