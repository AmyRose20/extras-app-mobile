import React from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../styles';
import { SKILL_OPTIONS, LANGUAGE_OPTIONS, AVAILABILITY_OPTIONS } from '../constants';
import ChipMultiSelect from '../components/ChipMultiSelect';

type Props = {
  name: string;
  age: string;
  setAge: (value: string) => void;
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
};

function PhotoPreview({
  uri,
  width,
  height,
  dark = false,
}: {
  uri: string | null;
  width: number;
  height: number;
  dark?: boolean;
}) {
  if (uri) {
    return <Image source={{ uri }} style={{ width, height, borderRadius: 8 }} />;
  }
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 8,
        backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#eee',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={dark ? { color: 'rgba(255,255,255,0.6)', fontSize: 13 } : styles.message}>No photo</Text>
    </View>
  );
}

function ProfileScreen({
  name,
  age,
  setAge,
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
}: Props) {
  const allSkills = [...skills, ...otherSkills.split(',').map((s) => s.trim()).filter(Boolean)];
  const allLanguages = [...languages, ...otherLanguages.split(',').map((l) => l.trim()).filter(Boolean)];
  const allAvailability = [...availability, ...otherAvailability.split(',').map((a) => a.trim()).filter(Boolean)];

  // EDIT MODE (and loading) — unchanged, uses your existing shared styles.
  if (loading || isEditingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>{isEditingProfile ? 'Edit My Profile' : 'My Profile'}</Text>

          {loading ? (
            <Text style={styles.message}>Loading...</Text>
          ) : (
            <>
              <Text style={styles.message}>Name: {name}</Text>

              <Text style={styles.fieldLabel}>Gender</Text>
              <Picker selectedValue={gender} onValueChange={(value) => setGender(value)} style={{ marginBottom: 16 }}>
                <Picker.Item label="Select gender..." value="" />
                <Picker.Item label="Male" value="MALE" />
                <Picker.Item label="Female" value="FEMALE" />
              </Picker>

              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="Height (cm)"
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
              />

              <ChipMultiSelect
                label="Skills"
                options={SKILL_OPTIONS}
                selected={skills}
                onToggle={onToggleSkill}
                otherText={otherSkills}
                onOtherTextChange={setOtherSkills}
              />

              <ChipMultiSelect
                label="Languages"
                options={LANGUAGE_OPTIONS}
                selected={languages}
                onToggle={onToggleLanguage}
                otherText={otherLanguages}
                onOtherTextChange={setOtherLanguages}
              />

              <ChipMultiSelect
                label="Availability"
                options={AVAILABILITY_OPTIONS}
                selected={availability}
                onToggle={onToggleAvailability}
                otherText={otherAvailability}
                onOtherTextChange={setOtherAvailability}
              />

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View>
                  <PhotoPreview uri={pendingFacePhoto || facePhotoUrl || null} width={140} height={140} />
                  <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onPickFacePhoto}>
                    <Text style={styles.buttonText}>Choose Face Photo</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  <PhotoPreview uri={pendingFullBodyPhoto || fullBodyPhotoUrl || null} width={140} height={140} />
                  <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onPickFullBodyPhoto}>
                    <Text style={styles.buttonText}>Choose Full-Body Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.message, styles.buttonSpacing, { fontWeight: 'bold' }]}>Contact Info</Text>

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={[styles.message, { color: '#DC2626', minHeight: 20 }]}>{contactError || ' '}</Text>

              <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onSave} disabled={uploadingPhoto}>
                <Text style={styles.buttonText}>{uploadingPhoto ? 'Uploading...' : 'Save'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onCancelEdit}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>

        {showSavedPopup && (
          <View style={styles.savedPopup}>
            <Text style={styles.savedPopupText}>Saved!</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // VIEW MODE — new dusk theme, now with the real gradient background.
  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={profileStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={profileStyles.scrollContent}>
          <View style={profileStyles.topRow}>
            <Text style={profileStyles.title}>My Profile</Text>
            <View style={profileStyles.badge}>
              <View style={profileStyles.badgeInner} />
            </View>
          </View>

          {deletionRequestStatus === 'PENDING' && (
            <View style={profileStyles.banner}>
              <Text style={profileStyles.bannerText}>
                Account deletion requested — awaiting admin approval.
              </Text>
            </View>
          )}

          <View style={profileStyles.card}>
            <View style={profileStyles.field}>
              <Text style={profileStyles.label}>Name</Text>
              <Text style={profileStyles.value}>{name}</Text>
            </View>
            <View style={profileStyles.field}>
              <Text style={profileStyles.label}>Gender</Text>
              <Text style={profileStyles.value}>{gender || 'Not set'}</Text>
            </View>
            <View style={profileStyles.field}>
              <Text style={profileStyles.label}>Age</Text>
              <Text style={profileStyles.value}>{age || 'Not set'}</Text>
            </View>
            <View style={profileStyles.field}>
              <Text style={profileStyles.label}>Height (cm)</Text>
              <Text style={profileStyles.value}>{heightCm || 'Not set'}</Text>
            </View>
            <View style={profileStyles.field}>
              <Text style={profileStyles.label}>Skills</Text>
              <Text style={profileStyles.value}>{allSkills.length > 0 ? allSkills.join(', ') : 'Not set'}</Text>
            </View>
            <View style={profileStyles.field}>
              <Text style={profileStyles.label}>Languages</Text>
              <Text style={profileStyles.value}>{allLanguages.length > 0 ? allLanguages.join(', ') : 'Not set'}</Text>
            </View>
            <View style={[profileStyles.field, { marginBottom: 0 }]}>
              <Text style={profileStyles.label}>Availability</Text>
              <Text style={profileStyles.value}>{allAvailability.length > 0 ? allAvailability.join(', ') : 'Not set'}</Text>
            </View>
          </View>

          <View style={profileStyles.card}>
            <Text style={profileStyles.cardTitle}>Photos</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View>
                <Text style={profileStyles.label}>Face photo</Text>
                <PhotoPreview uri={facePhotoUrl || null} width={140} height={140} dark />
              </View>
              <View>
                <Text style={profileStyles.label}>Full-body photo</Text>
                <PhotoPreview uri={fullBodyPhotoUrl || null} width={140} height={140} dark />
              </View>
            </View>
          </View>

          <View style={profileStyles.card}>
            <Text style={profileStyles.cardTitle}>Contact Info</Text>
            <View style={profileStyles.field}>
              <Text style={profileStyles.label}>Phone</Text>
              <Text style={profileStyles.value}>{phoneNumber || 'Not set'}</Text>
            </View>
            <View style={[profileStyles.field, { marginBottom: 0 }]}>
              <Text style={profileStyles.label}>Email</Text>
              <Text style={profileStyles.value}>{contactEmail || 'Not set'}</Text>
            </View>
          </View>

          {message ? <Text style={profileStyles.messageText}>{message}</Text> : null}

          <TouchableOpacity style={profileStyles.button} onPress={() => setIsEditingProfile(true)}>
            <Text style={profileStyles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.buttonGhost} onPress={onBack}>
            <Text style={profileStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>

        {showSavedPopup && (
          <View style={profileStyles.savedPopup}>
            <Text style={profileStyles.savedPopupText}>Saved!</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    borderColor: 'rgba(255,255,255,0.85)',
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
    color: '#ff9d9d',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 10,
  },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#fff',
  },
  messageText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
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
  savedPopup: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#d99c4a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  savedPopupText: {
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ProfileScreen;