import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type Screen = 'login' | 'home' | 'profile' | 'invites';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [userName, setUserName] = useState('');

  // ----- Profile screen state -----
  // "loading" and "profileMessage" are separate from the login ones,
  // since this screen has its own separate fetch/save process.
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [skills, setSkills] = useState(''); // comma-separated, e.g. "stunt work, horse riding"
  const [availability, setAvailability] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch('http://10.0.2.2:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Login failed: ${data.error}`);
        return;
      }

      setToken(data.token);
      setUserName(data.user.name);
      setScreen('home');
    } catch (error) {
      setMessage('Something went wrong — is the backend running?');
    }
  };

  // Fetches the current profile from the backend and fills in the form.
  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const response = await fetch('http://10.0.2.2:4000/profiles/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setProfileMessage(`Could not load profile: ${data.error}`);
        return;
      }

      // The backend might return null for fields never filled in yet,
      // so we fall back to an empty string for each one.
      setAge(data.age ? String(data.age) : '');
      setGender(data.gender ?? '');
      setHeightCm(data.heightCm ? String(data.heightCm) : '');
      setSkills(data.skills ? data.skills.join(', ') : '');
      setAvailability(data.availability ?? '');
    } catch (error) {
      setProfileMessage('Something went wrong loading your profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Whenever we switch TO the profile screen, load the latest data.
  useEffect(() => {
    if (screen === 'profile') {
      loadProfile();
    }
  }, [screen]);

  // Sends the edited fields back to the backend.
  const saveProfile = async () => {
    setProfileMessage('');
    try {
      const response = await fetch('http://10.0.2.2:4000/profiles/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: age ? parseInt(age, 10) : null,
          gender: gender || null,
          heightCm: heightCm ? parseInt(heightCm, 10) : null,
          // Turn "stunt work, horse riding" back into an array,
          // trimming extra spaces around each one.
          skills: skills
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          availability: availability || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileMessage(`Save failed: ${data.error}`);
        return;
      }

      setProfileMessage('Saved!');
    } catch (error) {
      setProfileMessage('Something went wrong saving your profile.');
    }
  };

  // ----- LOGIN SCREEN -----
  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Extras App</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </SafeAreaView>
    );
  }

  // ----- HOME SCREEN -----
  if (screen === 'home') {
    const handleLogout = () => {
      // Clear everything we saved at login, and send the user
      // back to the login screen with a blank form.
      setToken('');
      setUserName('');
      setEmail('');
      setPassword('');
      setMessage('');
      setScreen('login');
    };

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Welcome, {userName}</Text>

        <TouchableOpacity style={styles.button} onPress={() => setScreen('profile')}>
          <Text style={styles.buttonText}>My Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => setScreen('invites')}>
          <Text style={styles.buttonText}>My Invites</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ----- PROFILE SCREEN -----
  if (screen === 'profile') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>My Profile</Text>

          {profileLoading ? (
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

              <TouchableOpacity style={styles.button} onPress={saveProfile}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </>
          )}

          {profileMessage ? <Text style={styles.message}>{profileMessage}</Text> : null}

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => setScreen('home')}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- INVITES SCREEN (still a placeholder) -----
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Invites screen coming soon</Text>
      <TouchableOpacity style={styles.button} onPress={() => setScreen('home')}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonSpacing: {
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default App;