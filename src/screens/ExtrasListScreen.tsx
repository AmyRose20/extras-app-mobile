import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import { SKILL_OPTIONS, AVAILABILITY_OPTIONS } from '../constants';
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
          <View style={extrasListStyles.pickerWrapper}>
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

          {activeFilterType === 'skill' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={extrasListStyles.chipsContainer}>
                <TouchableOpacity
                  style={[extrasListStyles.chip, skillFilter.length === 0 && extrasListStyles.chipSelected]}
                  onPress={onClearSkillFilter}
                >
                  <Text style={[extrasListStyles.chipText, skillFilter.length === 0 && extrasListStyles.chipTextSelected]}>All</Text>
                </TouchableOpacity>

                {SKILL_OPTIONS.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[extrasListStyles.chip, skillFilter.includes(skill) && extrasListStyles.chipSelected]}
                    onPress={() => onSelectSkillFilter(skill)}
                  >
                    <Text style={[extrasListStyles.chipText, skillFilter.includes(skill) && extrasListStyles.chipTextSelected]}>{skill}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {activeFilterType === 'gender' && (
            <View style={extrasListStyles.chipsContainer}>
              {['', 'MALE', 'FEMALE'].map((option) => (
                <TouchableOpacity
                  key={option || 'all'}
                  style={[extrasListStyles.chip, genderFilter === option && extrasListStyles.chipSelected]}
                  onPress={() => onSelectGenderFilter(option)}
                >
                  <Text style={[extrasListStyles.chipText, genderFilter === option && extrasListStyles.chipTextSelected]}>
                    {option === '' ? 'All' : option === 'MALE' ? 'Male' : 'Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeFilterType === 'availability' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={extrasListStyles.chipsContainer}>
                <TouchableOpacity
                  style={[extrasListStyles.chip, availabilityFilter.length === 0 && extrasListStyles.chipSelected]}
                  onPress={onClearAvailabilityFilter}
                >
                  <Text style={[extrasListStyles.chipText, availabilityFilter.length === 0 && extrasListStyles.chipTextSelected]}>All</Text>
                </TouchableOpacity>

                {AVAILABILITY_OPTIONS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[extrasListStyles.chip, availabilityFilter.includes(day) && extrasListStyles.chipSelected]}
                    onPress={() => onSelectAvailabilityFilter(day)}
                  >
                    <Text style={[extrasListStyles.chipText, availabilityFilter.includes(day) && extrasListStyles.chipTextSelected]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
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