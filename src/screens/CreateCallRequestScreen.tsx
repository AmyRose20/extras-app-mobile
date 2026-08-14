import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Create Call Request</Text>

        <TextInput
          style={styles.input}
          placeholder="Shoot Day ID"
          value={shootDayId}
          onChangeText={setShootDayId}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Description (e.g. 20 men, fight scene)"
          value={description}
          onChangeText={setDescription}
        />

        <TextInput
          style={styles.input}
          placeholder="Quantity needed"
          value={quantityNeeded}
          onChangeText={setQuantityNeeded}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Min age (optional)"
          value={minAge}
          onChangeText={setMinAge}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Max age (optional)"
          value={maxAge}
          onChangeText={setMaxAge}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Gender (optional, e.g. MALE)"
          value={gender}
          onChangeText={setGender}
          autoCapitalize="characters"
        />

        <TextInput
          style={styles.input}
          placeholder="Skills (optional, comma-separated)"
          value={skills}
          onChangeText={setSkills}
        />

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default CreateCallRequestScreen;