import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, Image, View } from 'react-native';
import { styles } from '../styles';
import { ExtraProfileDetail } from '../types';

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

type Props = {
  profile: ExtraProfileDetail | null;
  loading: boolean;
  message: string;
  onBack: () => void;
};

function ExtraProfileDetailScreen({ profile, loading, message, onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Extra Profile</Text>

        {loading ? (
          <Text style={styles.message}>Loading...</Text>
        ) : profile ? (
          <View style={styles.card}>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Name: </Text>{profile.name}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Gender: </Text>{profile.gender || 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Age: </Text>{profile.age ?? 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Height (cm): </Text>{profile.heightCm ?? 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Skills: </Text>{profile.skills.length > 0 ? profile.skills.join(', ') : 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Languages: </Text>{profile.languages.length > 0 ? profile.languages.join(', ') : 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Availability: </Text>{profile.availability.length > 0 ? profile.availability.join(', ') : 'Not set'}</Text>

            <View style={[{ flexDirection: 'row', gap: 16 }, styles.buttonSpacing]}>
              <View>
                <Text style={styles.fieldLabel}>Face photo</Text>
                <PhotoPreview uri={profile.facePhotoUrl} width={140} height={140} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Full-body photo</Text>
                <PhotoPreview uri={profile.fullBodyPhotoUrl} width={140} height={140} />
              </View>
            </View>

            <Text style={[styles.message, styles.buttonSpacing, { fontWeight: 'bold' }]}>Contact Info</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Phone: </Text>{profile.phoneNumber || 'Not set'}</Text>
            <Text style={styles.message}><Text style={styles.fieldLabel}>Email: </Text>{profile.contactEmail || 'Not set'}</Text>
          </View>
        ) : (
          <Text style={styles.message}>Profile not found.</Text>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.buttonSpacing]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ExtraProfileDetailScreen;