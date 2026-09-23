import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { styles } from '../styles';
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Shoot Day</Text>

        {loading ? <Text style={styles.message}>Loading...</Text> : null}

        {!loading && shootDay ? (
          <>
            <View style={styles.card}>
              <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Production: </Text>{shootDay.productionName}</Text>
              <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Location: </Text>{shootDay.location}</Text>

              {isEditingDate ? (
                <>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <View style={{ minHeight: 18 }}>
                    {dateError ? <Text style={styles.fieldError}>{dateError}</Text> : null}
                  </View>
                  <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                    <Text>{editDateTime ? formatToDDMMYYYY(editDateTime) : ''}</Text>
                  </TouchableOpacity>

                  <Text style={styles.fieldLabel}>Time</Text>
                  <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
                    <Text>{editDateTime ? formatToHHMM(editDateTime) : ''}</Text>
                  </TouchableOpacity>

                  {showDatePicker && editDateTime ? (
                    <DateTimePicker value={editDateTime} mode="date" display="default" onChange={handleDateChange} />
                  ) : null}
                  {showTimePicker && editDateTime ? (
                    <DateTimePicker value={editDateTime} mode="time" display="default" onChange={handleTimeChange} />
                  ) : null}

                  <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onSaveDate}>
                    <Text style={styles.buttonText}>Save Date/Time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onCancelEditDate}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.detailRow}>
                    <Text style={styles.fieldLabel}>Date: </Text>
                    {formatToDDMMYYYY(shootDay.date)} at {formatToHHMM(shootDay.date)}
                  </Text>

                  {shootDay.isPast ? (
                    <Text style={styles.cardStatus}>This shoot day has passed and can no longer be edited.</Text>
                  ) : (
                    <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onStartEditDate}>
                      <Text style={styles.buttonText}>Edit Date/Time</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <Text style={styles.sectionHeading}>Call Requests</Text>

            {shootDay.callRequests.length === 0 ? (
              <Text style={styles.message}>No call requests for this shoot day yet.</Text>
            ) : null}

            {shootDay.callRequests.map((cr) =>
              editingCallRequestId === cr.id ? (
                <View key={cr.id} style={styles.card}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput style={styles.input} value={editDescription} onChangeText={setEditDescription} />

                  <Text style={styles.fieldLabel}>Quantity Needed</Text>
                  <TextInput
                    style={styles.input}
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity style={styles.button} onPress={onSaveCallRequest}>
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onCancelEditCallRequest}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View key={cr.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{cr.description}</Text>
                  <Text style={styles.cardDetail}>Needed: {cr.quantityNeeded}</Text>

                  <TouchableOpacity onPress={() => onViewResponses(cr.id)}>
                    <Text style={styles.editLinkText}>View Responses</Text>
                      </TouchableOpacity>
                        {!shootDay.isPast ? (
                      <TouchableOpacity onPress={() => onStartEditCallRequest(cr)}>
                    <Text style={styles.editLinkText}>Edit</Text>
                  </TouchableOpacity>
                  ) : null}
                </View>
              )
            )}
          </>
        ) : null}

        {!loading && !shootDay ? <Text style={styles.message}>Shoot day not found.</Text> : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ShootDayDetailScreen;