import { useEffect, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { getStorage, ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { Screen, Role, Production, PendingProduction, DeniedProduction, MaskedBankDetails } from '../types';
import { errorMessage } from '../api/client';
import * as profilesApi from '../api/profilesApi';
import * as requestsApi from '../api/requestsApi';
import { SKILL_OPTIONS, LANGUAGE_OPTIONS, AVAILABILITY_GROUPS } from '../constants';

type Options = {
  screen: Screen;
  role: Role;
  userId: string; // used in the photo storage path
  loginEmail: string; // the contact email starts as the login email
};

// The logged-in extra's own profile: loading, editing, photos, bank details,
// saving, and asking for their account to be deleted.
export function useMyProfile({ screen, role, userId, loginEmail }: Options) {
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

  // Load it on My Profile, and on Home for extras (Home shows their name and calendar)
  useEffect(() => {
    if (screen === 'profile' || (screen === 'home' && role === 'EXTRA')) {
      loadProfile();
    }
  }, [screen, role]);

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
      setContactEmail(data.contactEmail || loginEmail);
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

  return {
    accountNameInput,
    allProductions,
    availability,
    bankDetails,
    bankError,
    bicInput,
    cancelAccountDeletion,
    contactEmail,
    contactError,
    dateOfBirth,
    deletionActionLoading,
    deletionRequestStatus,
    deniedProductions,
    editingBank,
    facePhotoUrl,
    fullBodyPhotoUrl,
    gender,
    handleCancelEdit,
    handlePickFacePhoto,
    handlePickFullBodyPhoto,
    hasSmartphone,
    heightCm,
    ibanInput,
    isEditingProfile,
    languages,
    myProductionNames,
    otherAvailability,
    otherLanguages,
    otherSkills,
    pendingFacePhoto,
    pendingFullBodyPhoto,
    pendingProductionNames,
    phoneNumber,
    productionsError,
    profileLoading,
    profileMessage,
    removeBank,
    requestAccountDeletion,
    saveProfile,
    setAccountNameInput,
    setBicInput,
    setContactEmail,
    setDateOfBirth,
    setEditingBank,
    setGender,
    setHasSmartphone,
    setHeightCm,
    setIbanInput,
    setIsEditingProfile,
    setOtherAvailability,
    setOtherLanguages,
    setOtherSkills,
    setPhoneNumber,
    setRemoveBank,
    showSavedPopup,
    skills,
    toggleAvailability,
    toggleLanguage,
    toggleProduction,
    toggleSkill,
    uploadingPhoto,
  };
}