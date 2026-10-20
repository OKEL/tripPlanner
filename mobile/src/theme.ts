// Design tokens: the only place where visual values live (docs/DESIGN.md Part 4).
// Components read from `theme` and never hard-code colors, fonts, or sizes.
// Direction: clean and cool. Teal primary, warm amber only for "today".

export const theme = {
  colors: {
    background: '#F4F7F7',
    surface: '#FFFFFF',
    text: '#14262B',
    textMuted: '#5F7378',
    primary: '#0E7C86',
    onPrimary: '#FFFFFF',
    accent: '#DDF1F2',
    // Primary for text on `accent` (chips, badges): 4.9:1 there, where `primary` is only 4.2:1.
    primaryText: '#0C717A',
    today: '#FFF3D1',
    todayBorder: '#E3A008',
    // Text on the amber `todayBorder` dot (white there is only 2.3:1).
    onToday: '#14262B',
    // Warnings (offline, errors from a background refresh). Kept apart from amber, which means "today".
    warning: '#FDE4D2',
    warningText: '#9A4A12',
    danger: '#C0392B',
    dangerSoft: '#FCE9E7',
    border: '#DCE5E6',
    overlay: 'rgba(10,25,28,0.45)',
    disabled: '#B3C2C4',
    // Timeline node colors by kind.
    nodeDay: '#0E7C86',
    nodeTransit: '#5B6F8F',
    nodeEdge: '#25414A',
  },
  // Trip "avatars" in My Trips cycle through these (picked by trip id).
  tripColors: ['#0E7C86', '#5B6F8F', '#B8622E', '#6B8F3A', '#8A5A9E', '#2F6DB5'],
  font: {
    // Heebo: covers Hebrew and Latin. Loaded in the root layout (@expo-google-fonts/heebo).
    // With custom fonts, weight is chosen by family name, not by fontWeight.
    regular: 'Heebo_400Regular',
    medium: 'Heebo_500Medium',
    bold: 'Heebo_700Bold',
    size: { xs: 12, sm: 14, md: 16, cardTitle: 17, lg: 20, xl: 28, code: 32, codeLarge: 40 },
  },
  spacing: { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  // Fixed element sizes.
  size: { touch: 48, chip: 36, row: 44, avatar: 48, emptyIcon: 88, handleWidth: 40, handleHeight: 4 },
  opacity: { pressed: 0.8 },
  timeline: { dot: 28, dotSmall: 22, line: 2, gutter: 44, activityNumber: 32, activityTime: 110 },
  // Bottom sheet and dialog animation.
  motion: { in: 250, out: 200 },
  shadow: {
    card: {
      shadowColor: '#0A191C',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
  },
} as const;

export type Theme = typeof theme;
