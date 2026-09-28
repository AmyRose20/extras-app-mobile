import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';
import { ShootDaySummary } from '../types';
import { SKILL_OPTIONS } from '../constants';
import { formatToDDMMYYYY, formatToHHMM } from '../dateUtils';
import ChipMultiSelect from '../components/ChipMultiSelect';

type Props = {
  token: string;
  onBack: () => void;
  onCreated: (callRequestId: string) => void;
};

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

function CreateCallRequestScreen({ token, onBack, onCreated }: Props) {
  // ----- Upcoming shoot days for the dropdown -----
  const [shootDays, setShootDays] = useState<ShootDaySummary[]>([]);
  const [shootDaysLoading, setShootDaysLoading] = useState(true);
  const [shootDayId, setShootDayId] = useState('');

  useEffect(() => {
    const loadShootDays = async () => {
      try {
        const response = await fetch(`${API_URL}/shoot-days`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data: ShootDaySummary[] = await response.json();
        // Only upcoming shoot days, soonest first
        const upcoming = data
          .filter((d) => !d.isPast)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setShootDays(upcoming);
        if (upcoming.length > 0) setShootDayId(upcoming[0].id);
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
      const response = await fetch(`${API_URL}/call-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shootDayId,
          description: description.trim(),
          quantityNeeded: parseInt(quantityNeeded, 10),
          criteria,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Could not create the call request.');
        return;
      }

      if (data.matchedCount === 0) {
        // The call request was still created, just with nobody invited
        setWarning(data.warning || 'Created, but no extras matched. Try widening the age range, gender or skills.');
        return;
      }

      onCreated(data.callRequest.id);
    } catch (error) {
      setMessage('Something went wrong — is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  const shootDayLabel = (d: ShootDaySummary) =>
    `${formatToDDMMYYYY(d.date)} ${formatToHHMM(d.date)} · ${d.location}`;

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={createCallStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={createCallStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={createCallStyles.title}>Create Call Request</Text>

          {/* ----- Shoot day + the call ----- */}
          <View style={createCallStyles.card}>
            <Text style={createCallStyles.cardTitle}>The Call</Text>

            <Text style={createCallStyles.fieldLabel}>Shoot day</Text>
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
                  dropdownIconColor="#fff"
                >
                  {shootDays.map((d) => (
                    <Picker.Item key={d.id} label={shootDayLabel(d)} value={d.id} color="#1a1330" />
                  ))}
                </Picker>
              </View>
            )}
            <Text style={createCallStyles.fieldError}>{errors.shootDay || ''}</Text>

            <Text style={createCallStyles.fieldLabel}>Description</Text>
            <TextInput
              style={createCallStyles.input}
              placeholder="e.g. 20 men, fight scene"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
            />
            <Text style={createCallStyles.fieldError}>{errors.description || ''}</Text>

            <Text style={createCallStyles.fieldLabel}>Quantity needed</Text>
            <TextInput
              style={createCallStyles.input}
              placeholder="e.g. 20"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={quantityNeeded}
              onChangeText={(text) => {
                setQuantityNeeded(text);
                if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
              }}
              keyboardType="numeric"
            />
            <Text style={createCallStyles.fieldError}>{errors.quantity || ''}</Text>
          </View>

          {/* ----- Who we're looking for ----- */}
          <View style={createCallStyles.card}>
            <Text style={createCallStyles.cardTitle}>Who You're Looking For</Text>

            <Text style={createCallStyles.fieldLabel}>Age range (optional)</Text>
            <View style={createCallStyles.row}>
              <TextInput
                style={[createCallStyles.input, { flex: 1 }]}
                placeholder="Min"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={minAge}
                onChangeText={(text) => {
                  setMinAge(text);
                  if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                }}
                keyboardType="numeric"
              />
              <Text style={createCallStyles.rangeDash}>–</Text>
              <TextInput
                style={[createCallStyles.input, { flex: 1 }]}
                placeholder="Max"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={maxAge}
                onChangeText={(text) => {
                  setMaxAge(text);
                  if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                }}
                keyboardType="numeric"
              />
            </View>
            <Text style={createCallStyles.fieldError}>{errors.age || ''}</Text>

            <Text style={createCallStyles.fieldLabel}>Gender (optional)</Text>
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

            <ChipMultiSelect
              label="Skills (optional)"
              options={SKILL_OPTIONS}
              selected={skills}
              onToggle={toggleSkill}
              otherText={otherSkills}
              onOtherTextChange={setOtherSkills}
            />
            <Text style={createCallStyles.hintText}>Extras must have all of the selected skills.</Text>
          </View>

          {warning ? <Text style={createCallStyles.warningText}>{warning}</Text> : null}
          {message ? <Text style={createCallStyles.errorMessage}>{message}</Text> : null}

          <TouchableOpacity
            style={[createCallStyles.button, (submitting || shootDays.length === 0) && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={submitting || shootDays.length === 0}
          >
            <Text style={createCallStyles.buttonText}>{submitting ? 'Creating...' : 'Create Call Request'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={createCallStyles.buttonGhost} onPress={onBack}>
            <Text style={createCallStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createCallStyles = StyleSheet.create({
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
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
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
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#d99c4a',
    borderColor: '#d99c4a',
  },
  chipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#1a1330',
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  fieldError: {
    color: '#ff9d9d',
    fontSize: 12,
    minHeight: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#d99c4a',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 13,
    color: '#ff9d9d',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
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
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CreateCallRequestScreen;