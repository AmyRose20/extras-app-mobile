import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { ShootDayDetail, CallRequestSummary } from '../types';
import { formatToDDMMYYYY, formatToHHMM } from '../dateUtils';

type Props = {
  shootDay: ShootDayDetail | null;
  loading: boolean;
  message: string;
  onBack: () => void;

  isEditingDate: boolean;
  onStartEditDate: () => void;
  onCancelEditDate: () => void;
  editDateTime: Date | null;
  onDateTimeChange: (newDate: Date) => void;
  onSaveDate: () => void;
  dateError: string;

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
  shootDay,
  loading,
  message,
  onBack,
  isEditingDate,
  onStartEditDate,
  onCancelEditDate,
  editDateTime,
  onDateTimeChange,
  onSaveDate,
  dateError,
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
  // Purely local — just whether the native date/time dialogs are open right
  // now. Nothing outside this screen needs to know about that.
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected && editDateTime) {
      const combined = new Date(editDateTime);
      combined.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      onDateTimeChange(combined);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selected && editDateTime) {
      const combined = new Date(editDateTime);
      combined.setHours(selected.getHours(), selected.getMinutes());
      onDateTimeChange(combined);
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
        <ScrollView contentContainerStyle={detailStyles.scrollContent}>
          <Text style={detailStyles.title}>Shoot Day</Text>

          {loading ? <Text style={detailStyles.message}>Loading...</Text> : null}

          {!loading && shootDay ? (
            <>
              <View style={detailStyles.card}>
                <Text style={detailStyles.detailRow}><Text style={detailStyles.fieldLabelInline}>Production: </Text>{shootDay.productionName}</Text>
                <Text style={detailStyles.detailRow}><Text style={detailStyles.fieldLabelInline}>Location: </Text>{shootDay.location}</Text>

                {isEditingDate ? (
                  <>
                    <Text style={detailStyles.fieldLabel}>Date</Text>
                    <View style={{ minHeight: 18 }}>
                      {dateError ? <Text style={detailStyles.fieldError}>{dateError}</Text> : null}
                    </View>
                    <TouchableOpacity style={detailStyles.input} onPress={() => setShowDatePicker(true)}>
                      <Text style={detailStyles.dateTimeText}>{editDateTime ? formatToDDMMYYYY(editDateTime) : ''}</Text>
                    </TouchableOpacity>

                    <Text style={detailStyles.fieldLabel}>Time</Text>
                    <TouchableOpacity style={detailStyles.input} onPress={() => setShowTimePicker(true)}>
                      <Text style={detailStyles.dateTimeText}>{editDateTime ? formatToHHMM(editDateTime) : ''}</Text>
                    </TouchableOpacity>

                    {showDatePicker && editDateTime ? (
                      <DateTimePicker value={editDateTime} mode="date" display="default" themeVariant="dark" onChange={handleDateChange} />
                    ) : null}
                    {showTimePicker && editDateTime ? (
                      <DateTimePicker value={editDateTime} mode="time" display="default" themeVariant="dark" onChange={handleTimeChange} />
                    ) : null}

                    <TouchableOpacity style={detailStyles.button} onPress={onSaveDate}>
                      <Text style={detailStyles.buttonText}>Save Date/Time</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={detailStyles.buttonGhost} onPress={onCancelEditDate}>
                      <Text style={detailStyles.buttonGhostText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={detailStyles.detailRow}>
                      <Text style={detailStyles.fieldLabelInline}>Date: </Text>
                      {formatToDDMMYYYY(shootDay.date)} at {formatToHHMM(shootDay.date)}
                    </Text>

                    {shootDay.isPast ? (
                      <Text style={detailStyles.pastNotice}>This shoot day has passed and can no longer be edited.</Text>
                    ) : (
                      <TouchableOpacity style={detailStyles.button} onPress={onStartEditDate}>
                        <Text style={detailStyles.buttonText}>Edit Date/Time</Text>
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
  dateTimeText: {
    color: '#fff',
    fontSize: 14,
  },
  fieldError: {
    color: '#ff9d9d',
    fontSize: 12,
    marginBottom: 6,
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
});

export default ShootDayDetailScreen;