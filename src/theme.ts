import { StyleSheet } from 'react-native';

// The app's look in one place (Phase 3 Part 12b): the dusk theme's colours,
// spacing and text styles. Screens and shared components use these instead of
// typing the same values again, so a change here updates the whole app.

// ---------- Colours ----------
export const colors = {
  gold: '#d99c4a',                           // buttons, links, highlights
  onGold: '#1a1330',                         // text on gold buttons
  text: '#ffffff',
  textSoft: 'rgba(255,255,255,0.85)',        // slightly softer body text
  textMuted: 'rgba(255,255,255,0.72)',       // labels, notes
  textFaint: 'rgba(255,255,255,0.5)',        // placeholders
  glass: 'rgba(12,10,22,0.55)',              // card background
  glassBorder: 'rgba(255,255,255,0.15)',     // card edge
  inputBackground: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.2)',
  ghostBorder: 'rgba(255,255,255,0.3)',      // outline buttons (Back)
  error: '#ff9d9d',
  success: '#86efac',
  menuBackground: '#241d3d',                 // hamburger menu, dropdowns
};

// ---------- The dusk background ----------
// Used by ScreenBackground (react-native-linear-gradient's colors/locations/start/end)
export const gradient = {
  colors: ['#1a1330', '#241d3d', '#2f3f52', '#3a5a63', '#c9772f', '#8a3a1e'],
  locations: [0, 0.28, 0.52, 0.68, 0.9, 1],
  start: { x: 0.15, y: 0 },
  end: { x: 0.85, y: 1 },
};

// ---------- Sizes ----------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  card: 14,    // cards
  control: 12, // buttons and inputs
  chip: 20,    // pill-shaped chips
};

// ---------- Text styles ----------
// Use like: <Text style={text.title}>My Invites</Text>
export const text = StyleSheet.create({
  // Screen heading, e.g. "My Invites"
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  // Small grey uppercase label above a field, e.g. "EMAIL ADDRESS"
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 6,
  },
  // Heading for a group of things, e.g. "SCHEDULE" on Home
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 10,
  },
  // Normal message text (e.g. "Loading...", "No invites yet.")
  message: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  // Small grey note under something
  muted: {
    fontSize: 12,
    color: colors.textMuted,
  },
  // Red error under a field. minHeight keeps the space, so the layout doesn't jump.
  fieldError: {
    color: colors.error,
    fontSize: 12,
    minHeight: 16,
    marginBottom: spacing.sm,
  },
  // Gold underlined text link, e.g. "Send again"
  link: {
    fontSize: 13,
    color: colors.gold,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});