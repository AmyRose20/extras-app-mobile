import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { API_URL } from '../api';
import { Attendee, DialogConfig } from '../types';
import { formatToDDMMYYYY, formatToHHMM, computeWrap, isNextDay, formatToCalendarKey } from '../dateUtils';

// Attendance for a shoot day that has started: mark anyone who didn't turn up,
// and record finish times (they start as the estimated wrap time).

type Props = {
  token: string;
  shootDayId: string;
  productionName: string | null;
  onBack: () => void;
  showDialog: (config: DialogConfig) => void; // the app-wide "Are you sure?" dialog
};

type AttendanceData = {
  shootDay: { id: string; date: string; estimatedWrapAt: string | null };
  attendees: Attendee[];
};

const ALL = 'ALL'; // the time picker is open for "Set finish time for everyone"

function AttendanceScreen({ token, shootDayId, productionName, onBack, showDialog }: Props) {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null); // which row is saving
  const [pickerFor, setPickerFor] = useState<string | null>(null); // inviteId, ALL, or null (closed)
const [exporting, setExporting] = useState(false);

  // ----- Load the attendance list -----
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/shoot-days/${shootDayId}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || 'Could not load attendance.');
        return;
      }
      setData(result);
    } catch (error) {
      setMessage('Something went wrong loading attendance.');
    } finally {
      setLoading(false);
    }
  }, [token, shootDayId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ----- Update one extra (no-show and/or finish time) -----
  const updateAttendee = async (inviteId: string, body: { noShow?: boolean; finishedAt?: string }) => {
    setSavingId(inviteId);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/shoot-days/${shootDayId}/attendance/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const updated = await response.json();
      if (!response.ok) {
        setMessage(updated.error || 'Could not save that change.');
        return;
      }
      // Swap the updated row into the list
      setData((prev) =>
        prev ? { ...prev, attendees: prev.attendees.map((a) => (a.inviteId === inviteId ? updated : a)) } : prev
      );
    } catch (error) {
      setMessage('Something went wrong saving attendance.');
    } finally {
      setSavingId(null);
    }
  };

  // ----- Same finish time for everyone who turned up -----
  const setFinishTimeForAll = async (finishedAt: string) => {
    setSavingId(ALL);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/shoot-days/${shootDayId}/finish-time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ finishedAt }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || 'Could not set the finish time.');
        return;
      }
      await loadAttendance();
    } catch (error) {
      setMessage('Something went wrong setting the finish time.');
    } finally {
      setSavingId(null);
    }
  };

  // ----- Time picker -----
  const onPickTime = (event: DateTimePickerEvent, picked?: Date) => {
    const target = pickerFor;
    setPickerFor(null); // close it first (Android shows it as a pop-up)
    if (event.type !== 'set' || !picked || !data || !target) return;

    // Put the picked time on the shoot day; if it's before the call time, it means the next day
    const finish = computeWrap(new Date(data.shootDay.date), picked).toISOString();
    if (target === ALL) {
      setFinishTimeForAll(finish);
    } else {
      updateAttendee(target, { finishedAt: finish });
    }
  };

  // What time the picker opens on
  const pickerStartValue = (): Date => {
    if (!data) return new Date();
    const row = data.attendees.find((a) => a.inviteId === pickerFor);
    const start = row?.finishedAt ?? data.shootDay.estimatedWrapAt ?? data.shootDay.date;
    return new Date(start);
  };

  // "19:30", "01:00 (next day)", "19:00 (estimate)", or "Not recorded"
  const finishText = (a: Attendee): string => {
    if (!data || !a.finishedAt) return 'Not recorded';
    let text = formatToHHMM(a.finishedAt);
    if (isNextDay(data.shootDay.date, a.finishedAt)) text += ' (next day)';
    if (a.finishTimeIsEstimate) text += ' (estimate)';
    return text;
  };

  const worked = data ? data.attendees.filter((a) => !a.noShow).length : 0;
  const noShows = data ? data.attendees.length - worked : 0;
  
  // ----- Payroll export -----
  // Downloads the Excel file into the app's private cache, then opens Android's share menu.
  const exportPayroll = async () => {
    if (!data) return;
    setExporting(true);
    setMessage('');

    const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
    const slug = (productionName ?? 'payroll').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const fileName = `payroll_${slug}_${formatToCalendarKey(data.shootDay.date)}.xlsx`;
    const path = `${cacheDir}/${fileName}`;

    try {
      // Tidy up: delete any payroll files left from earlier exports (they contain bank details)
      const oldFiles = await ReactNativeBlobUtil.fs.ls(cacheDir);
      await Promise.all(
        oldFiles
          .filter((name) => name.startsWith('payroll_'))
          .map((name) => ReactNativeBlobUtil.fs.unlink(`${cacheDir}/${name}`).catch(() => {}))
      );

      // Download the file (with our login token) straight into the cache
      const response = await ReactNativeBlobUtil.config({ path }).fetch(
        'GET',
        `${API_URL}/shoot-days/${shootDayId}/payroll`,
        { Authorization: `Bearer ${token}` }
      );

      if (response.info().status !== 200) {
        // The backend sent an error message (JSON) instead of a spreadsheet
        let error = 'Could not export payroll.';
        try {
          const text = await ReactNativeBlobUtil.fs.readFile(path, 'utf8');
          error = JSON.parse(text).error || error;
        } catch (readError) {
          // keep the general message
        }
        await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
        setMessage(error);
        return;
      }

      // Open the share menu (email, WhatsApp, Drive, Files...)
      await Share.open({
        url: `file://${path}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: fileName,
        title: 'Share payroll',
        failOnCancel: false, // closing the share menu isn't an error
      });
    } catch (error) {
      setMessage('Something went wrong exporting payroll.');
    } finally {
      setExporting(false);
    }
  };

  const confirmExport = () => {
    showDialog({
      title: 'Export payroll?',
      message:
        'This file contains bank details. Only share it with people who need to pay extras.',
      confirmText: 'Export',
      onConfirm: exportPayroll,
    });
  };

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={attendanceStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={attendanceStyles.scrollContent}>
          <Text style={attendanceStyles.title}>Attendance</Text>

          {data ? (
            <>
              <Text style={attendanceStyles.subtitle}>
                {productionName ? `${productionName} · ` : ''}
                {formatToDDMMYYYY(data.shootDay.date)} · call {formatToHHMM(data.shootDay.date)}
              </Text>
              <Text style={attendanceStyles.hint}>
                Mark anyone who didn't turn up, and change the finish time for anyone who left early or stayed late.
              </Text>

              <View style={attendanceStyles.summaryCard}>
                <Text style={attendanceStyles.summaryText}>
                  {worked} worked · {noShows} no-show{noShows === 1 ? '' : 's'}
                </Text>
                <TouchableOpacity
                  style={[attendanceStyles.button, savingId === ALL && { opacity: 0.6 }]}
                  onPress={() => setPickerFor(ALL)}
                  disabled={savingId === ALL || worked === 0}
                >
                  <Text style={attendanceStyles.buttonText}>
                    {savingId === ALL ? 'Saving...' : 'Set finish time for everyone'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[attendanceStyles.buttonOutline, exporting && { opacity: 0.6 }]}
                  onPress={confirmExport}
                  disabled={exporting || worked === 0}
                >
                  <Text style={attendanceStyles.buttonOutlineText}>
                    {exporting ? 'Preparing file...' : 'Export payroll (Excel)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {data.attendees.length === 0 ? (
                <Text style={attendanceStyles.message}>Nobody accepted this shoot day.</Text>
              ) : null}

              {data.attendees.map((a) => (
                <View key={a.inviteId} style={[attendanceStyles.card, a.noShow && attendanceStyles.cardNoShow]}>
                  <View style={attendanceStyles.headerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={attendanceStyles.name}>{a.name}</Text>
                      <Text style={attendanceStyles.callRequest}>{a.callRequest}</Text>
                    </View>
                    <TouchableOpacity
                      style={[attendanceStyles.chip, a.noShow && attendanceStyles.chipSelected]}
                      onPress={() => updateAttendee(a.inviteId, { noShow: !a.noShow })}
                      disabled={savingId === a.inviteId}
                    >
                      <Text style={[attendanceStyles.chipText, a.noShow && attendanceStyles.chipTextSelected]}>
                        {a.noShow ? '✕ No-show' : 'No-show'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {a.noShow ? (
                    <Text style={attendanceStyles.noShowNote}>Didn't turn up · not included in payroll</Text>
                  ) : (
                    <TouchableOpacity
                      style={attendanceStyles.finishRow}
                      onPress={() => setPickerFor(a.inviteId)}
                      disabled={savingId === a.inviteId}
                    >
                      <Text style={attendanceStyles.finishLabel}>Finish time: </Text>
                      <Text style={[attendanceStyles.finishValue, !a.finishedAt && attendanceStyles.missing]}>
                        {savingId === a.inviteId ? 'Saving...' : finishText(a)}
                      </Text>
                      <Text style={attendanceStyles.linkText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          ) : null}

          {loading && !data ? <Text style={attendanceStyles.message}>Loading...</Text> : null}
          {message ? <Text style={attendanceStyles.errorText}>{message}</Text> : null}

          <TouchableOpacity style={attendanceStyles.buttonGhost} onPress={onBack}>
            <Text style={attendanceStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>

        {pickerFor ? (
          <DateTimePicker value={pickerStartValue()} mode="time" is24Hour display="default" onChange={onPickTime} />
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const attendanceStyles = StyleSheet.create({
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#ff9d9d',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 14,
    marginBottom: 10,
  },
  cardNoShow: {
    borderColor: 'rgba(255,157,157,0.5)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  callRequest: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: '#ff9d9d',
    borderColor: '#ff9d9d',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  chipTextSelected: {
    color: '#1a1330',
  },
  noShowNote: {
    fontSize: 13,
    color: '#ff9d9d',
  },
  finishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  finishLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
  },
  finishValue: {
    fontSize: 14,
    color: '#fff',
    marginRight: 10,
  },
  missing: {
    color: '#ff9d9d',
    fontWeight: '700',
  },
  linkText: {
    fontSize: 13,
    color: '#d99c4a',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonOutlineText: {
    color: '#d99c4a',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AttendanceScreen;