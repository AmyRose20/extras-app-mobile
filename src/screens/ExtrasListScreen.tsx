import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles, spacing } from '../styles';
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Extra Profiles</Text>

        <Text style={styles.fieldLabel}>Filter by</Text>
        <Picker selectedValue={activeFilterType} onValueChange={(value) => setActiveFilterType(value)} style={{ marginBottom: spacing.md }}>
          <Picker.Item label="Skill" value="skill" />
          <Picker.Item label="Gender" value="gender" />
          <Picker.Item label="Availability" value="availability" />
          <Picker.Item label="Age range" value="age" />
        </Picker>

        {activeFilterType === 'skill' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xs }}>
            <View style={styles.chipsContainer}>
              <TouchableOpacity
                style={[styles.chip, skillFilter.length === 0 && styles.chipSelected]}
                onPress={onClearSkillFilter}
              >
                <Text style={[styles.chipText, skillFilter.length === 0 && styles.chipTextSelected]}>All</Text>
              </TouchableOpacity>

              {SKILL_OPTIONS.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[styles.chip, skillFilter.includes(skill) && styles.chipSelected]}
                  onPress={() => onSelectSkillFilter(skill)}
                >
                  <Text style={[styles.chipText, skillFilter.includes(skill) && styles.chipTextSelected]}>{skill}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {activeFilterType === 'gender' && (
          <View style={styles.chipsContainer}>
            {['', 'MALE', 'FEMALE'].map((option) => (
              <TouchableOpacity
                key={option || 'all'}
                style={[styles.chip, genderFilter === option && styles.chipSelected]}
                onPress={() => onSelectGenderFilter(option)}
              >
                <Text style={[styles.chipText, genderFilter === option && styles.chipTextSelected]}>
                  {option === '' ? 'All' : option === 'MALE' ? 'Male' : 'Female'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeFilterType === 'availability' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xs }}>
            <View style={styles.chipsContainer}>
              <TouchableOpacity
                style={[styles.chip, availabilityFilter.length === 0 && styles.chipSelected]}
                onPress={onClearAvailabilityFilter}
              >
                <Text style={[styles.chipText, availabilityFilter.length === 0 && styles.chipTextSelected]}>All</Text>
              </TouchableOpacity>

              {AVAILABILITY_OPTIONS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.chip, availabilityFilter.includes(day) && styles.chipSelected]}
                  onPress={() => onSelectAvailabilityFilter(day)}
                >
                  <Text style={[styles.chipText, availabilityFilter.includes(day) && styles.chipTextSelected]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {activeFilterType === 'age' && (
          <>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min age"
                value={minAgeFilter}
                onChangeText={setMinAgeFilter}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Max age"
                value={maxAgeFilter}
                onChangeText={setMaxAgeFilter}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={onApplyAgeFilter}>
              <Text style={styles.buttonText}>Apply Age Filter</Text>
            </TouchableOpacity>
          </>
        )}

        {activeFilterSummaries.length > 0 && (
          <>
            <Text style={[styles.filterSummary, styles.buttonSpacing]}>
              Active filters: {activeFilterSummaries.join(' | ')}
            </Text>
            <TouchableOpacity style={styles.button} onPress={onClearFilters}>
              <Text style={styles.buttonText}>Clear Filters</Text>
            </TouchableOpacity>
          </>
        )}

        {loading ? (
          <Text style={[styles.message, styles.buttonSpacing]}>Loading...</Text>
        ) : extras.length === 0 ? (
          <Text style={[styles.message, styles.buttonSpacing]}>No extras found.</Text>
        ) : (
          <View style={styles.buttonSpacing}>
            {extras.map((extra) => (
              <TouchableOpacity key={extra.id} style={styles.card} onPress={() => onSelectExtra(extra.id)}>
                <Text style={styles.cardTitle}>{extra.name}</Text>
                <Text style={styles.cardDetail}>
                  Skills: {extra.skills.length > 0 ? extra.skills.join(', ') : 'Not set'}
                </Text>
                <Text style={styles.cardDetail}>
                  Availability: {extra.availability.length > 0 ? extra.availability.join(', ') : 'Not set'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ExtrasListScreen;