import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { API_URL } from '../api';

type Props = {
  token: string;
  onBack: () => void;
};

function CreateShootDayScreen({ token, onBack }: Props) {
  // This screen manages its own form fields, since nothing else in
  // the app needs to know about them — unlike profile/invites data,
  // which multiple screens share.
  const [productionName, setProductionName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/shoot-days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productionName, date, location }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Failed: ${data.error}`);
        return;
      }

      setMessage(`Created! Shoot day ID: ${data.id}`);
      setProductionName('');
      setDate('');
      setLocation('');
    } catch (error) {
      setMessage('Something went wrong — is the backend running?');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Shoot Day</Text>

      <TextInput
        style={styles.input}
        placeholder="Production name"
        value={productionName}
        onChangeText={setProductionName}
      />

      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default CreateShootDayScreen;


/* Note the message here shows the new shoot day's ID after creating it 
— I'll need to copy that ID to use in the next screen (Create Call Request), 
same as I did manually in Postman earlier. */