import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import { SKILL_GROUPS, AVAILABILITY_OPTIONS } from '../constants';
import { ExtraSummary } from '../types';

type Props = {
  extras: ExtraSummary[];
  loading: boolean;
  message: string;
  skillFilter: string[];
  onSelectSkillFilter: (skill: string) => void;
  onClearSkillFilter: () => void;
  genderFilter: string;
  onSelectGenderFilter: (gender: string) => void;
  availabilityFilter: string[];
  onSelectAvailabilityFilter: (day: string) => void;
  onClearAvailabilityFilter: () => void;
  minAgeFilter: string;
  setMinAgeFilter: (value: string) => void;
  maxAgeFilter: string;
  setMaxAgeFilter: (value: string) => void;
  onApplyAgeFilter: () => void;
  onSelectExtra: (id: string) => void;
  onClearFilters: () => void;
  onBack: () => void;
};

function ExtrasListScreen({
  extras,
  loading,
  message,
  skillFilter,
  onSelectSkillFilter,
  onClearSkillFilter,
  genderFilter,
  onSelectGenderFilter,
  availabilityFilter,
  onSelectAvailabilityFilter,
  onClearAvailabilityFilter,
  minAgeFilter,
  setMinAgeFilter,
  maxAgeFilter,
  setMaxAgeFilter,
  onApplyAgeFilter,
  onSelectExtra,
  onClearFilters,
  onBack,
}: Props) {
  const [activeFilterType, setActiveFilterType] = useState('skill');

  const activeFilterSummaries = [
    skillFilter.length > 0 ? `Skill: ${skillFilter.join(', ')}` : null,
    genderFilter ? `Gender: ${genderFilter === 'MALE' ? 'Male' : 'Female'}` : null,
    availabilityFilter.length > 0 ? `Availability: ${availabilityFilter.join(', ')}` : null,
    minAgeFilter || maxAgeFilter ? `Age: ${minAgeFilter || 'any'}-${maxAgeFilter || 'any'}` : null,
  ].filter(Boolean);

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={extrasListStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={extrasListStyles.scrollContent}>
          <Text style={extrasListStyles.title}>Extra Profiles</Text>

          <Text style={extrasListStyles.fieldLabel}>Filter by</Text>
          <View style={extrasListStyles.filterRow}>
            {/* Left dropdown: which kind of filter */}
            <View style={[extrasListStyles.pickerWrapper, extrasListStyles.filterHalf]}>
              <Picker
                selectedValue={activeFilterType}
                onValueChange={(value) => setActiveFilterType(value)}
                style={extrasListStyles.picker}
                dropdownIconColor="#fff"
              >
                <Picker.Item label="Skill" value="skill" color="#1a1330" />
                <Picker.Item label="Gender" value="gender" color="#1a1330" />
                <Picker.Item label="Availability" value="availability" color="#1a1330" />
                <Picker.Item label="Age range" value="age" color="#1a1330" />
              </Picker>
            </View>

            {/* Right dropdown: the value (hidden for age, which uses boxes below) */}
            {activeFilterType !== 'age' && activeFilterType !== 'gender' && (
              <View style={[extrasListStyles.pickerWrapper, extrasListStyles.filterHalf]}>
                {activeFilterType === 'skill' && (
                  <Picker
                    selectedValue={skillFilter[0] ?? ''}
                    onValueChange={(value) => {
                      // Group headings can't be picked
                      if (value.startsWith('heading:')) return;
                      // One skill at a time: clear, then add the new one
                      onClearSkillFilter();
                      if (value !== '') onSelectSkillFilter(value);
                    }}
                    style={extrasListStyles.picker}
                    dropdownIconColor="#fff"
                  >
                    <Picker.Item label="All" value="" color="#1a1330" />
                    {SKILL_GROUPS.flatMap((group) => [
                      <Picker.Item
                        key={`heading:${group.title}`}
                        label={group.title.toUpperCase()}
                        value={`heading:${group.title}`}
                        color="#8a7fa8"
                        enabled={false}
                      />,
                      ...group.options.map((skill) => (
                        <Picker.Item key={skill} label={skill} value={skill} color="#1a1330" />
                      )),
                    ])}
                  </Picker>
                )}

                {activeFilterType === 'availability' && (
                  <Picker
                    selectedValue={availabilityFilter[0] ?? ''}
                    onValueChange={(value) => {
                      onClearAvailabilityFilter();
                      if (value !== '') onSelectAvailabilityFilter(value);
                    }}
                    style={extrasListStyles.picker}
                    dropdownIconColor="#fff"
                  >
                    <Picker.Item label="All" value="" color="#1a1330" />
                    {AVAILABILITY_OPTIONS.map((day) => (
                      <Picker.Item key={day} label={day} value={day} color="#1a1330" />
                    ))}
                  </Picker>
                )}

              </View>
            )}
          </View>

                    {activeFilterType === 'gender' && (
            <>
              <View style={extrasListStyles.chipsContainer}>
                {['MALE', 'FEMALE'].map((option) => {
                  const selected = genderFilter === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[extrasListStyles.chip, selected && extrasListStyles.chipSelected]}
                      // Tap again to unselect (back to everyone)
                      onPress={() => onSelectGenderFilter(selected ? '' : option)}
                    >
                      <Text style={[extrasListStyles.chipText, selected && extrasListStyles.chipTextSelected]}>
                        {option === 'MALE' ? 'Male' : 'Female'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={extrasListStyles.hint}>Leave unselected to include everyone</Text>
            </>
          )}

          {activeFilterType === 'age' && (
            <>
              <View style={extrasListStyles.row}>
                <TextInput
                  style={[extrasListStyles.input, { flex: 1 }]}
                  placeholder="Min age"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={minAgeFilter}
                  onChangeText={setMinAgeFilter}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[extrasListStyles.input, { flex: 1 }]}
                  placeholder="Max age"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={maxAgeFilter}
                  onChangeText={setMaxAgeFilter}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity style={extrasListStyles.button} onPress={onApplyAgeFilter}>
                <Text style={extrasListStyles.buttonText}>Apply Age Filter</Text>
              </TouchableOpacity>
            </>
          )}

          {activeFilterSummaries.length > 0 && (
            <>
              <Text style={extrasListStyles.filterSummary}>
                Active filters: {activeFilterSummaries.join(' | ')}
              </Text>
              <TouchableOpacity style={extrasListStyles.button} onPress={onClearFilters}>
                <Text style={extrasListStyles.buttonText}>Clear Filters</Text>
              </TouchableOpacity>
            </>
          )}

          {loading ? (
            <Text style={extrasListStyles.message}>Loading...</Text>
          ) : extras.length === 0 ? (
            <Text style={extrasListStyles.message}>No extras found.</Text>
          ) : (
            <View style={extrasListStyles.resultsSpacing}>
              {extras.map((extra) => (
                <TouchableOpacity key={extra.id} style={extrasListStyles.card} onPress={() => onSelectExtra(extra.id)}>
                  <Text style={extrasListStyles.cardTitle}>{extra.name}</Text>
                  <Text style={extrasListStyles.cardDetail}>
                    Skills: {extra.skills.length > 0 ? extra.skills.join(', ') : 'Not set'}
                  </Text>
                  <Text style={extrasListStyles.cardDetail}>
                    Availability: {extra.availability.length > 0 ? extra.availability.join(', ') : 'Not set'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {message ? <Text style={extrasListStyles.message}>{message}</Text> : null}

          <TouchableOpacity style={extrasListStyles.buttonGhost} onPress={onBack}>
            <Text style={extrasListStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const extrasListStyles = StyleSheet.create({
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
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterHalf: {
    flex: 1,
  },
    chipsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
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
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  filterSummary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  resultsSpacing: {
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 14,
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
    marginTop: 6,
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ExtrasListScreen;