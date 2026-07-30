import React from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

type Props = {
  age: string;
  setAge: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  heightCm: string;
  setHeightCm: (value: string) => void;
  skills: string;
  setSkills: (value: string) => void;
  availability: string;
  setAvailability: (value: string) => void;
  loading: boolean;
  message: string;
  onSave: () => void;
  onBack: () => void;
};

function ProfileScreen({
  age,
  setAge,
  gender,
  setGender,
  heightCm,
  setHeightCm,
  skills,
  setSkills,
  availability,
  setAvailability,
  loading,
  message,
  onSave,
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>My Profile</Text>

        {loading ? (
          <Text style={styles.message}>Loading...</Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Gender (MALE, FEMALE, NON_BINARY, OTHER, PREFER_NOT_TO_SAY)"
              value={gender}
              onChangeText={setGender}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Skills (comma-separated, e.g. stunt work, horse riding)"
              value={skills}
              onChangeText={setSkills}
            />

            <TextInput
              style={styles.input}
              placeholder="Availability"
              value={availability}
              onChangeText={setAvailability}
            />

            <TouchableOpacity style={styles.button} onPress={onSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;