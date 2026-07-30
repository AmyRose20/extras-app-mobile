import React, { useState, useEffect } from 'react';
import { Screen, Role, Invite } from './src/types';
import { API_URL } from './src/api';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import InvitesScreen from './src/screens/InvitesScreen';
import CreateShootDayScreen from './src/screens/CreateShootDayScreen';
import CreateCallRequestScreen from './src/screens/CreateCallRequestScreen';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<Role>('EXTRA');

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
      const response = await fetch(`${API_URL}/auth/login`, {
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
      setRole(data.user.role);
      setScreen('home');
    } catch (error) {
      setMessage('Something went wrong — is the backend running?');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserName('');
    setEmail('');
    setPassword('');
    setMessage('');
    setScreen('login');
  };

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const response = await fetch(`${API_URL}/profiles/me`, {
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
      const response = await fetch(`${API_URL}/profiles/me`, {
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

  const loadInvites = async () => {
    setInvitesLoading(true);
    setInvitesMessage('');
    try {
      const response = await fetch(`${API_URL}/invites/me`, {
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

  const respondToInvite = async (inviteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const response = await fetch(`${API_URL}/invites/${inviteId}`, {
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

      loadInvites();
    } catch (error) {
      setInvitesMessage('Something went wrong updating that invite.');
    }
  };

  useEffect(() => {
    if (screen === 'profile') {
      loadProfile();
    }
    if (screen === 'invites') {
      loadInvites();
    }
  }, [screen]);

  if (screen === 'login') {
    return (
      <LoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        message={message}
        onLogin={handleLogin}
      />
    );
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        userName={userName}
        role={role}
        onNavigate={(target) => setScreen(target)}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'profile') {
    return (
      <ProfileScreen
        age={age}
        setAge={setAge}
        gender={gender}
        setGender={setGender}
        heightCm={heightCm}
        setHeightCm={setHeightCm}
        skills={skills}
        setSkills={setSkills}
        availability={availability}
        setAvailability={setAvailability}
        loading={profileLoading}
        message={profileMessage}
        onSave={saveProfile}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'invites') {
      return (
        <InvitesScreen
          invites={invites}
          loading={invitesLoading}
          message={invitesMessage}
          onRespond={respondToInvite}
          onBack={() => setScreen('home')}
        />
      );
    }

  if (screen === 'createShootDay') {
    return <CreateShootDayScreen token={token} onBack={() => setScreen('home')} />;
  }

  if (screen === 'createCallRequest') {
    return <CreateCallRequestScreen token={token} onBack={() => setScreen('home')} />;
  }

  // Fallback — shouldn't normally be reached, but keeps TypeScript happy
  // about every possible Screen value being handled.
  return (
    <HomeScreen userName={userName} role={role} onNavigate={(target) => setScreen(target)} onLogout={handleLogout} />
  );
}

export default App;