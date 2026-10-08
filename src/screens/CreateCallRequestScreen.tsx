import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as shootDaysApi from '../api/shootDaysApi';
import * as callRequestsApi from '../api/callRequestsApi';
import { errorMessage } from '../api/client';
import { ShootDaySummary } from '../types';
import { SKILL_GROUPS } from '../constants';
import { formatToDDMMYYYY, formatToHHMM } from '../dateUtils';
import GroupedMultiSelect from '../components/GroupedMultiSelect';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import GhostButton from '../components/GhostButton';
import TextField from '../components/TextField';
import { colors, text } from '../theme';

type Props = {
  token: string;
  onBack: () => void;
  onCreated: (callRequestId: string) => void;
  initialShootDayId?: string; // pre-select this shoot day (when opened from a shoot day)
};

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

function CreateCallRequestScreen({ token, onBack, onCreated, initialShootDayId }: Props) {
  // ----- Upcoming shoot days for the dropdown -----
  const [shootDays, setShootDays] = useState<ShootDaySummary[]>([]);
  const [shootDaysLoading, setShootDaysLoading] = useState(true);
  const [shootDayId, setShootDayId] = useState('');

  useEffect(() => {
    const loadShootDays = async () => {
      try {
        const data = await shootDaysApi.getShootDays();
        // Only upcoming shoot days, soonest first
        const upcoming = data
          .filter((d) => !d.isPast)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setShootDays(upcoming);
        // Start on the shoot day we were opened from, if there is one; otherwise the soonest
        const initial = upcoming.find((d) => d.id === initialShootDayId);
        if (initial) {
          setShootDayId(initial.id);
        } else if (upcoming.length > 0) {
          setShootDayId(upcoming[0].id);
        }
      } catch (error) {
        // handled by the "no shoot days" message below
      } finally {
        setShootDaysLoading(false);
      }
    };
    loadShootDays();
  }, [token]);

  // ----- The call -----
  const [description, setDescription] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');

  // ----- Who we're looking for -----
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [otherSkills, setOtherSkills] = useState('');

  // ----- Errors / messages -----
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  // Checks the form. Returns true if everything's OK; otherwise shows errors.
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const qty = parseInt(quantityNeeded, 10);
    const min = minAge ? parseInt(minAge, 10) : null;
    const max = maxAge ? parseInt(maxAge, 10) : null;

    if (!shootDayId) newErrors.shootDay = 'Choose a shoot day.';
    if (!description.trim()) newErrors.description = 'Add a short description.';
    if (!quantityNeeded || isNaN(qty) || qty < 1) newErrors.quantity = 'Enter how many extras you need (1 or more).';
    if (min !== null && (isNaN(min) || min < 0)) newErrors.age = 'Min age must be a number.';
    if (max !== null && (isNaN(max) || max < 0)) newErrors.age = 'Max age must be a number.';
    if (min !== null && max !== null && min > max) newErrors.age = 'Min age can’t be higher than max age.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    setMessage('');
    setWarning('');
    if (!validate()) return;

    // Build the criteria, leaving out anything not chosen
    const criteria: Record<string, unknown> = {};
    if (minAge) criteria.minAge = parseInt(minAge, 10);
    if (maxAge) criteria.maxAge = parseInt(maxAge, 10);
    if (gender) criteria.gender = gender;
    const allSkills = [
      ...skills,
      ...otherSkills.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
    ];
    if (allSkills.length > 0) criteria.skills = allSkills;

    setSubmitting(true);
    try {
      const data = await callRequestsApi.createCallRequest({
        shootDayId,
        description: description.trim(),
        quantityNeeded: parseInt(quantityNeeded, 10),
        criteria,
      });

      if (data.matchedCount === 0) {
        // The call request was still created, just with nobody invited
        setWarning(data.warning || 'Created, but no extras matched. Try widening the age range, gender or skills.');
        return;
      }

      onCreated(data.callRequest.id);
    } catch (error) {
      setMessage(errorMessage(error, 'Could not create the call request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const shootDayLabel = (d: ShootDaySummary) =>
    `${formatToDDMMYYYY(d.date)} ${formatToHHMM(d.date)} · ${d.location}`;

  return (
    <ScreenBackground>
      <Text style={text.title}>Create Call Request</Text>

      {/* ----- Shoot day + the call ----- */}
      <GlassCard>
        <Text style={createCallStyles.cardTitle}>The Call</Text>

        <Text style={text.label}>Shoot day</Text>
        {shootDaysLoading ? (
          <Text style={createCallStyles.hintText}>Loading shoot days...</Text>
        ) : shootDays.length === 0 ? (
          <Text style={createCallStyles.hintText}>
            No upcoming shoot days. Add a shoot day first, then create a call request for it.
          </Text>
        ) : (
          <View style={createCallStyles.pickerWrapper}>
            <Picker
              selectedValue={shootDayId}
              onValueChange={(value) => {
                setShootDayId(value);
                setErrors((prev) => ({ ...prev, shootDay: '' }));
              }}
              style={createCallStyles.picker}
              dropdownIconColor={colors.text}
            >
              {shootDays.map((d) => (
                <Picker.Item key={d.id} label={shootDayLabel(d)} value={d.id} color={colors.onGold} />
              ))}
            </Picker>
          </View>
        )}
        <Text style={createCallStyles.fieldError}>{errors.shootDay || ''}</Text>

        <Text style={text.label}>Description</Text>
        <TextField
          style={createCallStyles.compactInput}
          placeholder="e.g. 20 men, fight scene"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
          }}
        />
        <Text style={createCallStyles.fieldError}>{errors.description || ''}</Text>

        <Text style={text.label}>Quantity needed</Text>
        <TextField
          style={createCallStyles.compactInput}
          placeholder="e.g. 20"
          value={quantityNeeded}
          onChangeText={(value) => {
            setQuantityNeeded(value);
            if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
          }}
          keyboardType="numeric"
        />
        <Text style={createCallStyles.fieldError}>{errors.quantity || ''}</Text>
      </GlassCard>

      {/* ----- Who we're looking for ----- */}
      <GlassCard>
        <Text style={createCallStyles.cardTitle}>Who You're Looking For</Text>

        <Text style={text.label}>Age range (optional)</Text>
        <View style={createCallStyles.row}>
          <TextField
            style={[createCallStyles.compactInput, { flex: 1 }]}
            placeholder="Min"
            value={minAge}
            onChangeText={(value) => {
              setMinAge(value);
              if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
            }}
            keyboardType="numeric"
          />
          <Text style={createCallStyles.rangeDash}>–</Text>
          <TextField
            style={[createCallStyles.compactInput, { flex: 1 }]}
            placeholder="Max"
            value={maxAge}
            onChangeText={(value) => {
              setMaxAge(value);
              if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
            }}
            keyboardType="numeric"
          />
        </View>
        <Text style={createCallStyles.fieldError}>{errors.age || ''}</Text>

        <Text style={text.label}>Gender (optional)</Text>
        <View style={createCallStyles.chipsRow}>
          {GENDER_OPTIONS.map((option) => {
            const selected = gender === option.value;
            return (
              <TouchableOpacity
                key={option.label}
                style={[createCallStyles.chip, selected && createCallStyles.chipSelected]}
                onPress={() => setGender((prev) => (prev === option.value ? '' : option.value))}
              >
                <Text style={[createCallStyles.chipText, selected && createCallStyles.chipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[createCallStyles.hintText, { marginTop: -6, marginBottom: 12 }]}>
          Leave unselected to include everyone.
        </Text>

        <GroupedMultiSelect
          label="Skills (optional)"
          groups={SKILL_GROUPS}
          selected={skills}
          onToggle={toggleSkill}
          otherText={otherSkills}
          onOtherTextChange={setOtherSkills}
        />
        <Text style={createCallStyles.hintText}>
          Extras with any of the selected skills will be invited. Leave empty to include everyone.
        </Text>
      </GlassCard>

      {warning ? <Text style={createCallStyles.warningText}>{warning}</Text> : null}
      {message ? <Text style={createCallStyles.errorMessage}>{message}</Text> : null}

      <GoldButton
        title="Create Call Request"
        loadingTitle="Creating..."
        loading={submitting}
        disabled={shootDays.length === 0}
        onPress={handleCreate}
        style={createCallStyles.createButton}
      />

      <GhostButton title="Back" onPress={onBack} style={createCallStyles.backButton} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const createCallStyles = StyleSheet.create({
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  // Slightly smaller than the normal TextField
  compactInput: {
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 0,
  },
  pickerWrapper: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeDash: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginHorizontal: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  chipText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.onGold,
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    minHeight: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  createButton: {
    marginTop: 4,
  },
  backButton: {
    marginTop: 0,
  },
});

export default CreateCallRequestScreen;