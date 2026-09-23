import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, Image, View, Alert } from 'react-native';
import { styles, colors } from '../styles';
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
  onRequestDeletion: () => void;
};

function ExtraProfileDetailScreen({ profile, loading, message, onBack, tally, onRequestDeletion }: Props) {
  const handleRequestDeletionPress = () => {
    if (!profile) return;
    Alert.alert(
      'Request Account Deletion?',
      `This sends a deletion request for ${profile.name}'s account to be reviewed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Deletion', style: 'destructive', onPress: onRequestDeletion },
      ]
    );
  };

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
              <Text style={styles.widgetTitle}>Activity</Text>
              <View style={styles.statsRow}>
                <View style={styles.statColumn}>
                  <Text style={styles.statNumber}>{tally.worked}</Text>
                  <Text style={styles.cardDetail}>Worked</Text>
                </View>
                <View style={styles.statColumn}>
                  <Text style={styles.statNumber}>{tally.declined}</Text>
                  <Text style={styles.cardDetail}>Declined</Text>
                </View>
                <View style={styles.statColumn}>
                  <Text style={styles.statNumber}>{tally.cancelled}</Text>
                  <Text style={styles.cardDetail}>Cancelled</Text>
                </View>
              </View>

              {tally.threeStrikes ? (
                <Text style={styles.strikesWarning}>⚠ 3+ cancellations in the last 90 days</Text>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.card, styles.buttonSpacing]}>
            <Text style={styles.widgetTitle}>Account</Text>
            {profile.deletionRequestStatus === 'PENDING' ? (
              <Text style={[styles.cardDetail, { color: colors.error, textAlign: 'center' }]}>
                Account deletion already requested — awaiting approval.
              </Text>
            ) : (
              <>
                <Text style={styles.cardDetail}>Deleting this account will prevent the extra from logging in.
                </Text>
                  <TouchableOpacity
                  style={{
                    backgroundColor: colors.error,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignSelf: 'center',
                    marginTop: 8,
                  }}
                  onPress={handleRequestDeletionPress}
                  >
                  <Text style={[styles.buttonText, { fontSize: 14 }]}>Request Account Deletion</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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