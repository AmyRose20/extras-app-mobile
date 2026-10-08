import React, { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import * as shootDaysApi from '../api/shootDaysApi';
import { getAuthToken, errorMessage } from '../api/client';
import { Attendee, DialogConfig } from '../types';
import { formatToDDMMYYYY, formatToHHMM, computeWrap, isNextDay, formatToCalendarKey } from '../dateUtils';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import GhostButton from '../components/GhostButton';
import { colors, text } from '../theme';

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
      setData(await shootDaysApi.getAttendance(shootDayId));
    } catch (error) {
      setMessage(errorMessage(error, 'Could not load attendance.'));
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
      const updated = await shootDaysApi.updateAttendee(shootDayId, inviteId, body);
      // Swap the updated row into the list
      setData((prev) =>
        prev ? { ...prev, attendees: prev.attendees.map((a) => (a.inviteId === inviteId ? updated : a)) } : prev
      );
    } catch (error) {
      setMessage(errorMessage(error, 'Could not save that change.'));
    } finally {
      setSavingId(null);
    }
  };

  // ----- Same finish time for everyone who turned up -----
  const setFinishTimeForAll = async (finishedAt: string) => {
    setSavingId(ALL);
    setMessage('');
    try {
      await shootDaysApi.setFinishTimeForAll(shootDayId, finishedAt);
      await loadAttendance();
    } catch (error) {
      setMessage(errorMessage(error, 'Could not set the finish time.'));
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
    let label = formatToHHMM(a.finishedAt);
    if (isNextDay(data.shootDay.date, a.finishedAt)) label += ' (next day)';
    if (a.finishTimeIsEstimate) label += ' (estimate)';
    return label;
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
        shootDaysApi.payrollUrl(shootDayId),
        { Authorization: `Bearer ${getAuthToken()}` }
      );

      if (response.info().status !== 200) {
        // The backend sent an error message (JSON) instead of a spreadsheet
        let error = 'Could not export payroll.';
        try {
          const body = await ReactNativeBlobUtil.fs.readFile(path, 'utf8');
          error = JSON.parse(body).error || error;
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
    <ScreenBackground>
      <Text style={[text.title, attendanceStyles.title]}>Attendance</Text>

      {data ? (
        <>
          <Text style={attendanceStyles.subtitle}>
            {productionName ? `${productionName} · ` : ''}
            {formatToDDMMYYYY(data.shootDay.date)} · call {formatToHHMM(data.shootDay.date)}
          </Text>
          <Text style={attendanceStyles.hint}>
            Mark anyone who didn't turn up, and change the finish time for anyone who left early or stayed late.
          </Text>

          <GlassCard style={attendanceStyles.summaryCard}>
            <Text style={attendanceStyles.summaryText}>
              {worked} worked · {noShows} no-show{noShows === 1 ? '' : 's'}
            </Text>
            <GoldButton
              title="Set finish time for everyone"
              loadingTitle="Saving..."
              loading={savingId === ALL}
              disabled={worked === 0}
              onPress={() => setPickerFor(ALL)}
              style={attendanceStyles.cardButton}
            />
            <TouchableOpacity
              style={[attendanceStyles.buttonOutline, exporting && { opacity: 0.6 }]}
              onPress={confirmExport}
              disabled={exporting || worked === 0}
            >
              <Text style={attendanceStyles.buttonOutlineText}>
                {exporting ? 'Preparing file...' : 'Export payroll (Excel)'}
              </Text>
            </TouchableOpacity>
          </GlassCard>

          {data.attendees.length === 0 ? <Text style={text.message}>Nobody accepted this shoot day.</Text> : null}

          {data.attendees.map((a) => (
            <GlassCard key={a.inviteId} style={[attendanceStyles.card, a.noShow && attendanceStyles.cardNoShow]}>
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
            </GlassCard>
          ))}
        </>
      ) : null}

      {loading && !data ? <Text style={text.message}>Loading...</Text> : null}
      {message ? <Text style={attendanceStyles.errorText}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />

      {/* The time picker opens as a pop-up on Android */}
      {pickerFor ? (
        <DateTimePicker value={pickerStartValue()} mode="time" is24Hour display="default" onChange={onPickTime} />
      ) : null}
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const attendanceStyles = StyleSheet.create({
  title: {
    marginBottom: 4, // the subtitle sits close underneath
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginBottom: 12,
  },
  summaryCard: {
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  cardButton: {
    paddingVertical: 12,
    marginBottom: 0,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonOutlineText: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
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
    color: colors.text,
  },
  callRequest: {
    fontSize: 12,
    color: colors.textMuted,
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
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.onGold,
  },
  noShowNote: {
    fontSize: 13,
    color: colors.error,
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
    color: colors.textMuted,
  },
  finishValue: {
    fontSize: 14,
    color: colors.text,
    marginRight: 10,
  },
  missing: {
    color: colors.error,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 13,
    color: colors.gold,
    textDecorationLine: 'underline',
  },
});

export default AttendanceScreen;