import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Screen, Role, Invite, ExtraSummary, ExtraProfileDetail, Tally, ShootDaySummary, ShootDayDetail, CallRequestSummary } from './src/types';
import { API_URL } from './src/api';
import { launchImageLibrary } from 'react-native-image-picker';
import { getStorage, ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import InvitesScreen from './src/screens/InvitesScreen';
import CreateShootDayScreen from './src/screens/CreateShootDayScreen';
import CreateCallRequestScreen from './src/screens/CreateCallRequestScreen';
import CallRequestStatusScreen from './src/screens/CallRequestStatusScreen';
import ExtrasListScreen from './src/screens/ExtrasListScreen';
import ExtraProfileDetailScreen from './src/screens/ExtraProfileDetailScreen';
import ShootDaysListScreen from './src/screens/ShootDaysListScreen';
import ShootDayDetailScreen from './src/screens/ShootDayDetailScreen';
import { getAuth, signInWithCustomToken, signOut } from '@react-native-firebase/auth';
import { SKILL_OPTIONS, LANGUAGE_OPTIONS, AVAILABILITY_OPTIONS } from './src/constants';
import InviteListScreen from './src/screens/InviteListScreen';
import BulkCreateShootDaysScreen from './src/screens/BulkCreateShootDaysScreen';
import HeaderMenu from './src/components/HeaderMenu';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<Role>('EXTRA');
  const [userId, setUserId] = useState('');
  const [activeCallRequestId, setActiveCallRequestId] = useState('');

  const [callRequestStatusReturnTo, setCallRequestStatusReturnTo] = useState<Screen>('home');
  const [inviteListStatus, setInviteListStatus] = useState<'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'>('PENDING');
  const [extraProfileReturnTo, setExtraProfileReturnTo] = useState<Screen>('extrasList');
  const [shootDayDetailReturnTo, setShootDayDetailReturnTo] = useState<Screen>('shootDaysList');

  const handleViewInvites = (status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED') => {
    setInviteListStatus(status);
    setScreen('inviteList');
  };

  const handleViewResponses = (callRequestId: string) => {
    setActiveCallRequestId(callRequestId);
    setCallRequestStatusReturnTo('shootDayDetail');
    setScreen('callRequestStatus');
  };


  // ----- Profile screen state -----
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [otherSkills, setOtherSkills] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLanguages, setOtherLanguages] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [otherAvailability, setOtherAvailability] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [facePhotoUrl, setFacePhotoUrl] = useState('');
  const [fullBodyPhotoUrl, setFullBodyPhotoUrl] = useState('');
  const [pendingFacePhoto, setPendingFacePhoto] = useState<string | null>(null);
  const [pendingFullBodyPhoto, setPendingFullBodyPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [contactError, setContactError] = useState('');
  const [tally, setTally] = useState<Tally | null>(null);

  // ----- Invites screen state -----
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesMessage, setInvitesMessage] = useState('');

  // ----- Extras list / profile detail screen state (admin) -----
  const [extras, setExtras] = useState<ExtraSummary[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [extrasMessage, setExtrasMessage] = useState('');
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);
  const [minAgeFilter, setMinAgeFilter] = useState('');
  const [maxAgeFilter, setMaxAgeFilter] = useState('');
  const [selectedExtraProfile, setSelectedExtraProfile] = useState<ExtraProfileDetail | null>(null);
  const [extraDetailLoading, setExtraDetailLoading] = useState(false);
    const [extraDetailMessage, setExtraDetailMessage] = useState('');

  // ----- Shoot days list / detail screen state (admin) -----
  const [shootDays, setShootDays] = useState<ShootDaySummary[]>([]);
  const [shootDaysLoading, setShootDaysLoading] = useState(false);
  const [shootDaysMessage, setShootDaysMessage] = useState('');
  const [selectedShootDay, setSelectedShootDay] = useState<ShootDayDetail | null>(null);
  const [shootDayDetailLoading, setShootDayDetailLoading] = useState(false);
  const [shootDayDetailMessage, setShootDayDetailMessage] = useState('');
  const [shootDayDateError, setShootDayDateError] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDateTime, setEditDateTime] = useState<Date | null>(null);
  const [editingCallRequestId, setEditingCallRequestId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const [extraTally, setExtraTally] = useState<Tally | null>(null);

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

      await signInWithCustomToken(getAuth(), data.firebaseToken);

      setToken(data.token);
      setUserId(data.user.id);
      setUserName(data.user.name);
      setRole(data.user.role);
      setScreen('home');
    } catch (error) {
      setMessage('Something went wrong — is the backend running?');
    }
  };

    const handleLogout = async () => {
    await signOut(getAuth());
    setToken('');
    setUserId('');
    setUserName('');
    setEmail('');
    setPassword('');
    setMessage('');
    setScreen('login');
  };

  const pickImage = async (onPicked: (uri: string) => void) => {
  const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return;
    }

  const uri = result.assets[0].uri;
    if (uri) {
      onPicked(uri);
    }
  };

  const handlePickFacePhoto = () => pickImage(setPendingFacePhoto);
  const handlePickFullBodyPhoto = () => pickImage(setPendingFullBodyPhoto);

  const uploadPhotoToStorage = async (localUri: string, photoType: 'face' | 'fullbody'): Promise<string> => {
  const reference = ref(getStorage(), `profile-photos/${userId}/${photoType}.jpg`);
    await putFile(reference, localUri);
    return await getDownloadURL(reference);
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
      const fetchedSkills: string[] = data.skills ?? [];
      setSkills(fetchedSkills.filter((s) => SKILL_OPTIONS.includes(s)));
      setOtherSkills(fetchedSkills.filter((s) => !SKILL_OPTIONS.includes(s)).join(', '));
      const fetchedLanguages: string[] = data.languages ?? [];
      setLanguages(fetchedLanguages.filter((l) => LANGUAGE_OPTIONS.includes(l)));
      setOtherLanguages(fetchedLanguages.filter((l) => !LANGUAGE_OPTIONS.includes(l)).join(', '));
      setPhoneNumber(data.phoneNumber ?? '');
      setContactEmail(data.contactEmail || email);
      const fetchedAvailability: string[] = data.availability ?? [];
      setAvailability(fetchedAvailability.filter((a) => AVAILABILITY_OPTIONS.includes(a)));
      setOtherAvailability(fetchedAvailability.filter((a) => !AVAILABILITY_OPTIONS.includes(a)).join(', '));
      setFacePhotoUrl(data.facePhotoUrl ?? '');
      setFullBodyPhotoUrl(data.fullBodyPhotoUrl ?? '');
      setPendingFacePhoto(null);
      setPendingFullBodyPhoto(null);
    } catch (error) {
      setProfileMessage('Something went wrong loading your profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const loadTally = async () => {
    try {
      const response = await fetch(`${API_URL}/invites/tally/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setTally(data);
    } catch (error) {
      // Non-critical — the invites screen just doesn't show the widget if this fails.
    }
  };

  const saveProfile = async () => {
  setProfileMessage('');
  setContactError('');

    // Both photos are mandatory — either already saved, or picked just now
    if (!facePhotoUrl && !pendingFacePhoto) {
      setProfileMessage('A face photo is required.');
      return;
    }

    if (!fullBodyPhotoUrl && !pendingFullBodyPhoto) {
      setProfileMessage('A full-body photo is required.');
      return;
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        setContactError('Please enter a valid email address.');
        return;
    }   

if (phoneNumber && !/^[+]?[\d\s-]{7,15}$/.test(phoneNumber)) {
  setContactError('Please enter a valid phone number (digits, spaces, dashes, and an optional leading + only).');
  return;
}

    try {
      setUploadingPhoto(true);

      let newFacePhotoUrl = facePhotoUrl;
      if (pendingFacePhoto) {
        newFacePhotoUrl = await uploadPhotoToStorage(pendingFacePhoto, 'face');
      }

      let newFullBodyPhotoUrl = fullBodyPhotoUrl;
      if (pendingFullBodyPhoto) {
        newFullBodyPhotoUrl = await uploadPhotoToStorage(pendingFullBodyPhoto, 'fullbody');
      }

      setUploadingPhoto(false);

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
                    skills: [
            ...skills,
            ...otherSkills.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
          ],
          languages: [
            ...languages,
            ...otherLanguages.split(',').map((l) => l.trim()).filter((l) => l.length > 0),
          ],
          phoneNumber: phoneNumber || null,
          contactEmail: contactEmail || null,
          availability: [
            ...availability,
            ...otherAvailability.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
          ],
          facePhotoUrl: newFacePhotoUrl,
          fullBodyPhotoUrl: newFullBodyPhotoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileMessage(`Save failed: ${data.error}`);
        return;
      }

      setFacePhotoUrl(newFacePhotoUrl);
      setFullBodyPhotoUrl(newFullBodyPhotoUrl);
      setPendingFacePhoto(null);
      setPendingFullBodyPhoto(null);
      setIsEditingProfile(false);
      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 3000);
    } catch (error) {
      setUploadingPhoto(false);
      setProfileMessage('Something went wrong saving your profile.');
    }
  };

  const handleCancelEdit = () => {
    loadProfile();
    setIsEditingProfile(false);
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

  const respondToInvite = async (inviteId: string, status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED') => {
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

  const loadExtras = async () => {
    setExtrasLoading(true);
    setExtrasMessage('');
    try {
      const params = new URLSearchParams();
      if (skillFilter.length > 0) params.append('skill', skillFilter.join(','));
      if (genderFilter) params.append('gender', genderFilter);
      if (availabilityFilter.length > 0) params.append('availability', availabilityFilter.join(','));
      if (minAgeFilter) params.append('minAge', minAgeFilter);
      if (maxAgeFilter) params.append('maxAge', maxAgeFilter);
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_URL}/profiles${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setExtrasMessage(`Could not load extras: ${data.error}`);
        return;
      }

      setExtras(data);
    } catch (error) {
      setExtrasMessage('Something went wrong loading extras.');
    } finally {
      setExtrasLoading(false);
    }
  };

  const loadExtraProfile = async (id: string) => {
    setExtraDetailLoading(true);
    setExtraDetailMessage('');
    setSelectedExtraProfile(null);
    try {
      const response = await fetch(`${API_URL}/profiles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setExtraDetailMessage(`Could not load profile: ${data.error}`);
        return;
      }

      setSelectedExtraProfile(data);
    } catch (error) {
      setExtraDetailMessage('Something went wrong loading that profile.');
    } finally {
      setExtraDetailLoading(false);
    }
  };

  const loadExtraTally = async (extraProfileId: string) => {
    setExtraTally(null);
    try {
      const response = await fetch(`${API_URL}/invites/tally/${extraProfileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setExtraTally(data);
    } catch (error) {
      // Non-critical — the admin screen just doesn't show the activity widget if this fails.
    }
  };

  const handleSelectExtra = (id: string, returnTo: Screen = 'extrasList') => {
    setExtraProfileReturnTo(returnTo);
    setScreen('extraProfileDetail');
    loadExtraProfile(id);
    loadExtraTally(id);
  };

  const loadShootDays = async () => {
    setShootDaysLoading(true);
    setShootDaysMessage('');
    try {
      const response = await fetch(`${API_URL}/shoot-days`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setShootDaysMessage(`Could not load shoot days: ${data.error}`);
        return;
      }

      setShootDays(data);
    } catch (error) {
      setShootDaysMessage('Something went wrong loading shoot days.');
    } finally {
      setShootDaysLoading(false);
    }
  };

  const loadShootDayDetail = async (id: string) => {
    setShootDayDetailLoading(true);
    setShootDayDetailMessage('');
    setSelectedShootDay(null);
    setIsEditingDate(false);
    setEditingCallRequestId(null);
    try {
      const response = await fetch(`${API_URL}/shoot-days/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setShootDayDetailMessage(`Could not load shoot day: ${data.error}`);
        return;
      }

      setSelectedShootDay(data);
    } catch (error) {
      setShootDayDetailMessage('Something went wrong loading that shoot day.');
    } finally {
      setShootDayDetailLoading(false);
    }
  };

  const handleSelectShootDay = (id: string, returnTo: Screen = 'shootDaysList') => {
    setShootDayDetailReturnTo(returnTo);
    setScreen('shootDayDetail');
    loadShootDayDetail(id);
  };

  const handleStartEditDate = () => {
    if (!selectedShootDay) return;
    setEditDateTime(new Date(selectedShootDay.date));
    setShootDayDateError('');
    setIsEditingDate(true);
  };

  const handleCancelEditDate = () => {
    setIsEditingDate(false);
    setEditDateTime(null);
    setShootDayDateError('');
  };

  const handleSaveDate = async () => {
    if (!editDateTime || !selectedShootDay) return;
    setShootDayDetailMessage('');
    setShootDayDateError('');
    try {
      const response = await fetch(`${API_URL}/shoot-days/${selectedShootDay.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: editDateTime.toISOString() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setShootDayDateError(data.error);
        return;
      }

      setIsEditingDate(false);
      setEditDateTime(null);
      loadShootDayDetail(selectedShootDay.id);
    } catch (error) {
      setShootDayDetailMessage('Something went wrong updating that shoot day.');
    }
  };

  const handleStartEditCallRequest = (callRequest: CallRequestSummary) => {
    setEditingCallRequestId(callRequest.id);
    setEditDescription(callRequest.description);
    setEditQuantity(String(callRequest.quantityNeeded));
  };

  const handleCancelEditCallRequest = () => {
    setEditingCallRequestId(null);
    setEditDescription('');
    setEditQuantity('');
  };

  const handleSaveCallRequest = async () => {
    if (!editingCallRequestId || !selectedShootDay) return;
    setShootDayDetailMessage('');
    try {
      const response = await fetch(`${API_URL}/call-requests/${editingCallRequestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: editDescription,
          quantityNeeded: parseInt(editQuantity, 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setShootDayDetailMessage(`Could not update call request: ${data.error}`);
        return;
      }

      setEditingCallRequestId(null);
      setEditDescription('');
      setEditQuantity('');
      loadShootDayDetail(selectedShootDay.id);
    } catch (error) {
      setShootDayDetailMessage('Something went wrong updating that call request.');
    }
  };

  const toggleSkillFilter = (skill: string) => {
    setSkillFilter((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const toggleAvailabilityFilter = (day: string) => {
    setAvailabilityFilter((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleClearFilters = async () => {
    setSkillFilter([]);
    setGenderFilter('');
    setAvailabilityFilter([]);
    setMinAgeFilter('');
    setMaxAgeFilter('');
    setExtrasLoading(true);
    setExtrasMessage('');
    try {
      const response = await fetch(`${API_URL}/profiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setExtrasMessage(`Could not load extras: ${data.error}`);
        return;
      }
      setExtras(data);
    } catch (error) {
      setExtrasMessage('Something went wrong loading extras.');
    } finally {
      setExtrasLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const toggleLanguage = (language: string) => {
    setLanguages((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]));
  };

  const toggleAvailability = (day: string) => {
  setAvailability((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  useEffect(() => {
    if (screen === 'profile') {
      loadProfile();
    }
    if (screen === 'invites') {
      loadInvites();
      loadTally();
    }
    if (screen === 'extrasList') {
      loadExtras();
    }
    if (screen === 'shootDaysList') {
      loadShootDays();
    }
    if (screen === 'home') {
      if (role === 'ADMIN') {
        loadShootDays();
      } else {
        loadInvites();
      }
    }
  }, [screen, skillFilter, genderFilter, availabilityFilter, role]);

  const renderScreen = (): React.JSX.Element => {
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
          token={token}
          shootDays={shootDays}
          invites={invites}
          onNavigate={(target) => setScreen(target)}
          onSelectShootDay={(id) => handleSelectShootDay(id, 'home')}
        />
      );
    }

    if (screen === 'profile') {
      return (
        <ProfileScreen
          name={userName}
          age={age}
          setAge={setAge}
          gender={gender}
          setGender={setGender}
          heightCm={heightCm}
          setHeightCm={setHeightCm}
          skills={skills}
          onToggleSkill={toggleSkill}
          otherSkills={otherSkills}
          setOtherSkills={setOtherSkills}
          languages={languages}
          onToggleLanguage={toggleLanguage}
          otherLanguages={otherLanguages}
          setOtherLanguages={setOtherLanguages}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          contactEmail={contactEmail}
          setContactEmail={setContactEmail}
          contactError={contactError}
          availability={availability}
          onToggleAvailability={toggleAvailability}
          otherAvailability={otherAvailability}
          setOtherAvailability={setOtherAvailability}
          loading={profileLoading}
          message={profileMessage}
          onSave={saveProfile}
          onBack={() => {
            setIsEditingProfile(false);
            setScreen('home');
          }}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          onCancelEdit={handleCancelEdit}
          facePhotoUrl={facePhotoUrl}
          fullBodyPhotoUrl={fullBodyPhotoUrl}
          pendingFacePhoto={pendingFacePhoto}
          pendingFullBodyPhoto={pendingFullBodyPhoto}
          onPickFacePhoto={handlePickFacePhoto}
          onPickFullBodyPhoto={handlePickFullBodyPhoto}
          uploadingPhoto={uploadingPhoto}
          showSavedPopup={showSavedPopup}
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
          tally={tally}
        />
      );
    }

    if (screen === 'extrasList') {
      return (
        <ExtrasListScreen
          extras={extras}
          loading={extrasLoading}
          message={extrasMessage}
          skillFilter={skillFilter}
          onSelectSkillFilter={toggleSkillFilter}
          onClearSkillFilter={() => setSkillFilter([])}
          genderFilter={genderFilter}
          onSelectGenderFilter={setGenderFilter}
          availabilityFilter={availabilityFilter}
          onSelectAvailabilityFilter={toggleAvailabilityFilter}
          onClearAvailabilityFilter={() => setAvailabilityFilter([])}
          minAgeFilter={minAgeFilter}
          setMinAgeFilter={setMinAgeFilter}
          maxAgeFilter={maxAgeFilter}
          setMaxAgeFilter={setMaxAgeFilter}
          onApplyAgeFilter={loadExtras}
          onSelectExtra={handleSelectExtra}
          onClearFilters={handleClearFilters}
          onBack={() => setScreen('home')}
        />
      );
    }

    if (screen === 'extraProfileDetail') {
      return (
        <ExtraProfileDetailScreen
          profile={selectedExtraProfile}
          loading={extraDetailLoading}
          message={extraDetailMessage}
          onBack={() => setScreen(extraProfileReturnTo)}
          tally={extraTally}
        />
      );
    }

    if (screen === 'shootDaysList') {
      return (
        <ShootDaysListScreen
          shootDays={shootDays}
          loading={shootDaysLoading}
          message={shootDaysMessage}
          onSelectShootDay={handleSelectShootDay}
          onBack={() => setScreen('home')}
        />
      );
    }

    if (screen === 'shootDayDetail') {
      return (
        <ShootDayDetailScreen
          shootDay={selectedShootDay}
          loading={shootDayDetailLoading}
          message={shootDayDetailMessage}
          onBack={() => setScreen(shootDayDetailReturnTo)}
          isEditingDate={isEditingDate}
          onStartEditDate={handleStartEditDate}
          onCancelEditDate={handleCancelEditDate}
          editDateTime={editDateTime}
          onDateTimeChange={setEditDateTime}
          onSaveDate={handleSaveDate}
          dateError={shootDayDateError}
          editingCallRequestId={editingCallRequestId}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editQuantity={editQuantity}
          setEditQuantity={setEditQuantity}
          onStartEditCallRequest={handleStartEditCallRequest}
          onCancelEditCallRequest={handleCancelEditCallRequest}
          onSaveCallRequest={handleSaveCallRequest}
          onViewResponses={handleViewResponses}
        />
      );
    }

    if (screen === 'createShootDay') {
      return <CreateShootDayScreen token={token} onBack={() => setScreen('home')} />;
    }

    if (screen === 'createCallRequest') {
      return (
        <CreateCallRequestScreen
          token={token}
          onBack={() => setScreen('home')}
          onCreated={(callRequestId) => {
            setActiveCallRequestId(callRequestId);
            setCallRequestStatusReturnTo('home');
            setScreen('callRequestStatus');
          }}
        />
      );
    }

    if (screen === 'callRequestStatus') {
      return (
        <CallRequestStatusScreen
          token={token}
          callRequestId={activeCallRequestId}
          onBack={() => setScreen(callRequestStatusReturnTo)}
          onViewInvites={handleViewInvites}
        />
      );
    }

    if (screen === 'inviteList') {
      return (
        <InviteListScreen
          token={token}
          callRequestId={activeCallRequestId}
          status={inviteListStatus}
          onBack={() => setScreen('callRequestStatus')}
          onSelectExtra={(id) => handleSelectExtra(id, 'inviteList')}
        />
      );
    }

    if (screen === 'bulkCreateShootDays') {
      return <BulkCreateShootDaysScreen token={token} onBack={() => setScreen('home')} />;
    }

    // Fallback — shouldn't normally be reached, but keeps TypeScript happy
    // about every possible Screen value being handled.
    return (
      <HomeScreen
        userName={userName}
        role={role}
        token={token}
        shootDays={shootDays}
        invites={invites}
        onNavigate={(target) => setScreen(target)}
        onSelectShootDay={(id) => handleSelectShootDay(id, 'home')}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
      {screen !== 'login' && (
        <HeaderMenu
          isHome={screen === 'home'}
          onGoHome={() => setScreen('home')}
          onLogout={handleLogout}
        />
      )}
    </View>
  );
}

export default App;