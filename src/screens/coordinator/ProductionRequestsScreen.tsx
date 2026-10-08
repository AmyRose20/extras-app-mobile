import React from 'react';
import { Text, TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import { ProductionRequestSummary, DialogConfig } from '../../types';
import { formatToDDMMYYYY } from '../../dateUtils';
import ScreenBackground from '../../components/ScreenBackground';
import GlassCard from '../../components/GlassCard';
import GhostButton from '../../components/GhostButton';
import DetailRow from '../../components/DetailRow';
import { colors, text } from '../../theme';

type Props = {
  productionName: string | null; // the coordinator's production, used in the dialog text
  requests: ProductionRequestSummary[];
  loading: boolean;
  message: string;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
  onBack: () => void;
  showDialog: (config: DialogConfig) => void; // opens the app-wide confirmation dialog
};

function ProductionRequestsScreen({
  productionName,
  requests,
  loading,
  message,
  onApprove,
  onDeny,
  onBack,
  showDialog,
}: Props) {
  const production = productionName ?? 'your production';

  const confirmApprove = (request: ProductionRequestSummary) => {
    showDialog({
      title: 'Approve Request?',
      message: `${request.name} will be added to ${production} and can be matched and invited to call requests.`,
      confirmText: 'Approve',
      onConfirm: () => onApprove(request.id),
    });
  };

  const confirmDeny = (request: ProductionRequestSummary) => {
    showDialog({
      title: 'Deny Request?',
      message: `${request.name} won't be added to ${production}. They can ask again in 30 days.`,
      confirmText: 'Deny',
      destructive: true,
      onConfirm: () => onDeny(request.id),
    });
  };

  // "34 · Female · 171 cm" (skips anything not set)
  const summaryLine = (r: ProductionRequestSummary) =>
    [
      r.age != null ? `${r.age}` : null,
      r.gender ? (r.gender === 'MALE' ? 'Male' : 'Female') : null,
      r.heightCm ? `${r.heightCm} cm` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <ScreenBackground>
      <Text style={[text.title, requestStyles.title]}>Production Requests</Text>
      <Text style={requestStyles.subtitle}>Extras asking to join {production}</Text>

      {loading ? (
        <Text style={text.message}>Loading...</Text>
      ) : requests.length === 0 ? (
        <Text style={text.message}>No pending requests.</Text>
      ) : (
        requests.map((request) => (
          <GlassCard key={request.id} style={requestStyles.card}>
            <View style={requestStyles.headerRow}>
              {request.facePhotoUrl ? (
                <Image source={{ uri: request.facePhotoUrl }} style={requestStyles.photo} />
              ) : (
                <View style={[requestStyles.photo, requestStyles.photoPlaceholder]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={requestStyles.name}>{request.name}</Text>
                <Text style={requestStyles.summary}>{summaryLine(request)}</Text>
              </View>
            </View>

            <DetailRow label="Skills">{request.skills.length > 0 ? request.skills.join(', ') : 'Not set'}</DetailRow>
            <DetailRow label="Languages">
              {request.languages.length > 0 ? request.languages.join(', ') : 'Not set'}
            </DetailRow>
            <DetailRow label="Already on">
              {request.currentProductions.length > 0 ? request.currentProductions.join(', ') : 'None'}
            </DetailRow>
            <DetailRow label="Requested">{formatToDDMMYYYY(request.requestedAt)}</DetailRow>

            <View style={requestStyles.buttonRow}>
              <TouchableOpacity
                style={[requestStyles.smallButton, requestStyles.approveButton]}
                onPress={() => confirmApprove(request)}
              >
                <Text style={requestStyles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[requestStyles.smallButton, requestStyles.denyButton]}
                onPress={() => confirmDeny(request)}
              >
                <Text style={requestStyles.denyButtonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))
      )}

      {message ? <Text style={text.message}>{message}</Text> : null}

      <GhostButton title="Back" onPress={onBack} />
    </ScreenBackground>
  );
}

// Only what's special to this screen; everything else comes from theme.ts and the shared components
const requestStyles = StyleSheet.create({
  title: {
    marginBottom: 4, // the subtitle sits close underneath
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  card: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summary: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  smallButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#8fd9a8',
  },
  approveButtonText: {
    color: colors.onGold,
    fontWeight: '700',
    fontSize: 13,
  },
  denyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  denyButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ProductionRequestsScreen;