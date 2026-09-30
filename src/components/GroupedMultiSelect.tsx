import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Group = { title: string; options: string[] };

type Props = {
  label: string;
  groups: Group[];
  selected: string[];
  onToggle: (option: string) => void;
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  placeholder?: string;
};

export default function GroupedMultiSelect({
  label,
  groups,
  selected,
  onToggle,
  otherText,
  onOtherTextChange,
  placeholder = 'None selected',
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // Show ticked items plus anything typed in "Other" on the compact row
  const otherItems = (otherText ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allChosen = [...selected, ...otherItems];
  const summary = allChosen.length > 0 ? allChosen.join(', ') : placeholder;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {/* Compact row: tap to open the full-screen picker */}
      <TouchableOpacity style={styles.row} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text
          style={[styles.rowText, allChosen.length === 0 && styles.rowPlaceholder]}
          numberOfLines={2}
        >
          {summary}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.modal, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.count}>{allChosen.length} selected</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {groups.map((group) => (
              <View key={group.title} style={styles.card}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.options.map((option) => {
                  const ticked = selected.includes(option);
                  return (
                    <TouchableOpacity
                      key={option}
                      style={styles.optionRow}
                      onPress={() => onToggle(option)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, ticked && styles.checkboxTicked]}>
                        {ticked && <Text style={styles.tick}>✓</Text>}
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {onOtherTextChange && (
              <View style={styles.card}>
                <Text style={styles.groupTitle}>Other</Text>
                <TextInput
                  style={styles.otherInput}
                  value={otherText}
                  onChangeText={onOtherTextChange}
                  placeholder="Anything else? Separate with commas"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={() => setOpen(false)}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(12,10,22,0.55)',
  },
  rowText: { flex: 1, color: '#fff', fontSize: 15 },
  rowPlaceholder: { color: 'rgba(255,255,255,0.45)' },
  chevron: { color: '#d99c4a', fontSize: 24, marginLeft: 8 },
  modal: { flex: 1, backgroundColor: '#241d3d', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  count: { color: '#d99c4a', fontSize: 14 },
  scrollContent: { paddingBottom: 16 },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  groupTitle: {
    color: '#d99c4a',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxTicked: { backgroundColor: '#d99c4a', borderColor: '#d99c4a' },
  tick: { color: '#241d3d', fontSize: 14, fontWeight: '900' },
  optionText: { color: '#fff', fontSize: 16 },
  otherInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },
  doneButton: {
    backgroundColor: '#d99c4a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: '#241d3d', fontSize: 16, fontWeight: '700' },
});