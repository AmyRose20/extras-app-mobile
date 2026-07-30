import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';

type Screen = 'login' | 'home' | 'profile' | 'invites';

// Shape of one invite, as returned by GET /invites/me
type Invite = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  callRequest: {
    description: string;
    shootDay: {
      productionName: string;
      location: string;
      date: string;
    };
  };
};

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [userName, setUserName] = useState('');

  // ----- Profile screen state -----
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // ----- Invites screen state -----
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesMessage, setInvitesMessage] = useState('');

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

  // Fetches this extra's invites from the backend.
  const loadInvites = async () => {
    setInvitesLoading(true);
    setInvitesMessage('');
    try {
      const response = await fetch('http://10.0.2.2:4000/invites/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setInvitesMessage(`Could not load invites: ${data.error}`);
        return;
      }

      setInvites(data);
    } catch (error) {
      setInvitesMessage('Something went wrong loading your invites.');
    } finally {
      setInvitesLoading(false);
    }
  };

  // Sends an accept/decline for one invite, then refreshes the list
  // so the screen reflects the updated status immediately.
  const respondToInvite = async (inviteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const response = await fetch(`http://10.0.2.2:4000/invites/${inviteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        setInvitesMessage(`Could not update invite: ${data.error}`);
        return;
      }

      // Refresh the list so the new status shows immediately.
      loadInvites();
    } catch (error) {
      setInvitesMessage('Something went wrong updating that invite.');
    }
  };

  // Load the right data automatically whenever we switch to that screen.
  useEffect(() => {
    if (screen === 'profile') {
      loadProfile();
    }
    if (screen === 'invites') {
      loadInvites();
    }
  }, [screen]);

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

  // ----- INVITES SCREEN -----
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>My Invites</Text>

        {invitesLoading ? <Text style={styles.message}>Loading...</Text> : null}

        {!invitesLoading && invites.length === 0 ? (
          <Text style={styles.message}>No invites yet.</Text>
        ) : null}

        {invites.map((invite) => (
          <View key={invite.id} style={styles.card}>
            <Text style={styles.cardTitle}>{invite.callRequest.description}</Text>
            <Text style={styles.cardDetail}>
              {invite.callRequest.shootDay.productionName} — {invite.callRequest.shootDay.location}
            </Text>
            <Text style={styles.cardDetail}>
              {new Date(invite.callRequest.shootDay.date).toDateString()}
            </Text>
            <Text style={styles.cardStatus}>Status: {invite.status}</Text>

            {invite.status === 'PENDING' ? (
              <View style={styles.cardButtonRow}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.acceptButton]}
                  onPress={() => respondToInvite(invite.id, 'ACCEPTED')}>
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.declineButton]}
                  onPress={() => respondToInvite(invite.id, 'DECLINED')}>
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}

        {invitesMessage ? <Text style={styles.message}>{invitesMessage}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
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
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 14,
    color: '#555',
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  cardButtonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  smallButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: '#16a34a',
  },
  declineButton: {
    backgroundColor: '#dc2626',
  },
});

export default App;