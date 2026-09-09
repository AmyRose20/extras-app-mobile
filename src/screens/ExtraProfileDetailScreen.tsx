import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, Image, View } from 'react-native';
import { styles, colors, spacing } from '../styles';
import { ExtraProfileDetail, Tally } from '../types';

function PhotoPreview({ uri, width, height }: { uri: string | null; width: number; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.photoImage, { width, height }]} />;
  }
  return (
    <View style={[styles.photoPlaceholder, { width, height }]}>
      <Text style={styles.cardDetail}>No photo</Text>
    </View>
  );
}

type Props = {
  profile: ExtraProfileDetail | null;
  loading: boolean;
  message: string;
  onBack: () => void;
  tally: Tally | null;
};

function ExtraProfileDetailScreen({ profile, loading, message, onBack, tally }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Extra Profile</Text>

        {loading ? (
          <Text style={styles.message}>Loading...</Text>
        ) : profile ? (
          <>
          <View style={styles.card}>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Name: </Text>{profile.name}</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Gender: </Text>{profile.gender || 'Not set'}</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Age: </Text>{profile.age ?? 'Not set'}</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Height (cm): </Text>{profile.heightCm ?? 'Not set'}</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Skills: </Text>{profile.skills.length > 0 ? profile.skills.join(', ') : 'Not set'}</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Languages: </Text>{profile.languages.length > 0 ? profile.languages.join(', ') : 'Not set'}</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Availability: </Text>{profile.availability.length > 0 ? profile.availability.join(', ') : 'Not set'}</Text>

            <View style={[styles.row, styles.buttonSpacing]}>
              <View>
                <Text style={styles.fieldLabel}>Face photo</Text>
                <PhotoPreview uri={profile.facePhotoUrl} width={140} height={140} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Full-body photo</Text>
                <PhotoPreview uri={profile.fullBodyPhotoUrl} width={140} height={140} />
              </View>
            </View>

            <Text style={styles.sectionHeading}>Contact Info</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Phone: </Text>{profile.phoneNumber || 'Not set'}</Text>
            <Text style={styles.detailRow}><Text style={styles.fieldLabel}>Email: </Text>{profile.contactEmail || 'Not set'}</Text>
          </View>

          {tally ? (
            <View style={[styles.card, styles.buttonSpacing]}>
              <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Activity</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{tally.worked}</Text>
                  <Text style={styles.cardDetail}>Worked</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{tally.declined}</Text>
                  <Text style={styles.cardDetail}>Declined</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{tally.cancelled}</Text>
                  <Text style={styles.cardDetail}>Cancelled</Text>
                </View>
              </View>

              {tally.threeStrikes ? (
                <Text style={{ color: colors.error, fontWeight: '600', marginTop: spacing.sm, textAlign: 'center' }}>
                  ⚠ 3+ cancellations in the last 90 days
                </Text>
              ) : null}
            </View>
          ) : null}
          </>
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