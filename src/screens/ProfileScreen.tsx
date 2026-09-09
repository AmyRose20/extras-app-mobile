import React from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, Image, View } from 'react-native';
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
};

function PhotoPreview({ uri, width, height }: { uri: string | null; width: number; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width, height, borderRadius: 8 }} />;
  }
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 8,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={styles.message}>No photo</Text>
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
}: Props) {
  const allSkills = [...skills, ...otherSkills.split(',').map((s) => s.trim()).filter(Boolean)];
  const allLanguages = [...languages, ...otherLanguages.split(',').map((l) => l.trim()).filter(Boolean)];
  const allAvailability = [...availability, ...otherAvailability.split(',').map((a) => a.trim()).filter(Boolean)];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{isEditingProfile ? 'Edit My Profile' : 'My Profile'}</Text>

        {loading ? (
          <Text style={styles.message}>Loading...</Text>
        ) : isEditingProfile ? (
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
        ) : (
          <>
          <View style={styles.card}>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Name: </Text>{name}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Gender: </Text>{gender || 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Age: </Text>{age || 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Height (cm): </Text>{heightCm || 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Skills: </Text>{allSkills.length > 0 ? allSkills.join(', ') : 'Not set'}</Text>
            <Text style={styles.message}>
              <Text style={styles.fieldLabel}>Languages: </Text>{allLanguages.length > 0 ? allLanguages.join(', ') : 'Not set'}
            </Text>
            <Text style={styles.message}><Text style={[styles.fieldLabel, { fontSize: 16 }]}>Availability: </Text>{allAvailability.length > 0 ? allAvailability.join(', ') : 'Not set'}</Text>

          <View style={[{ flexDirection: 'row', gap: 16 }, styles.buttonSpacing]}>
            <View>
              <Text style={styles.fieldLabel}>Face photo</Text>
              <PhotoPreview uri={facePhotoUrl || null} width={140} height={140} />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Full-body photo</Text>
              <PhotoPreview uri={fullBodyPhotoUrl || null} width={140} height={140} />
            </View>
          </View>

  <Text style={[styles.message, styles.buttonSpacing, { fontWeight: 'bold' }]}>Contact Info</Text>
  <Text style={styles.message}><Text style={styles.fieldLabel}>Phone: </Text>{phoneNumber || 'Not set'}</Text>
  <Text style={styles.message}><Text style={styles.fieldLabel}>Email: </Text>{contactEmail || 'Not set'}</Text>
</View>

            <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={() => setIsEditingProfile(true)}>
              <Text style={styles.buttonText}>Edit</Text>
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

export default ProfileScreen;