import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SKILL_GROUPS, AVAILABILITY_OPTIONS } from '../../constants';
import { ExtraSummary } from '../../types';
import ScreenBackground from '../../components/ScreenBackground';
import GlassCard from '../../components/GlassCard';
import GoldButton from '../../components/GoldButton';
import GhostButton from '../../components/GhostButton';
import TextField from '../../components/TextField';
import Pager from '../../components/Pager';
import { colors, text } from '../../theme';

const PAGE_SIZE = 10;

type Props = {
  extras: ExtraSummary[];
  loading: boolean;
  message: string;
  skillFilter: string[];
  onSelectSkillFilter: (skill: string) => void;
  onClearSkillFilter: () => void;
  genderFilter: string;
  nameFilter: string;
  onSearchName: (name: string) => void;
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
  nameFilter,
  onSearchName,
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

  // ----- Name search: wait until typing stops, then search -----
  const [searchText, setSearchText] = useState(nameFilter);
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchName(searchText.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText, onSearchName]);

  // ----- Pagination: 10 extras per page -----
  const [page, setPage] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const totalPages = Math.max(1, Math.ceil(extras.length / PAGE_SIZE));
  const pageExtras = useMemo(
    () => extras.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [extras, page],
  );
  const firstShown = (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, extras.length);

  // A new list (e.g. after changing a filter) starts back on page 1
  useEffect(() => {
    setPage(1);
  }, [extras]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const activeFilterSummaries = [
    skillFilter.length > 0 ? `Skill: ${skillFilter.join(', ')}` : null,
    genderFilter ? `Gender: ${genderFilter === 'MALE' ? 'Male' : 'Female'}` : null,
    availabilityFilter.length > 0 ? `Availability: ${availabilityFilter.join(', ')}` : null,
    minAgeFilter || maxAgeFilter ? `Age: ${minAgeFilter || 'any'}-${maxAgeFilter || 'any'}` : null,
  ].filter(Boolean);

  return (
    <ScreenBackground scrollRef={scrollRef}>
      <Text style={text.title}>Extra Profiles</Text>

      {/* Name search */}
      <View style={extrasListStyles.searchWrapper}>
        <TextField
          style={[extrasListStyles.compactInput, extrasListStyles.searchInput]}
          placeholder="Search by name"
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={extrasListStyles.searchClear}
            onPress={() => setSearchText('')}
            accessibilityLabel="Clear search"
          >
            <Text style={extrasListStyles.searchClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={text.label}>Filter by</Text>
      <View style={extrasListStyles.filterRow}>
        {/* Left dropdown: which kind of filter */}
        <View style={[extrasListStyles.pickerWrapper, extrasListStyles.filterHalf]}>
          <Picker
            selectedValue={activeFilterType}
            onValueChange={(value) => setActiveFilterType(value)}
            style={extrasListStyles.picker}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="Skill" value="skill" color={colors.onGold} />
            <Picker.Item label="Gender" value="gender" color={colors.onGold} />
            <Picker.Item label="Availability" value="availability" color={colors.onGold} />
            <Picker.Item label="Age range" value="age" color={colors.onGold} />
          </Picker>
        </View>

        {/* Right dropdown: the value (not used for gender or age) */}
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
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="All" value="" color={colors.onGold} />
                {SKILL_GROUPS.flatMap((group) => [
                  <Picker.Item
                    key={`heading:${group.title}`}
                    label={group.title.toUpperCase()}
                    value={`heading:${group.title}`}
                    color="#8a7fa8"
                    enabled={false}
                  />,
                  ...group.options.map((skill) => (
                    <Picker.Item key={skill} label={skill} value={skill} color={colors.onGold} />
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
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="All" value="" color={colors.onGold} />
                {AVAILABILITY_OPTIONS.map((day) => (
                  <Picker.Item key={day} label={day} value={day} color={colors.onGold} />
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
            <TextField
              style={[extrasListStyles.compactInput, { flex: 1 }]}
              placeholder="Min age"
              value={minAgeFilter}
              onChangeText={setMinAgeFilter}
              keyboardType="numeric"
            />
            <TextField
              style={[extrasListStyles.compactInput, { flex: 1 }]}
              placeholder="Max age"
              value={maxAgeFilter}
              onChangeText={setMaxAgeFilter}
              keyboardType="numeric"
            />
          </View>
          <GoldButton title="Apply Age Filter" onPress={onApplyAgeFilter} style={extrasListStyles.goldButton} />
        </>
      )}

      {activeFilterSummaries.length > 0 && (
        <>
          <Text style={extrasListStyles.filterSummary}>Active filters: {activeFilterSummaries.join(' | ')}</Text>
          <GoldButton title="Clear Filters" onPress={onClearFilters} style={extrasListStyles.goldButton} />
        </>
      )}

      {loading ? (
        <Text style={text.message}>Loading...</Text>
      ) : extras.length === 0 ? (
        <Text style={text.message}>No extras found.</Text>
      ) : (
        <View style={extrasListStyles.resultsSpacing}>
          <Text style={extrasListStyles.resultCount}>
            Showing {firstShown}–{lastShown} of {extras.length}
          </Text>

          {pageExtras.map((extra) => (
            <TouchableOpacity key={extra.id} onPress={() => onSelectExtra(extra.id)}>
              <GlassCard style={extrasListStyles.card}>
                <Text style={extrasListStyles.cardTitle}>{extra.name}</Text>
                <Text style={extrasListStyles.cardDetail}>
                  Skills: {extra.skills.length > 0 ? extra.skills.join(', ') : 'Not set'}
                </Text>
                <Text style={extrasListStyles.cardDetail}>
                  Availability: {extra.availability.length > 0 ? extra.availability.join(', ') : 'Not set'}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}

          {/* Page controls (hidden when there's only one page) */}
          <Pager page={page} totalPages={totalPages} onChange={goToPage} />
        </View>
      )}

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const extrasListStyles = StyleSheet.create({
  searchWrapper: {
    justifyContent: 'center',
    marginBottom: 16,
  },
  // Slightly smaller than the normal TextField (search box and age boxes)
  compactInput: {
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 0,
  },
  searchInput: {
    paddingRight: 44, // room for the ✕ so text doesn't go under it
  },
  searchClear: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: {
    color: colors.text,
    fontSize: 16,
  },
  pickerWrapper: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
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
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
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
  goldButton: {
    marginBottom: 14,
  },
  filterSummary: {
    fontSize: 13,
    color: colors.textSoft,
    marginBottom: 10,
  },
  resultsSpacing: {
    marginTop: 4,
  },
  resultCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 10,
  },
  card: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 2,
  },
});

export default ExtrasListScreen;