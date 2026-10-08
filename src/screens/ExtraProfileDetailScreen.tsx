import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import * as profilesApi from '../api/profilesApi';
import { errorMessage } from '../api/client';
import { ExtraProfileDetail, Tally, BankDetails } from '../types';
import ScreenBackground from '../components/ScreenBackground';
import GlassCard from '../components/GlassCard';
import GhostButton from '../components/GhostButton';
import DetailRow from '../components/DetailRow';
import ActivityCard from '../components/ActivityCard';
import { colors, text } from '../theme';

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
      setBank(await profilesApi.getBankDetails(profile.id));
    } catch (error) {
      setBankError(errorMessage(error, 'Could not load bank details.'));
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <Text style={text.title}>Extra Profile</Text>

      {loading ? (
        <Text style={text.message}>Loading...</Text>
      ) : profile ? (
        <>
          {profile.deletionRequestStatus === 'PENDING' ? (
            <View style={detailStyles.pendingBanner}>
              <Text style={detailStyles.pendingText}>Account deletion requested — awaiting approval.</Text>
            </View>
          ) : null}

          <GlassCard>
            <DetailRow label="Name">{profile.name}</DetailRow>
            <DetailRow label="Productions">
              {profile.productions?.length ? profile.productions.map((p) => p.name).join(', ') : 'Not set'}
            </DetailRow>
            <DetailRow label="Gender">{profile.gender || 'Not set'}</DetailRow>
            <DetailRow label="Age">{profile.age ?? 'Not set'}</DetailRow>
            <DetailRow label="Height (cm)">{profile.heightCm ?? 'Not set'}</DetailRow>
            <DetailRow label="Skills">{profile.skills.length > 0 ? profile.skills.join(', ') : 'Not set'}</DetailRow>
            <DetailRow label="Languages">
              {profile.languages.length > 0 ? profile.languages.join(', ') : 'Not set'}
            </DetailRow>
            <DetailRow label="Availability">
              {profile.availability.length > 0 ? profile.availability.join(', ') : 'Not set'}
            </DetailRow>

            <View style={detailStyles.photoRow}>
              <View>
                <Text style={text.label}>Face photo</Text>
                <PhotoPreview uri={profile.facePhotoUrl} width={140} height={210} />
              </View>
              <View>
                <Text style={text.label}>Full-body photo</Text>
                <PhotoPreview uri={profile.fullBodyPhotoUrl} width={140} height={210} />
              </View>
            </View>

            <Text style={text.sectionHeading}>Contact Info</Text>
            <DetailRow label="Phone">{profile.phoneNumber || 'Not set'}</DetailRow>
            <DetailRow label="Email" style={detailStyles.lastRow}>
              {profile.contactEmail || 'Not set'}
            </DetailRow>
          </GlassCard>

          {tally ? (
            <ActivityCard title="Activity" tally={tally}>
              {tally.threeStrikes ? (
                <Text style={detailStyles.strikesWarning}>⚠ 3+ cancellations or no-shows in the last 90 days</Text>
              ) : null}
            </ActivityCard>
          ) : null}

          {/* Smartphone + bank details */}
          <GlassCard>
            <Text style={detailStyles.widgetTitle}>Smartphone & Payment</Text>

            <DetailRow label="Smartphone">{profile.hasSmartphone ? 'Yes' : 'No'}</DetailRow>

            <Text style={detailStyles.bankLabel}>Bank details</Text>
            {!profile.hasBankDetails ? (
              <Text style={detailStyles.plainRow}>Not added yet</Text>
            ) : bank ? (
              <>
                <DetailRow label="IBAN">{bank.iban}</DetailRow>
                <DetailRow label="BIC">{bank.bic}</DetailRow>
                <DetailRow label="Account name">{bank.accountHolderName}</DetailRow>
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
                <Text style={detailStyles.revealButtonText}>{bankLoading ? 'Loading...' : 'Show bank details'}</Text>
              </TouchableOpacity>
            )}
            {bankError ? <Text style={detailStyles.errorMessage}>{bankError}</Text> : null}
          </GlassCard>
        </>
      ) : (
        <Text style={text.message}>Profile not found.</Text>
      )}

      {message ? <Text style={detailStyles.errorMessage}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const detailStyles = StyleSheet.create({
  errorMessage: {
    fontSize: 13,
    color: colors.error,
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
    color: colors.error,
    textAlign: 'center',
  },
  lastRow: {
    marginBottom: 0,
  },
  plainRow: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
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
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  widgetTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  strikesWarning: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
    textAlign: 'center',
    marginTop: 12,
  },
  revealButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  revealButtonText: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 14,
  },
  linkText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default ExtraProfileDetailScreen;