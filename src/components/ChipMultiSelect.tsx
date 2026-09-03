import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { styles } from '../styles';

type Props = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  otherText: string;
  onOtherTextChange: (text: string) => void;
};

function ChipMultiSelect({ label, options, selected, onToggle, otherText, onOtherTextChange }: Props) {
  return (
    <View style={styles.buttonSpacing}>
      <Text style={styles.message}>{label}</Text>
      <View style={styles.chipsContainer}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(option)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        style={[styles.input, styles.buttonSpacing]}
        placeholder="Other (comma-separated, optional)"
        value={otherText}
        onChangeText={onOtherTextChange}
      />
    </View>
  );
}

export default ChipMultiSelect;