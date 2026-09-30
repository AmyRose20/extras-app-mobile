import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../api';
import { ExtraProfileDetail, Tally, BankDetails } from '../types';

function PhotoPreview({ uri, width, height }: { uri: string | null; width: number; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width, height, borderRadius: 8 }} />;
  }
  return (
    <View style={[detailStyles.photoPlaceholder, { width, height }]}>
      <Text style={detailStyles.photoPlaceholderText}>No photo</Text>
    </View>
  );
}

type Props = {
  token: string;
  profile: ExtraProfileDetail | null;
  loading: boolean;
  message: string;
  onBack: () => void;
  tally: Tally | null;
};

// Admin's view of one extra. Actions (remove from production, request
// deletion) live in the hamburger menu, set up in App.tsx.
function ExtraProfileDetailScreen({ token, profile, loading, message, onBack, tally }: Props) {
    // Bank details are only fetched when the coordinator taps "Show bank details"
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');

  // Hide them again whenever a different extra is opened
  useEffect(() => {
    setBank(null);
    setBankError('');
  }, [profile?.id]);

  const showBankDetails = async () => {
    if (!profile) return;
    setBankLoading(true);
    setBankError('');
    try {
      const response = await fetch(`${API_URL}/profiles/${profile.id}/bank-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setBankError(data.error || 'Could not load bank details.');
        return;
      }
      setBank(data);
    } catch (error) {
      setBankError('Could not load bank details.');
    } finally {
      setBankLoading(false);
    }
  };
  return (
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={detailStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={detailStyles.scrollContent}>
          <Text style={detailStyles.title}>Extra Profile</Text>

          {loading ? (
            <Text style={detailStyles.message}>Loading...</Text>
          ) : profile ? (
            <>
              {profile.deletionRequestStatus === 'PENDING' ? (
                <View style={detailStyles.pendingBanner}>
                  <Text style={detailStyles.pendingText}>
                    Account deletion requested — awaiting approval.
                  </Text>
                </View>
              ) : null}

              <View style={detailStyles.card}>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Name: </Text>
                  {profile.name}
                </Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Productions: </Text>
                  {profile.productions?.length ? profile.productions.map((p) => p.name).join(', ') : 'Not set'}
                </Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Gender: </Text>
                  {profile.gender || 'Not set'}
                </Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Age: </Text>
                  {profile.age ?? 'Not set'}
                </Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Height (cm): </Text>
                  {profile.heightCm ?? 'Not set'}
                </Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Skills: </Text>
                  {profile.skills.length > 0 ? profile.skills.join(', ') : 'Not set'}
                </Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Languages: </Text>
                  {profile.languages.length > 0 ? profile.languages.join(', ') : 'Not set'}
                </Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Availability: </Text>
                  {profile.availability.length > 0 ? profile.availability.join(', ') : 'Not set'}
                </Text>

                <View style={detailStyles.photoRow}>
                  <View>
                    <Text style={detailStyles.fieldLabel}>Face photo</Text>
                    <PhotoPreview uri={profile.facePhotoUrl} width={140} height={140} />
                  </View>
                  <View>
                    <Text style={detailStyles.fieldLabel}>Full-body photo</Text>
                    <PhotoPreview uri={profile.fullBodyPhotoUrl} width={140} height={140} />
                  </View>
                </View>

                <Text style={detailStyles.sectionHeading}>Contact Info</Text>
                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Phone: </Text>
                  {profile.phoneNumber || 'Not set'}
                </Text>
                <Text style={[detailStyles.detailRow, { marginBottom: 0 }]}>
                  <Text style={detailStyles.fieldLabelInline}>Email: </Text>
                  {profile.contactEmail || 'Not set'}
                </Text>
              </View>

              {tally ? (
                <View style={detailStyles.card}>
                  <Text style={detailStyles.widgetTitle}>Activity</Text>
                  <View style={detailStyles.statsRow}>
                    <View style={detailStyles.statColumn}>
                      <Text style={detailStyles.statNumber}>{tally.worked}</Text>
                      <Text style={detailStyles.statLabel}>Worked</Text>
                    </View>
                    <View style={detailStyles.statColumn}>
                      <Text style={detailStyles.statNumber}>{tally.declined}</Text>
                      <Text style={detailStyles.statLabel}>Declined</Text>
                    </View>
                    <View style={detailStyles.statColumn}>
                      <Text style={detailStyles.statNumber}>{tally.cancelled}</Text>
                      <Text style={detailStyles.statLabel}>Cancelled</Text>
                    </View>
                  </View>

                  {tally.threeStrikes ? (
                    <Text style={detailStyles.strikesWarning}>⚠ 3+ cancellations in the last 90 days</Text>
                  ) : null}
                </View>
              ) : null}
              
              {/* Smartphone + bank details */}
              <View style={detailStyles.card}>
                <Text style={detailStyles.widgetTitle}>Smartphone & Payment</Text>

                <Text style={detailStyles.detailRow}>
                  <Text style={detailStyles.fieldLabelInline}>Smartphone: </Text>
                  {profile.hasSmartphone ? 'Yes' : 'No'}
                </Text>

                <Text style={[detailStyles.fieldLabelInline, { marginBottom: 6 }]}>Bank details</Text>
                {!profile.hasBankDetails ? (
                  <Text style={detailStyles.detailRow}>Not added yet</Text>
                ) : bank ? (
                  <>
                    <Text style={detailStyles.detailRow}>
                      <Text style={detailStyles.fieldLabelInline}>IBAN: </Text>
                      {bank.iban}
                    </Text>
                    <Text style={detailStyles.detailRow}>
                      <Text style={detailStyles.fieldLabelInline}>BIC: </Text>
                      {bank.bic}
                    </Text>
                    <TouchableOpacity onPress={() => setBank(null)}>
                      <Text style={detailStyles.linkText}>Hide</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[detailStyles.revealButton, bankLoading && { opacity: 0.6 }]}
                    onPress={showBankDetails}
                    disabled={bankLoading}
                  >
                    <Text style={detailStyles.revealButtonText}>
                      {bankLoading ? 'Loading...' : 'Show bank details'}
                    </Text>
                  </TouchableOpacity>
                )}
                {bankError ? <Text style={detailStyles.errorMessage}>{bankError}</Text> : null}
              </View>
            </>
          ) : (
            <Text style={detailStyles.message}>Profile not found.</Text>
          )}

          {message ? <Text style={detailStyles.errorMessage}>{message}</Text> : null}

          <TouchableOpacity style={detailStyles.buttonGhost} onPress={onBack}>
            <Text style={detailStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 13,
    color: '#ff9d9d',
    textAlign: 'center',
    marginBottom: 12,
  },
  pendingBanner: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  pendingText: {
    fontSize: 13,
    color: '#ff9d9d',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  fieldLabelInline: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  photoPlaceholder: {
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 10,
  },
  widgetTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
  },
  strikesWarning: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff9d9d',
    textAlign: 'center',
    marginTop: 12,
  },
    revealButton: {
    borderWidth: 1,
    borderColor: '#d99c4a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  revealButtonText: {
    color: '#d99c4a',
    fontWeight: '700',
    fontSize: 14,
  },
  linkText: {
    color: '#d99c4a',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ExtraProfileDetailScreen;