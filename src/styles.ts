import { StyleSheet } from 'react-native';

// ----- Design tokens -----
// A small, consistent set of colors and spacing values used throughout
// the app so screens share one visual language instead of one-off values.
export const colors = {
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  background: '#FFFFFF',
  cardBackground: '#F9FAFB',
  error: '#DC2626',
  success: '#16A34A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// One shared style sheet, reused by every screen, so they all look
// consistent without copy-pasting the same styles into each file.
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'left',
  },

  // Label shown above an editable field (Age, Gender, Phone Number, etc.)
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonSpacing: {
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.primaryText,
  },

  // General-purpose text line (read-only profile view, status messages).
  message: {
    textAlign: 'left',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  cardButtonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  smallButton: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.error,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.sm,
    textDecorationLine: 'underline',
  },

  // Row of evenly-spaced stat columns (used in the Activity widgets).
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // Centered variant of cardTitle, used as the Activity widget's heading.
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  // 3-strikes warning line shown under the admin's Activity widget.
  strikesWarning: {
    color: colors.error,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  // Small blue underlined text link (e.g. "Edit" on a call request card).
  editLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.sm,
    textDecorationLine: 'underline',
  },

  savedPopup: {
    position: 'absolute',
    top: '45%',
    left: '20%',
    right: '20%',
    backgroundColor: 'rgba(31,41,55,0.92)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  savedPopupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
    // One label:value line in a read-only detail view (profile detail screen).
  detailRow: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },

  // Heading that separates sections within a card (e.g. "Contact Info").
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  // Generic horizontal row with even gaps between children.
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Muted summary line (e.g. "Active filters: ...").
  filterSummary: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  photoImage: {
    borderRadius: 8,
  },
  photoPlaceholder: {
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});