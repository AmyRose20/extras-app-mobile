import React, { useState, useEffect } from 'react';
import { Screen, Role, Invite, Production, PendingProduction, DeniedProduction, DialogConfig, MaskedBankDetails, ExtraSummary, ExtraProfileDetail, Tally, ShootDaySummary, ShootDayDetail, CallRequestSummary, DeletionRequestSummary, ProductionRequestSummary } from './src/types';
import { setAuthToken, setPasswordChangedHandler, errorMessage } from './src/api/client';
import * as authApi from './src/api/authApi';
import * as profilesApi from './src/api/profilesApi';
import * as invitesApi from './src/api/invitesApi';
import * as requestsApi from './src/api/requestsApi';
import * as shootDaysApi from './src/api/shootDaysApi';
import * as callRequestsApi from './src/api/callRequestsApi';
import * as badgesApi from './src/api/badgesApi';
import { launchImageLibrary } from 'react-native-image-picker';
import { getStorage, ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import InvitesScreen from './src/screens/InvitesScreen';
import CreateCallRequestScreen from './src/screens/CreateCallRequestScreen';
import CallRequestStatusScreen from './src/screens/CallRequestStatusScreen';
import ExtrasListScreen from './src/screens/ExtrasListScreen';
import ExtraProfileDetailScreen from './src/screens/ExtraProfileDetailScreen';
import ShootDaysListScreen from './src/screens/ShootDaysListScreen';
import ShootDayDetailScreen from './src/screens/ShootDayDetailScreen';
import { getAuth, signInWithCustomToken, signOut } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { SKILL_OPTIONS, LANGUAGE_OPTIONS, AVAILABILITY_GROUPS } from './src/constants';
import InviteListScreen from './src/screens/InviteListScreen';
import BulkCreateShootDaysScreen from './src/screens/BulkCreateShootDaysScreen';
import HeaderMenu, { MenuItem } from './src/components/HeaderMenu';
import ConfirmDialog from './src/components/ConfirmDialog';
import DeletionRequestsScreen from './src/screens/DeletionRequestsScreen';
import ProductionRequestsScreen from './src/screens/ProductionRequestsScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import InviteExtrasScreen from './src/screens/InviteExtrasScreen';
import { SafeAreaView, Text, View, StyleSheet, StatusBar, AppState } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';


function AppContent(): React.JSX.Element {
  const insets = useSafeAreaInsets(); // how much space the status bar etc. take up
  const [screen, setScreen] = useState<Screen>('login');
  const [dialog, setDialog] = useState<DialogConfig | null>(null); // null = no dialog open
  // Set when Create Call Request is opened from a shoot day (undefined = opened from Home)
  const [callRequestShootDayId, setCallRequestShootDayId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shows a short message at the bottom of any screen for 3 seconds
  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  }; // null = no dialog open
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [loginNotice, setLoginNotice] = useState(''); // green message on the login screen
  const [userName, setUserName] = useState('');
  const [coordinatorProduction, setCoordinatorProduction] = useState<string | null>(null);
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
  const [dateOfBirth, setDateOfBirth] = useState(''); // "YYYY-MM-DD", or '' if not set
  const [hasSmartphone, setHasSmartphone] = useState(true);
  const [bankDetails, setBankDetails] = useState<MaskedBankDetails | null>(null); // saved details (masked)
  const [editingBank, setEditingBank] = useState(false); // true while typing in new details
  const [removeBank, setRemoveBank] = useState(false);   // true if "Remove" was tapped
  const [ibanInput, setIbanInput] = useState('');
  const [bicInput, setBicInput] = useState('');
  const [accountNameInput, setAccountNameInput] = useState(''); // name on the bank account
  const [bankError, setBankError] = useState('');
  const [gender, setGender] = useState('');
  const [deletionRequestStatus, setDeletionRequestStatus] = useState('NONE');
  const [deletionActionLoading, setDeletionActionLoading] = useState(false);
  const [allProductions, setAllProductions] = useState<Production[]>([]); // every production, for the chips
  const [myProductionNames, setMyProductionNames] = useState<string[]>([]); // the ones this extra is on
  const [productionsError, setProductionsError] = useState('');
  const [pendingProductionNames, setPendingProductionNames] = useState<string[]>([]); // asked to join, waiting
  const [deniedProductions, setDeniedProductions] = useState<DeniedProduction[]>([]); // not approved (+ when they can ask again)
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
  const [nameFilter, setNameFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);
  const [minAgeFilter, setMinAgeFilter] = useState('');
  const [maxAgeFilter, setMaxAgeFilter] = useState('');
  const [selectedExtraProfile, setSelectedExtraProfile] = useState<ExtraProfileDetail | null>(null);
  const [extraDetailLoading, setExtraDetailLoading] = useState(false);
  const [extraDetailMessage, setExtraDetailMessage] = useState('');
  const [deletionRequestsList, setDeletionRequestsList] = useState<DeletionRequestSummary[]>([]);
  const [deletionRequestsLoading, setDeletionRequestsLoading] = useState(false);
  const [deletionRequestsMessage, setDeletionRequestsMessage] = useState('');
  const [productionRequestsList, setProductionRequestsList] = useState<ProductionRequestSummary[]>([]);
  const [productionRequestsLoading, setProductionRequestsLoading] = useState(false);
  const [productionRequestsMessage, setProductionRequestsMessage] = useState('');
  // Red notification badges: how many NEW things since each screen was last opened
  const [badgeCounts, setBadgeCounts] = useState({ invites: 0, deletionRequests: 0, productionRequests: 0 });

  // ----- Shoot days list / detail screen state (admin) -----
  const [shootDays, setShootDays] = useState<ShootDaySummary[]>([]);
  const [shootDaysLoading, setShootDaysLoading] = useState(false);
  const [shootDaysMessage, setShootDaysMessage] = useState('');
  const [selectedShootDay, setSelectedShootDay] = useState<ShootDayDetail | null>(null);
  const [shootDayDetailLoading, setShootDayDetailLoading] = useState(false);
  const [shootDayDetailMessage, setShootDayDetailMessage] = useState('');

  const [editDateTime, setEditDateTime] = useState<Date | null>(null);
  const [editingCallRequestId, setEditingCallRequestId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const [extraTally, setExtraTally] = useState<Tally | null>(null);

  const handleLogin = async () => {
    setLoginNotice('');
    try {
      const data = await authApi.login(email, password);

      await signInWithCustomToken(getAuth(), data.firebaseToken);

      setAuthToken(data.token); // every API call from now on sends this token
      setToken(data.token);
      setUserId(data.user.id);
      setUserName(data.user.name);
      setRole(data.user.role);
      setCoordinatorProduction(data.user.production?.name ?? null);
      setScreen('home');
    } catch (error) {
      setMessage(`Login failed: ${errorMessage(error)}`);
    }
  };

    const handleLogout = async () => {
    await signOut(getAuth());
    setToken('');
    setAuthToken(''); // forget the token, so nothing is sent with this login any more
    setUserId('');
    setUserName('');
    setEmail('');
    setPassword('');
    setMessage('');
    setScreen('login');
    setCoordinatorProduction(null);
    // Forget the last user's searches, filters, lists and badge counts,
    // so the next person to log in on this phone starts fresh
    setNameFilter('');
    setSkillFilter([]);
    setGenderFilter('');
    setAvailabilityFilter([]);
    setMinAgeFilter('');
    setMaxAgeFilter('');
    setExtras([]);
    setBadgeCounts({ invites: 0, deletionRequests: 0, productionRequests: 0 });
  };

  // If the password is changed on another phone, the backend rejects this phone's
  // old login. apiRequest (src/api/client.ts) spots that and calls this, which
  // sends the user back to the login screen with a clear message.
  useEffect(() => {
    setPasswordChangedHandler(async () => {
      await handleLogout();
      setMessage('Your password was changed. Please log in again.');
    });
    return () => setPasswordChangedHandler(null); // stop listening if App ever unmounts
  }, []);

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
      const data = await profilesApi.getMyProfile();

      setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '');
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
      setAvailability(fetchedAvailability.filter((a) => AVAILABILITY_GROUPS.some((group) => group.options.includes(a))));
      setOtherAvailability(fetchedAvailability.filter((a) => !AVAILABILITY_GROUPS.some((group) => group.options.includes(a))).join(', '));
      setFacePhotoUrl(data.facePhotoUrl ?? '');
      setFullBodyPhotoUrl(data.fullBodyPhotoUrl ?? '');
      setPendingFacePhoto(null);
      setPendingFullBodyPhoto(null);
      setDeletionRequestStatus(data.deletionRequestStatus ?? 'NONE');
      setHasSmartphone(data.hasSmartphone ?? true);
      setBankDetails(data.bankDetails ?? null);
      setEditingBank(false);
      setRemoveBank(false);
      setIbanInput('');
      setBicInput('');
      setAccountNameInput('');
      setBankError('');
      // Approved + pending are both "ticked" (unticking a pending one cancels the request)
      const approvedNames = (data.productions ?? []).map((p: Production) => p.name);
      const pendingNames = (data.pendingProductions ?? []).map((p: PendingProduction) => p.name);
      setMyProductionNames([...approvedNames, ...pendingNames]);
      setPendingProductionNames(pendingNames);
      setDeniedProductions(data.deniedProductions ?? []);
      setProductionsError('');

      // Full list of productions, used for the chips in edit mode
      try {
        setAllProductions(await profilesApi.getProductions());
      } catch (error) {
        setProductionsError('Could not load productions.');
      }
    } catch (error) {
      setProfileMessage(`Could not load profile: ${errorMessage(error)}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleProduction = (name: string) => {
    setMyProductionNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
    setProductionsError('');
  };

  const loadTally = async () => {
    try {
      setTally(await invitesApi.getMyTally());
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

    if (myProductionNames.length === 0) {
      setProductionsError('Select at least one production.');
      return;
    }
    setProductionsError('');

    setBankError('');
    if (editingBank && (!ibanInput.trim() || !bicInput.trim() || !accountNameInput.trim())) {
      setBankError('Please enter your IBAN, BIC and the account holder name.');
      return;
    }

    try {
      // 1) Save productions first. If this is refused (e.g. booked on an
      //    upcoming shoot), stop here so nothing else is half-saved.
      const selectedProductionIds = allProductions
        .filter((p) => myProductionNames.includes(p.name))
        .map((p) => p.id);

      try {
        const myProductions = await profilesApi.updateMyProductions(selectedProductionIds);
        // Keep the "waiting for approval" / "not approved" notes up to date
        setPendingProductionNames((myProductions.pendingProductions ?? []).map((p) => p.name));
        setDeniedProductions(myProductions.deniedProductions ?? []);
      } catch (error) {
        setProductionsError(errorMessage(error));
        return;
      }

      // 2) Then photos + the rest of the profile
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

      let data;
      try {
        data = await profilesApi.updateMyProfile({
          dateOfBirth: dateOfBirth || null,
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
          hasSmartphone,
          // Bank details: only sent if the extra changed or removed them
          ...(removeBank
            ? { iban: '', bic: '' }
            : editingBank
            ? { iban: ibanInput, bic: bicInput, accountHolderName: accountNameInput }
            : {}),
        });
      } catch (error) {
        // Bank errors show under the bank fields; anything else at the bottom
        const text = errorMessage(error);
        if (/IBAN|BIC|account holder/i.test(text)) {
          setBankError(text);
        } else {
          setProfileMessage(`Save failed: ${text}`);
        }
        return;
      }

      setBankDetails(data.bankDetails ?? null);
      setEditingBank(false);
      setRemoveBank(false);
      setIbanInput('');
      setBicInput('');
      setAccountNameInput('');
      setFacePhotoUrl(newFacePhotoUrl);
      setFullBodyPhotoUrl(newFullBodyPhotoUrl);
      setPendingFacePhoto(null);
      setPendingFullBodyPhoto(null);
      setIsEditingProfile(false);
      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 3000);
    } catch (error) {
      // e.g. a photo upload to Firebase failed
      setUploadingPhoto(false);
      setProfileMessage('Something went wrong saving your profile.');
    }
  };

  const requestAccountDeletion = async () => {
    setDeletionActionLoading(true);
    setProfileMessage('');
    try {
      const data = await requestsApi.requestMyDeletion();
      setDeletionRequestStatus(data.deletionRequestStatus);
    } catch (error) {
      setProfileMessage(`Could not request deletion: ${errorMessage(error)}`);
    } finally {
      setDeletionActionLoading(false);
    }
  };

  const cancelAccountDeletion = async () => {
    setDeletionActionLoading(true);
    setProfileMessage('');
    try {
      const data = await requestsApi.cancelMyDeletion();
      setDeletionRequestStatus(data.deletionRequestStatus);
    } catch (error) {
      setProfileMessage(`Could not cancel deletion request: ${errorMessage(error)}`);
    } finally {
      setDeletionActionLoading(false);
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
      setInvites(await invitesApi.getMyInvites());
    } catch (error) {
      setInvitesMessage(`Could not load invites: ${errorMessage(error)}`);
    } finally {
      setInvitesLoading(false);
    }
  };

  const respondToInvite = async (inviteId: string, status: invitesApi.InviteAnswer) => {
    try {
      await invitesApi.respondToInvite(inviteId, status);
      loadInvites();
    } catch (error) {
      setInvitesMessage(`Could not update invite: ${errorMessage(error)}`);
    }
  };

  const loadExtras = async () => {
    setExtrasLoading(true);
    setExtrasMessage('');
    try {
      const data = await profilesApi.getExtras({
        skills: skillFilter,
        gender: genderFilter,
        availability: availabilityFilter,
        minAge: minAgeFilter,
        maxAge: maxAgeFilter,
        name: nameFilter,
      });
      setExtras(data);
    } catch (error) {
      setExtrasMessage(`Could not load extras: ${errorMessage(error)}`);
    } finally {
      setExtrasLoading(false);
    }
  };

  const loadExtraProfile = async (id: string) => {
    setExtraDetailLoading(true);
    setExtraDetailMessage('');
    setSelectedExtraProfile(null);
    try {
      setSelectedExtraProfile(await profilesApi.getExtraProfile(id));
    } catch (error) {
      setExtraDetailMessage(`Could not load profile: ${errorMessage(error)}`);
    } finally {
      setExtraDetailLoading(false);
    }
  };

  const loadDeletionRequests = async () => {
    setDeletionRequestsLoading(true);
    setDeletionRequestsMessage('');
    try {
      setDeletionRequestsList(await requestsApi.getDeletionRequests());
    } catch (error) {
      setDeletionRequestsMessage(`Could not load deletion requests: ${errorMessage(error)}`);
    } finally {
      setDeletionRequestsLoading(false);
    }
  };

  // Approve or deny — both remove the request from the list when done
  const reviewDeletionRequest = async (userId: string, action: 'approve' | 'deny') => {
    try {
      await requestsApi.reviewDeletionRequest(userId, action);
      setDeletionRequestsList((prev) => prev.filter((r) => r.id !== userId));
    } catch (error) {
      setDeletionRequestsMessage(`Could not ${action}: ${errorMessage(error)}`);
    }
  };

  const approveDeletionRequest = (userId: string) => reviewDeletionRequest(userId, 'approve');
  const denyDeletionRequest = (userId: string) => reviewDeletionRequest(userId, 'deny');

  // ----- Production requests (extras asking to join my production) -----
  const loadProductionRequests = async () => {
    setProductionRequestsLoading(true);
    setProductionRequestsMessage('');
    try {
      setProductionRequestsList(await requestsApi.getProductionRequests());
    } catch (error) {
      setProductionRequestsMessage(`Could not load requests: ${errorMessage(error)}`);
    } finally {
      setProductionRequestsLoading(false);
    }
  };

  // Approve or deny — both remove the request from the list when done
  const reviewProductionRequest = async (requestId: string, action: 'approve' | 'deny') => {
    setProductionRequestsMessage('');
    try {
      await requestsApi.reviewProductionRequest(requestId, action);
      setProductionRequestsList((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      setProductionRequestsMessage(`Could not ${action}: ${errorMessage(error)}`);
    }
  };

  // ----- Notification badges -----
  const loadBadgeCounts = async () => {
    try {
      const data = await badgesApi.getBadgeCounts();
      setBadgeCounts({
        invites: data.invites ?? 0,
        deletionRequests: data.deletionRequests ?? 0,
        productionRequests: data.productionRequests ?? 0,
      });
    } catch (error) {
      // Non-critical — the app just won't show badges if this fails.
    }
  };

  // Opening a screen clears its badge (until something newer arrives)
  const markBadgeSeen = async (type: badgesApi.BadgeType) => {
    setBadgeCounts((prev) => ({ ...prev, [type]: 0 })); // clear it on screen straight away
    try {
      await badgesApi.markBadgeSeen(type);
    } catch (error) {
      // Non-critical — worst case the badge reappears next time counts load.
    }
  };

  const adminRequestDeletionForExtra = async (userId: string) => {
    try {
      await requestsApi.requestDeletionForExtra(userId);
      if (selectedExtraProfile) {
        loadExtraProfile(selectedExtraProfile.id);
      }
    } catch (error) {
      setExtraDetailMessage(`Could not request deletion: ${errorMessage(error)}`);
    }
  };

  const removeExtraFromMyProduction = async (extraProfileId: string) => {
    setExtraDetailMessage('');
    try {
      await profilesApi.removeExtraFromMyProduction(extraProfileId);
      setScreen(extraProfileReturnTo);
    } catch (error) {
      // e.g. "This is the extra's only production. Use a deletion request instead."
      setExtraDetailMessage(errorMessage(error));
    }
  };

  const loadExtraTally = async (extraProfileId: string) => {
    setExtraTally(null);
    try {
      setExtraTally(await invitesApi.getExtraTally(extraProfileId));
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
      setShootDays(await shootDaysApi.getShootDays());
    } catch (error) {
      setShootDaysMessage(`Could not load shoot days: ${errorMessage(error)}`);
    } finally {
      setShootDaysLoading(false);
    }
  };

  const loadShootDayDetail = async (id: string) => {
    setShootDayDetailLoading(true);
    setShootDayDetailMessage('');
    setSelectedShootDay(null);
    setEditingCallRequestId(null);
    try {
      setSelectedShootDay(await shootDaysApi.getShootDay(id));
    } catch (error) {
      setShootDayDetailMessage(`Could not load shoot day: ${errorMessage(error)}`);
    } finally {
      setShootDayDetailLoading(false);
    }
  };

  const handleSelectShootDay = (id: string, returnTo: Screen = 'shootDaysList') => {
    setShootDayDetailReturnTo(returnTo);
    setScreen('shootDayDetail');
    loadShootDayDetail(id);
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
      await callRequestsApi.updateCallRequest(editingCallRequestId, {
        description: editDescription,
        quantityNeeded: parseInt(editQuantity, 10),
      });
      setEditingCallRequestId(null);
      setEditDescription('');
      setEditQuantity('');
      loadShootDayDetail(selectedShootDay.id);
    } catch (error) {
      setShootDayDetailMessage(`Could not update call request: ${errorMessage(error)}`);
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
      setExtras(await profilesApi.getExtras()); // no filters = everyone on my production
    } catch (error) {
      setExtrasMessage(`Could not load extras: ${errorMessage(error)}`);
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

  // "Everyday" can't be combined with specific days:
  // ticking Everyday clears the weekdays, ticking a weekday clears Everyday.
  const toggleAvailability = (day: string) => {
    setAvailability((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day); // untick
      }
      if (day === 'Everyday') {
        return ['Everyday'];
      }
      return [...prev.filter((d) => d !== 'Everyday'), day];
    });
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
        loadProfile();
      }
    }
    if (screen === 'deletionRequests') {
      loadDeletionRequests();
    }
    if (screen === 'productionRequests') {
      loadProductionRequests();
    }
  }, [screen, skillFilter, genderFilter, availabilityFilter, nameFilter, role]);
 
  // Badges: refresh on Home, and clear one when its screen is opened
  useEffect(() => {
    if (!token) return; // not logged in
    if (screen === 'home') loadBadgeCounts();
    if (screen === 'invites') markBadgeSeen('invites');
    if (screen === 'deletionRequests') markBadgeSeen('deletionRequests');
    if (screen === 'productionRequests') markBadgeSeen('productionRequests');
  }, [screen, token]);
  
  // Badges: also refresh when the app comes back to the front,
  // or a push notification arrives while the app is open
  useEffect(() => {
    if (!token) return; // not logged in

    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadBadgeCounts();
    });

    const stopListeningForPush = onMessage(getMessaging(getApp()), () => {
      loadBadgeCounts();
    });

    // Clean up when logging out (token changes), so listeners don't pile up
    return () => {
      appStateListener.remove();
      stopListeningForPush();
    };
  }, [token]);

  const renderScreen = (): React.JSX.Element => {
    if (screen === 'changePassword') {
      return (
        <ChangePasswordScreen
          token={token}
          onBack={() => setScreen('home')}
          onChanged={(newToken) => {
            setAuthToken(newToken); // the API calls use the fresh token too
            setToken(newToken); // this phone stays logged in; other phones are logged out
            setScreen('home');
            setDialog({
              title: 'Password changed',
              message: "Your password has been changed. You've been logged out on any other phones.",
              confirmText: 'OK',
            });
          }}
        />
      );
    }
    if (screen === 'forgotPassword') {
      return (
        <ForgotPasswordScreen
          initialEmail={email}
          onBack={() => setScreen('login')}
          onDone={(resetEmail) => {
            setEmail(resetEmail);
            setPassword('');
            setMessage('');
            setLoginNotice('Password reset. Please log in with your new password.');
            setScreen('login');
          }}
        />
      );
    }
    if (screen === 'login') {
      return (
        <LoginScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          message={message}
          onLogin={handleLogin}
          notice={loginNotice}
          onForgotPassword={() => {
            setMessage('');
            setLoginNotice('');
            setScreen('forgotPassword');
          }}
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
          onNavigate={(target) => {
            setCallRequestShootDayId(undefined); // opening from Home never pre-selects a shoot day
            setScreen(target);
          }}
          onSelectShootDay={(id) => handleSelectShootDay(id, 'home')}
          invitesBadge={badgeCounts.invites}
        />
      );
    }

    if (screen === 'profile') {
      return (
        <ProfileScreen
          name={userName}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
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
          deletionRequestStatus={deletionRequestStatus}
          allProductionNames={allProductions.map((p) => p.name)}
          myProductionNames={myProductionNames}
          onToggleProduction={toggleProduction}
          productionsError={productionsError}
          pendingProductionNames={pendingProductionNames}
          deniedProductions={deniedProductions}
          hasSmartphone={hasSmartphone}
          setHasSmartphone={setHasSmartphone}
          bankDetails={bankDetails}
          editingBank={editingBank}
          setEditingBank={setEditingBank}
          removeBank={removeBank}
          setRemoveBank={setRemoveBank}
          ibanInput={ibanInput}
          setIbanInput={setIbanInput}
          bicInput={bicInput}
          setBicInput={setBicInput}
          accountNameInput={accountNameInput}
          setAccountNameInput={setAccountNameInput}
          bankError={bankError}
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
          showDialog={setDialog}
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
          nameFilter={nameFilter}
          onSearchName={setNameFilter}
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
          token={token}
        />
      );
    }

    if (screen === 'deletionRequests') {
      return (
        <DeletionRequestsScreen
          requests={deletionRequestsList}
          loading={deletionRequestsLoading}
          message={deletionRequestsMessage}
          onApprove={approveDeletionRequest}
          onDeny={denyDeletionRequest}
          onBack={() => setScreen('home')}
          showDialog={setDialog}
        />
      );
    }
 
    if (screen === 'inviteExtras') {
      return (
        <InviteExtrasScreen
          token={token}
          productionName={coordinatorProduction}
          onBack={() => setScreen('home')}
        />
      );
    }
    if (screen === 'productionRequests') {
      return (
        <ProductionRequestsScreen
          productionName={coordinatorProduction}
          requests={productionRequestsList}
          loading={productionRequestsLoading}
          message={productionRequestsMessage}
          onApprove={(id) => reviewProductionRequest(id, 'approve')}
          onDeny={(id) => reviewProductionRequest(id, 'deny')}
          onBack={() => setScreen('home')}
          showDialog={setDialog}
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

    if (screen === 'attendance' && selectedShootDay) {
      return (
        <AttendanceScreen
          token={token}
          shootDayId={selectedShootDay.id}
          productionName={coordinatorProduction}
          onBack={() => setScreen('shootDayDetail')}
          showDialog={setDialog}
        />
      );
    }

    if (screen === 'shootDayDetail') {
      return (
        <ShootDayDetailScreen
          token={token}
          shootDay={selectedShootDay}
          loading={shootDayDetailLoading}
          message={shootDayDetailMessage}
          onBack={() => setScreen(shootDayDetailReturnTo)}
          onSaved={() => {
            if (selectedShootDay) {
              loadShootDayDetail(selectedShootDay.id);
            }
          }}
          editingCallRequestId={editingCallRequestId}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editQuantity={editQuantity}
          setEditQuantity={setEditQuantity}
          onStartEditCallRequest={handleStartEditCallRequest}
          onCancelEditCallRequest={handleCancelEditCallRequest}
          onSaveCallRequest={handleSaveCallRequest}
          onViewResponses={handleViewResponses}
          onOpenAttendance={() => setScreen('attendance')}
          onAddCallRequest={() => {
            if (selectedShootDay) {
              setCallRequestShootDayId(selectedShootDay.id);
              setScreen('createCallRequest');
            }
          }}
        />
      );
    }

    if (screen === 'createCallRequest') {
      const fromShootDayId = callRequestShootDayId; // undefined if opened from Home
      return (
        <CreateCallRequestScreen
          token={token}
          initialShootDayId={fromShootDayId}
          onBack={() => {
            setCallRequestShootDayId(undefined);
            if (fromShootDayId) {
              setScreen('shootDayDetail'); // back to the shoot day it was opened from
            } else {
              setScreen('home');
            }
          }}
          onCreated={(callRequestId) => {
            setCallRequestShootDayId(undefined);
            setActiveCallRequestId(callRequestId);
            if (fromShootDayId) {
              loadShootDayDetail(fromShootDayId); // refresh so the new call request shows
              setCallRequestStatusReturnTo('shootDayDetail');
            } else {
              setCallRequestStatusReturnTo('home');
            }
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
      return <BulkCreateShootDaysScreen token={token} productionName={coordinatorProduction} onBack={() => setScreen('home')}           onCreated={(count) => {
            showToast(`Created ${count} shoot ${count === 1 ? 'day' : 'days'}.`);
            setScreen('shootDaysList');
          }} />;
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
        invitesBadge={badgeCounts.invites}
      />
    );
  };

    // ----- Hamburger menu items for the current screen -----
  const menuItems: MenuItem[] = [];
  
  // Everyone: change password
  menuItems.push({
    label: 'Change Password',
    disabled: screen === 'changePassword',
    onPress: () => setScreen('changePassword'),
  });
 
  // Coordinators: deletion requests live in the menu (they're only needed occasionally)
  if (role === 'ADMIN') {
    menuItems.push({
      label: 'Deletion Requests',
      badge: badgeCounts.deletionRequests,
      disabled: screen === 'deletionRequests', // greyed out when you're already there
      onPress: () => setScreen('deletionRequests'),
    });
      menuItems.push({
      label: 'Production Requests',
      badge: badgeCounts.productionRequests,
      disabled: screen === 'productionRequests', // greyed out when you're already there
      onPress: () => setScreen('productionRequests'),
    });
    menuItems.push({
      label: 'Invite Extras',
      disabled: screen === 'inviteExtras', // greyed out when you're already there
      onPress: () => setScreen('inviteExtras'),
    });
  }

  // Extras: request (or cancel) deletion of their own account
  if (role === 'EXTRA') {
    const pending = deletionRequestStatus === 'PENDING';
    menuItems.push({
      label: pending ? 'Cancel Deletion Request' : 'Delete My Account',
      danger: true,
      disabled: deletionActionLoading,
      onPress: () =>
        setDialog(
          pending
            ? {
                title: 'Cancel Deletion Request?',
                message: 'Your account will no longer be scheduled for deletion.',
                cancelText: 'No',
                confirmText: 'Yes, Cancel It',
                onConfirm: cancelAccountDeletion,
              }
            : {
                title: 'Delete Account?',
                message:
                  'This sends a request to the admin to delete your account. You will not be able to log in once it is approved.',
                confirmText: 'Request Deletion',
                destructive: true,
                onConfirm: requestAccountDeletion,
              }
        ),
    });
  }

  // Coordinators viewing an extra's profile: remove from production / request deletion
  if (screen === 'extraProfileDetail' && selectedExtraProfile) {
    const extra = selectedExtraProfile;
    const deletionPending = extra.deletionRequestStatus === 'PENDING';

    const openDeletionDialog = () =>
      setDialog({
        title: 'Request Account Deletion?',
        message: `This sends a deletion request for ${extra.name}'s account to be reviewed.`,
        confirmText: 'Request Deletion',
        destructive: true,
        onConfirm: () => adminRequestDeletionForExtra(extra.userId),
      });

    menuItems.push({
      label: 'Remove from Production',
      danger: true,
      onPress: () => {
        if ((extra.productions?.length ?? 0) <= 1) {
          // Only production: explain, and offer the deletion route instead
          setDialog({
            title: `Can't remove ${extra.name}`,
            message: deletionPending
              ? `${coordinatorProduction} is ${extra.name}'s only production, and an account deletion request is already awaiting approval.`
              : `${coordinatorProduction} is ${extra.name}'s only production. To take them off completely, request account deletion instead.`,
            cancelText: 'Close',
            ...(deletionPending
              ? {}
              : { confirmText: 'Request Deletion', destructive: true, onConfirm: openDeletionDialog }),
          });
        } else {
          setDialog({
            title: `Remove from ${coordinatorProduction}?`,
            message: `${extra.name} will no longer be matched or invited for ${coordinatorProduction}. Their upcoming invites for this production will be expired. Their account and any other productions are not affected.`,
            confirmText: 'Remove',
            destructive: true,
            onConfirm: () => removeExtraFromMyProduction(extra.id),
          });
        }
      },
    });

    menuItems.push({
      label: deletionPending ? 'Deletion Requested' : 'Request Account Deletion',
      danger: !deletionPending,
      disabled: deletionPending, // greyed out once a request is pending
      onPress: openDeletionDialog,
    });
  }

      return (
    <View style={{ flex: 1, backgroundColor: '#1a1330', paddingTop: screen === 'login' ? 0 : insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ flex: 1 }}>
        {renderScreen()}

        {screen !== 'login' && screen !== 'forgotPassword' && (
          <HeaderMenu
            isHome={screen === 'home'}
            onGoHome={() => setScreen('home')}
            onLogout={handleLogout}
            items={menuItems}
            badgeCount={role === 'ADMIN' ? badgeCounts.deletionRequests + badgeCounts.productionRequests : 0}
          />
        )}

        {/* One app-wide confirmation dialog, drawn over everything */}
        <ConfirmDialog
          visible={dialog !== null}
          title={dialog?.title ?? ''}
          message={dialog?.message ?? ''}
          confirmText={dialog?.confirmText}
          cancelText={dialog?.cancelText}
          destructive={dialog?.destructive}
          onCancel={() => setDialog(null)}
          onConfirm={
            dialog?.onConfirm
              ? () => {
                  const action = dialog?.onConfirm;
                  setDialog(null); // close this dialog first...
                  action?.();      // ...then run the action (which may open another dialog)
                }
              : undefined
          }
        />
        
        {/* App-wide toast message (e.g. "Created 2 shoot days.") */}
        {toastMessage ? (
          <View
            style={{
              position: 'absolute',
              bottom: 30,
              left: 20,
              right: 20,
              backgroundColor: '#d99c4a',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              zIndex: 200,
              elevation: 200,
            }}
          >
            <Text style={{ color: '#1a1330', fontWeight: '700', fontSize: 15 }}>{toastMessage}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default App;