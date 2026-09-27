import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

type Props = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  otherText?: string;                          // optional — only for fields that allow "Other"
  onOtherTextChange?: (text: string) => void;  // optional — leave out to hide the "Other" chip
  emptyText?: string;                          // shown if there are no options (e.g. failed to load)
};

function ChipMultiSelect({
  label,
  options,
  selected,
  onToggle,
  otherText = '',
  onOtherTextChange,
  emptyText,
}: Props) {
  const allowsOther = !!onOtherTextChange;

  // The "Other" text box is open if the chip is tapped, or if there's already saved "other" text
  const [showOther, setShowOther] = useState(otherText.trim().length > 0);

  useEffect(() => {
    if (otherText.trim().length > 0) setShowOther(true);
  }, [otherText]);

  const toggleOther = () => {
    if (showOther) {
      onOtherTextChange?.(''); // closing "Other" clears what was typed
      setShowOther(false);
    } else {
      setShowOther(true);
    }
  };

  return (
    <View style={chipStyles.wrapper}>
      <Text style={chipStyles.label}>{label}</Text>

      {options.length === 0 && emptyText ? (
        <Text style={chipStyles.emptyText}>{emptyText}</Text>
      ) : null}

      <View style={chipStyles.chipsContainer}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[chipStyles.chip, isSelected && chipStyles.chipSelected]}
              onPress={() => onToggle(option)}
            >
              <Text style={[chipStyles.chipText, isSelected && chipStyles.chipTextSelected]}>{option}</Text>
            </TouchableOpacity>
          );
        })}

        {allowsOther ? (
          <TouchableOpacity
            style={[chipStyles.chip, showOther && chipStyles.chipSelected]}
            onPress={toggleOther}
          >
            <Text style={[chipStyles.chipText, showOther && chipStyles.chipTextSelected]}>Other</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {allowsOther && showOther ? (
        <TextInput
          style={chipStyles.input}
          placeholder="Other (comma-separated)"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={otherText}
          onChangeText={onOtherTextChange}
        />
      ) : null}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#ff9d9d',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
});

export default ChipMultiSelect;