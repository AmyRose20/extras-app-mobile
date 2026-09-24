import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';

type Props = {
  token: string;
  onBack: () => void;
  onCreated: (callRequestId: string) => void;
};

function CreateCallRequestScreen({ token, onBack, onCreated }: Props) {
  const [shootDayId, setShootDayId] = useState('');
  const [description, setDescription] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    setMessage('');
    try {
      // Build the criteria object, leaving out anything left blank
      // rather than sending empty strings the backend can't use.
      const criteria: Record<string, unknown> = {};
      if (minAge) criteria.minAge = parseInt(minAge, 10);
      if (maxAge) criteria.maxAge = parseInt(maxAge, 10);
      if (gender) criteria.gender = gender;
      if (skills) {
        criteria.skills = skills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }

      const response = await fetch(`${API_URL}/call-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shootDayId,
          description,
          quantityNeeded: parseInt(quantityNeeded, 10),
          criteria,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Failed: ${data.error}`);
        return;
      }

      if (data.matchedCount === 0) {
        setMessage(data.warning || 'Created, but no extras matched this criteria.');
        return;
      }

      setMessage(`Created! Matched ${data.matchedCount} extra(s).`);
      onCreated(data.callRequest.id);
    } catch (error) {
      setMessage('Something went wrong — is the backend running?');
    }
  };

  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={createCallStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={createCallStyles.scrollContent}>
          <Text style={createCallStyles.title}>Create Call Request</Text>

          <TextInput
            style={createCallStyles.input}
            placeholder="Shoot Day ID"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={shootDayId}
            onChangeText={setShootDayId}
            autoCapitalize="none"
          />

          <TextInput
            style={createCallStyles.input}
            placeholder="Description (e.g. 20 men, fight scene)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={description}
            onChangeText={setDescription}
          />

          <TextInput
            style={createCallStyles.input}
            placeholder="Quantity needed"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={quantityNeeded}
            onChangeText={setQuantityNeeded}
            keyboardType="numeric"
          />

          <TextInput
            style={createCallStyles.input}
            placeholder="Min age (optional)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={minAge}
            onChangeText={setMinAge}
            keyboardType="numeric"
          />

          <TextInput
            style={createCallStyles.input}
            placeholder="Max age (optional)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={maxAge}
            onChangeText={setMaxAge}
            keyboardType="numeric"
          />

          <TextInput
            style={createCallStyles.input}
            placeholder="Gender (optional, e.g. MALE)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={gender}
            onChangeText={setGender}
            autoCapitalize="characters"
          />

          <TextInput
            style={createCallStyles.input}
            placeholder="Skills (optional, comma-separated)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={skills}
            onChangeText={setSkills}
          />

          <TouchableOpacity style={createCallStyles.button} onPress={handleCreate}>
            <Text style={createCallStyles.buttonText}>Create</Text>
          </TouchableOpacity>

          {message ? <Text style={createCallStyles.message}>{message}</Text> : null}

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
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#fff',
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