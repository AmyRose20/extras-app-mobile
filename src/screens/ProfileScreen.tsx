import React, { useState } from 'react';
import { Text, TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatToDDMMYYYY, ageFromDob } from '../dateUtils';
import { AVAILABILITY_GROUPS, SKILL_GROUPS, LANGUAGE_GROUPS } from '../constants';
import ChipMultiSelect from '../components/ChipMultiSelect';
import GroupedMultiSelect from '../components/GroupedMultiSelect';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import GhostButton from '../components/GhostButton';
import TextField from '../components/TextField';
import SavedPopup from '../components/SavedPopup';
import { MaskedBankDetails, DeniedProduction } from '../types';
import { colors, text } from '../theme';

type Props = {
  name: string;
  dateOfBirth: string; // "YYYY-MM-DD", or '' if not set
  setDateOfBirth: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  heightCm: string;
  setHeightCm: (value: string) => void;
  skills: string[];
  onToggleSkill: (skill: string) => void;
  otherSkills: string;
  setOtherSkills: (value: string) => void;
  languages: string[];
  onToggleLanguage: (language: string) => void;
  otherLanguages: string;
  setOtherLanguages: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  contactEmail: string;
  setContactEmail: (value: string) => void;
  contactError: string;
  availability: string[];
  onToggleAvailability: (day: string) => void;
  otherAvailability: string;
  setOtherAvailability: (value: string) => void;
  loading: boolean;
  message: string;
  onSave: () => void;
  onBack: () => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (value: boolean) => void;
  onCancelEdit: () => void;
  facePhotoUrl: string;
  fullBodyPhotoUrl: string;
  pendingFacePhoto: string | null;
  pendingFullBodyPhoto: string | null;
  onPickFacePhoto: () => void;
  onPickFullBodyPhoto: () => void;
  uploadingPhoto: boolean;
  showSavedPopup: boolean;
  deletionRequestStatus: string;
  allProductionNames: string[];
  myProductionNames: string[];
  onToggleProduction: (name: string) => void;
  productionsError: string;
  pendingProductionNames: string[]; // asked to join, waiting for the coordinator
  deniedProductions: DeniedProduction[]; // not approved, with when they can ask again
  hasSmartphone: boolean;
  setHasSmartphone: (value: boolean) => void;
  bankDetails: MaskedBankDetails | null; // saved details (masked), or null
  editingBank: boolean;
  setEditingBank: (value: boolean) => void;
  removeBank: boolean;
  setRemoveBank: (value: boolean) => void;
  ibanInput: string;
  setIbanInput: (value: string) => void;
  bicInput: string;
  setBicInput: (value: string) => void;
  accountNameInput: string;
  setAccountNameInput: (value: string) => void;
  bankError: string;
};

function PhotoPreview({ uri, width, height }: { uri: string | null; width: number; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width, height, borderRadius: 8 }} />;
  }
  return (
    <View style={[profileStyles.photoPlaceholder, { width, height }]}>
      <Text style={profileStyles.photoPlaceholderText}>No photo</Text>
    </View>
  );
}

// One "LABEL / value" pair in view mode (label above the value)
function InfoField({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[profileStyles.field, last && { marginBottom: 0 }]}>
      <Text style={profileStyles.label}>{label}</Text>
      <Text style={profileStyles.value}>{value}</Text>
    </View>
  );
}

// Tap-to-pick chips (Male / Female, Yes / No)
function ChoiceChips<T>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={profileStyles.chipRow}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <TouchableOpacity
            key={option.label}
            style={[profileStyles.chip, selected && profileStyles.chipSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[profileStyles.chipText, selected && profileStyles.chipTextSelected]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

const SMARTPHONE_OPTIONS = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

function ProfileScreen({
  name,
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  heightCm,
  setHeightCm,
  skills,
  onToggleSkill,
  otherSkills,
  setOtherSkills,
  languages,
  onToggleLanguage,
  otherLanguages,
  setOtherLanguages,
  phoneNumber,
  setPhoneNumber,
  contactEmail,
  setContactEmail,
  contactError,
  availability,
  onToggleAvailability,
  otherAvailability,
  setOtherAvailability,
  loading,
  message,
  onSave,
  onBack,
  isEditingProfile,
  setIsEditingProfile,
  onCancelEdit,
  facePhotoUrl,
  fullBodyPhotoUrl,
  pendingFacePhoto,
  pendingFullBodyPhoto,
  onPickFacePhoto,
  onPickFullBodyPhoto,
  uploadingPhoto,
  showSavedPopup,
  deletionRequestStatus,
  allProductionNames,
  myProductionNames,
  onToggleProduction,
  productionsError,
  pendingProductionNames,
  deniedProductions,
  hasSmartphone,
  setHasSmartphone,
  bankDetails,
  editingBank,
  setEditingBank,
  removeBank,
  setRemoveBank,
  ibanInput,
  setIbanInput,
  bicInput,
  setBicInput,
  accountNameInput,
  setAccountNameInput,
  bankError,
}: Props) {
  const [showDobPicker, setShowDobPicker] = useState(false);
  const age = ageFromDob(dateOfBirth); // worked out live, so it updates as soon as a date is picked

  const handleDobChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDobPicker(false);
    if (event.type === 'set' && selected) {
      // Store as "YYYY-MM-DD" using the date the extra picked
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      setDateOfBirth(`${y}-${m}-${d}`);
    }
  };

  const allSkills = [...skills, ...otherSkills.split(',').map((s) => s.trim()).filter(Boolean)];
  const allLanguages = [...languages, ...otherLanguages.split(',').map((l) => l.trim()).filter(Boolean)];
  const allAvailability = [...availability, ...otherAvailability.split(',').map((a) => a.trim()).filter(Boolean)];

  // ---------- EDIT MODE (and loading) ----------
  if (loading || isEditingProfile) {
    return (
      <View style={profileStyles.fill}>
        <ScreenBackground>
          <Text style={text.title}>{isEditingProfile ? 'Edit My Profile' : 'My Profile'}</Text>

          {loading ? (
            <>
              <Text style={profileStyles.messageText}>Loading...</Text>
              <GhostButton title="Back" onPress={onBack} style={profileStyles.ghostButton} />
            </>
          ) : (
            <>
              {/* About me */}
              <GlassCard>
                <Text style={profileStyles.cardTitle}>About Me</Text>

                <InfoField label="Name" value={name} />

                <Text style={text.label}>Gender</Text>
                <ChoiceChips
                  options={GENDER_OPTIONS}
                  value={gender}
                  // Tap again to unselect
                  onChange={(option) => setGender(gender === option ? '' : option)}
                />

                <Text style={text.label}>Date of birth</Text>
                <TouchableOpacity style={profileStyles.fieldBox} onPress={() => setShowDobPicker(true)}>
                  <Text style={[profileStyles.fieldBoxText, !dateOfBirth && { color: colors.textFaint }]}>
                    {dateOfBirth ? `${formatToDDMMYYYY(dateOfBirth)}  (age ${age})` : 'Choose your date of birth'}
                  </Text>
                </TouchableOpacity>
                {showDobPicker ? (
                  <DateTimePicker
                    value={dateOfBirth ? new Date(dateOfBirth) : new Date(1995, 0, 1)}
                    mode="date"
                    display="spinner"
                    themeVariant="dark"
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    onChange={handleDobChange}
                  />
                ) : null}

                <Text style={text.label}>Height (cm)</Text>
                <TextField
                  style={[profileStyles.compactInput, { marginBottom: 0 }]}
                  placeholder="Height (cm)"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="numeric"
                />
              </GlassCard>

              {/* Productions */}
              <GlassCard>
                <ChipMultiSelect
                  label="Productions"
                  options={allProductionNames}
                  selected={myProductionNames}
                  onToggle={onToggleProduction}
                  emptyText="Couldn't load productions."
                />
                <Text style={profileStyles.fieldError}>{productionsError || ' '}</Text>
                <Text style={profileStyles.note}>
                  New productions need the coordinator's approval. You can leave a production at any time.
                </Text>
                {pendingProductionNames.length > 0 && (
                  <Text style={profileStyles.note}>
                    Waiting for approval: {pendingProductionNames.join(', ')}. Untick to cancel the request.
                  </Text>
                )}
                {deniedProductions.map((d) => (
                  <Text key={d.id} style={profileStyles.note}>
                    Not approved for {d.name}. You can ask again from {formatToDDMMYYYY(d.canRequestAgainAt)}.
                  </Text>
                ))}
              </GlassCard>

              {/* Skills, languages, availability */}
              <GlassCard>
                <GroupedMultiSelect
                  label="Skills"
                  groups={SKILL_GROUPS}
                  selected={skills}
                  onToggle={onToggleSkill}
                  otherText={otherSkills}
                  onOtherTextChange={setOtherSkills}
                />
                <GroupedMultiSelect
                  label="Languages"
                  groups={LANGUAGE_GROUPS}
                  selected={languages}
                  onToggle={onToggleLanguage}
                  otherText={otherLanguages}
                  onOtherTextChange={setOtherLanguages}
                />
                <GroupedMultiSelect
                  label="Availability"
                  groups={AVAILABILITY_GROUPS}
                  selected={availability}
                  onToggle={onToggleAvailability}
                />
              </GlassCard>

              {/* Photos */}
              <GlassCard>
                <Text style={profileStyles.cardTitle}>Photos</Text>
                <View style={profileStyles.photoRow}>
                  <View>
                    <Text style={profileStyles.label}>Face photo</Text>
                    <PhotoPreview uri={pendingFacePhoto || facePhotoUrl || null} width={140} height={210} />
                    <TouchableOpacity style={profileStyles.smallButton} onPress={onPickFacePhoto}>
                      <Text style={profileStyles.smallButtonText}>Choose photo</Text>
                    </TouchableOpacity>
                  </View>
                  <View>
                    <Text style={profileStyles.label}>Full-body photo</Text>
                    <PhotoPreview uri={pendingFullBodyPhoto || fullBodyPhotoUrl || null} width={140} height={210} />
                    <TouchableOpacity style={profileStyles.smallButton} onPress={onPickFullBodyPhoto}>
                      <Text style={profileStyles.smallButtonText}>Choose photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>

              {/* Contact info */}
              <GlassCard>
                <Text style={profileStyles.cardTitle}>Contact Info</Text>

                <Text style={text.label}>Phone Number</Text>
                <TextField
                  style={profileStyles.compactInput}
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />

                <Text style={text.label}>Email</Text>
                <TextField
                  style={[profileStyles.compactInput, { marginBottom: 4 }]}
                  placeholder="Email"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={profileStyles.fieldError}>{contactError || ' '}</Text>
              </GlassCard>

              {/* Smartphone + bank details */}
              <GlassCard>
                <Text style={profileStyles.cardTitle}>Smartphone & Payment</Text>

                <Text style={text.label}>Do you have a smartphone?</Text>
                <ChoiceChips options={SMARTPHONE_OPTIONS} value={hasSmartphone} onChange={setHasSmartphone} />

                <Text style={text.label}>Bank details (for payment)</Text>
                {editingBank ? (
                  <>
                    <TextField
                      style={profileStyles.compactInput}
                      placeholder="IBAN, e.g. IE29 AIBK 9311 5212 3456 78"
                      value={ibanInput}
                      onChangeText={setIbanInput}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    <TextField
                      style={profileStyles.compactInput}
                      placeholder="BIC, e.g. AIBKIE2D"
                      value={bicInput}
                      onChangeText={setBicInput}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    <TextField
                      style={profileStyles.compactInput}
                      placeholder="Account holder name"
                      value={accountNameInput}
                      onChangeText={setAccountNameInput}
                      autoCapitalize="words"
                      autoCorrect={false}
                      maxLength={70}
                    />
                    <Text style={profileStyles.note}>
                      Exactly as it appears on your bank account (for example a joint account). Usually just your name.
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingBank(false);
                        setIbanInput('');
                        setBicInput('');
                      }}
                    >
                      <Text style={profileStyles.linkText}>Cancel bank changes</Text>
                    </TouchableOpacity>
                  </>
                ) : removeBank ? (
                  <>
                    <Text style={profileStyles.value}>Your bank details will be removed when you save.</Text>
                    <TouchableOpacity onPress={() => setRemoveBank(false)}>
                      <Text style={profileStyles.linkText}>Undo</Text>
                    </TouchableOpacity>
                  </>
                ) : bankDetails ? (
                  <>
                    <Text style={profileStyles.value}>
                      {bankDetails.ibanMasked} · {bankDetails.bic}
                    </Text>
                    {bankDetails.accountHolderName ? (
                      <Text style={profileStyles.note}>Account name: {bankDetails.accountHolderName}</Text>
                    ) : (
                      <Text style={profileStyles.fieldError}>Please add the account holder name: tap Change.</Text>
                    )}
                    <View style={profileStyles.linkRow}>
                      <TouchableOpacity
                        onPress={() => {
                          // Pre-fill with their saved account name, or their own name
                          setAccountNameInput(bankDetails?.accountHolderName || name);
                          setEditingBank(true);
                        }}
                      >
                        <Text style={profileStyles.linkText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setRemoveBank(true)}>
                        <Text style={profileStyles.removeLinkText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      // Pre-fill the account name with their own name
                      setAccountNameInput(name);
                      setEditingBank(true);
                    }}
                  >
                    <Text style={profileStyles.linkText}>+ Add bank details</Text>
                  </TouchableOpacity>
                )}
                <Text style={profileStyles.fieldError}>{bankError || ' '}</Text>
              </GlassCard>

              {message ? <Text style={profileStyles.messageText}>{message}</Text> : null}

              <GoldButton title="Save" loadingTitle="Uploading..." loading={uploadingPhoto} onPress={onSave} />
              <GhostButton title="Cancel" onPress={onCancelEdit} style={profileStyles.ghostButton} />
            </>
          )}
        </ScreenBackground>

        <SavedPopup visible={showSavedPopup} />
      </View>
    );
  }

  // ---------- VIEW MODE ----------
  return (
    <View style={profileStyles.fill}>
      <ScreenBackground>
        <View style={profileStyles.topRow}>
          <Text style={[text.title, { marginBottom: 0 }]}>My Profile</Text>
          <View style={profileStyles.badge}>
            <View style={profileStyles.badgeInner} />
          </View>
        </View>

        {deletionRequestStatus === 'PENDING' && (
          <View style={profileStyles.banner}>
            <Text style={profileStyles.bannerText}>Account deletion requested — awaiting admin approval.</Text>
          </View>
        )}

        <GlassCard>
          <InfoField
            label="Productions"
            value={myProductionNames.filter((n) => !pendingProductionNames.includes(n)).join(', ') || 'Not set'}
          />
          {pendingProductionNames.length > 0 && (
            <InfoField label="Pending approval" value={pendingProductionNames.join(', ')} />
          )}
          <InfoField label="Gender" value={gender || 'Not set'} />
          <InfoField
            label="Date of birth"
            value={dateOfBirth ? `${formatToDDMMYYYY(dateOfBirth)} (age ${age})` : 'Not set'}
          />
          <InfoField label="Height (cm)" value={heightCm || 'Not set'} />
          <InfoField label="Skills" value={allSkills.length > 0 ? allSkills.join(', ') : 'Not set'} />
          <InfoField label="Languages" value={allLanguages.length > 0 ? allLanguages.join(', ') : 'Not set'} />
          <InfoField
            label="Availability"
            value={allAvailability.length > 0 ? allAvailability.join(', ') : 'Not set'}
            last
          />
        </GlassCard>

        <GlassCard>
          <Text style={profileStyles.cardTitle}>Photos</Text>
          <View style={profileStyles.photoRow}>
            <View>
              <Text style={profileStyles.label}>Face photo</Text>
              <PhotoPreview uri={facePhotoUrl || null} width={140} height={210} />
            </View>
            <View>
              <Text style={profileStyles.label}>Full-body photo</Text>
              <PhotoPreview uri={fullBodyPhotoUrl || null} width={140} height={210} />
            </View>
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={profileStyles.cardTitle}>Contact Info</Text>
          <InfoField label="Phone" value={phoneNumber || 'Not set'} />
          <InfoField label="Email" value={contactEmail || 'Not set'} last />
        </GlassCard>

        <GlassCard>
          <Text style={profileStyles.cardTitle}>Smartphone & Payment</Text>
          <InfoField label="Smartphone" value={hasSmartphone ? 'Yes' : 'No'} />
          <InfoField
            label="Bank details"
            value={
              bankDetails
                ? `${bankDetails.ibanMasked} · ${bankDetails.bic}${
                    bankDetails.accountHolderName ? ` · ${bankDetails.accountHolderName}` : ''
                  }`
                : 'Not added'
            }
            last
          />
        </GlassCard>

        {message ? <Text style={profileStyles.messageText}>{message}</Text> : null}

        <GoldButton title="Edit" onPress={() => setIsEditingProfile(true)} />
        <GhostButton title="Back" onPress={onBack} style={profileStyles.ghostButton} />
      </ScreenBackground>

      <SavedPopup visible={showSavedPopup} />
    </View>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const profileStyles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textSoft,
  },
  banner: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 10,
  },
  field: {
    marginBottom: 10,
  },
  // Label above a value in view mode (sits closer than text.label)
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: colors.text,
  },
  messageText: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  ghostButton: {
    marginTop: 0,
  },
  // Slightly smaller than the normal TextField
  compactInput: {
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  // Looks like an input, but tapping it opens the date picker
  fieldBox: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  fieldBoxText: {
    color: colors.text,
    fontSize: 14,
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    minHeight: 16,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  photoPlaceholder: {
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  smallButton: {
    borderWidth: 1,
    borderColor: colors.ghostBorder,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  smallButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  chipText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.onGold,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 6,
  },
  linkText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  removeLinkText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
});

export default ProfileScreen;