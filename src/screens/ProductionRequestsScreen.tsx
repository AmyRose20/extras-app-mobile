import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ProductionRequestSummary, DialogConfig } from '../types';
import { formatToDDMMYYYY } from '../dateUtils';

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
    <LinearGradient
      colors={['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e']}
      locations={[0, 0.28, 0.52, 0.68, 0.9, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={requestStyles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={requestStyles.scrollContent}>
          <Text style={requestStyles.title}>Production Requests</Text>
          <Text style={requestStyles.subtitle}>Extras asking to join {production}</Text>

          {loading ? (
            <Text style={requestStyles.message}>Loading...</Text>
          ) : requests.length === 0 ? (
            <Text style={requestStyles.message}>No pending requests.</Text>
          ) : (
            requests.map((request) => (
              <View key={request.id} style={requestStyles.card}>
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

                <Text style={requestStyles.detailRow}>
                  <Text style={requestStyles.fieldLabelInline}>Skills: </Text>
                  {request.skills.length > 0 ? request.skills.join(', ') : 'Not set'}
                </Text>
                <Text style={requestStyles.detailRow}>
                  <Text style={requestStyles.fieldLabelInline}>Languages: </Text>
                  {request.languages.length > 0 ? request.languages.join(', ') : 'Not set'}
                </Text>
                <Text style={requestStyles.detailRow}>
                  <Text style={requestStyles.fieldLabelInline}>Already on: </Text>
                  {request.currentProductions.length > 0 ? request.currentProductions.join(', ') : 'None'}
                </Text>
                <Text style={requestStyles.detailRow}>
                  <Text style={requestStyles.fieldLabelInline}>Requested: </Text>
                  {formatToDDMMYYYY(request.requestedAt)}
                </Text>

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
              </View>
            ))
          )}

          {message ? <Text style={requestStyles.message}>{message}</Text> : null}

          <TouchableOpacity style={requestStyles.buttonGhost} onPress={onBack}>
            <Text style={requestStyles.buttonGhostText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const requestStyles = StyleSheet.create({
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(12,10,22,0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
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
    borderColor: 'rgba(255,255,255,0.2)',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  summary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
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
    color: '#1a1330',
    fontWeight: '700',
    fontSize: 13,
  },
  denyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  denyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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

export default ProductionRequestsScreen;