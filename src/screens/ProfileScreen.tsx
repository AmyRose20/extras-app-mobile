import React from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, Image, View } from 'react-native';
import { styles } from '../styles';

type Props = {
  age: string;
  setAge: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  heightCm: string;
  setHeightCm: (value: string) => void;
  skills: string;
  setSkills: (value: string) => void;
  availability: string;
  setAvailability: (value: string) => void;
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
};

function PhotoPreview({ uri, width, height }: { uri: string | null; width: number; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width, height, borderRadius: 8, marginBottom: 8 }} />;
  }
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={styles.message}>No photo yet</Text>
    </View>
  );
}

function ProfileScreen({
  age,
  setAge,
  gender,
  setGender,
  heightCm,
  setHeightCm,
  skills,
  setSkills,
  availability,
  setAvailability,
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
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{isEditingProfile ? 'Edit My Profile' : 'My Profile'}</Text>

        {loading ? (
          <Text style={styles.message}>Loading...</Text>
        ) : isEditingProfile ? (
          <>
            <Text style={styles.message}>Face photo (required)</Text>
            <PhotoPreview uri={pendingFacePhoto || facePhotoUrl || null} width={150} height={150} />
            <TouchableOpacity style={styles.button} onPress={onPickFacePhoto}>
              <Text style={styles.buttonText}>Choose Face Photo</Text>
            </TouchableOpacity>

            <Text style={[styles.message, styles.buttonSpacing]}>Full-body photo (required)</Text>
            <PhotoPreview uri={pendingFullBodyPhoto || fullBodyPhotoUrl || null} width={150} height={200} />
            <TouchableOpacity style={styles.button} onPress={onPickFullBodyPhoto}>
              <Text style={styles.buttonText}>Choose Full-Body Photo</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.buttonSpacing]}
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

            <TouchableOpacity style={styles.button} onPress={onSave} disabled={uploadingPhoto}>
              <Text style={styles.buttonText}>{uploadingPhoto ? 'Uploading...' : 'Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onCancelEdit}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.message}>Face photo</Text>
            <PhotoPreview uri={facePhotoUrl || null} width={150} height={150} />

            <Text style={styles.message}>Full-body photo</Text>
            <PhotoPreview uri={fullBodyPhotoUrl || null} width={150} height={200} />

            <Text style={styles.message}>Age: {age || 'Not set'}</Text>
            <Text style={styles.message}>Gender: {gender || 'Not set'}</Text>
            <Text style={styles.message}>Height (cm): {heightCm || 'Not set'}</Text>
            <Text style={styles.message}>Skills: {skills || 'Not set'}</Text>
            <Text style={styles.message}>Availability: {availability || 'Not set'}</Text>

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
    </SafeAreaView>
  );
}

export default ProfileScreen;