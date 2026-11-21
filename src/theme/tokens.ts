import { Platform } from 'react-native';

export const COLORS = {
  // Core Metallic Dark Palette
  bgPrimary: '#0A0B0D',       // Near-black main background
  bgSecondary: '#17191D',     // Charcoal secondary background
  bgCard: '#24262B',          // Graphite metallic card surface
  bgCardHover: '#2C2F36',     // Elevated graphite surface
  bgInput: '#14161A',         // Recessed metallic input surface
  bgGlass: 'rgba(23, 25, 29, 0.92)',

  // Metallic Orange Accents
  accentPrimary: '#F97316',   // Vivid metallic orange
  accentHighlight: '#FFB347', // Golden orange highlight
  accentDeep: '#C2410C',      // Burnished copper-orange
  accentGlow: 'rgba(249, 115, 22, 0.32)',
  accentSubtle: 'rgba(249, 115, 22, 0.14)',
  accentBorder: 'rgba(249, 115, 22, 0.45)',
  accentBorderBright: 'rgba(255, 179, 71, 0.75)',

  // Typography
  textPrimary: '#FFFFFF',     // Pure white
  textSecondary: '#C8CDD5',   // Light brushed silver
  textMuted: '#7E8594',       // Muted steel
  textDark: '#0A0B0D',        // Dark text on bright orange buttons

  // Metallic Borders & Dividers
  borderSubtle: '#2E323B',
  borderBevelTop: '#3A3F4B',
  borderBevelBottom: '#121317',

  // Status Colors (Harmonized with Metallic Aesthetic)
  statusGreen: '#10B981',
  statusGreenBg: 'rgba(16, 185, 129, 0.16)',
  statusOrange: '#F97316',
  statusOrangeBg: 'rgba(249, 115, 22, 0.16)',
  statusRed: '#EF4444',
  statusRedBg: 'rgba(239, 68, 68, 0.16)',
  statusGrey: '#4B5563',
  statusGreyBg: 'rgba(75, 85, 99, 0.18)',
};

export const GRADIENTS = {
  metallicCard: ['#2B2E35', '#1F2127', '#181A1F'] as const,
  metallicHeader: ['#1C1E24', '#0F1014', '#0A0B0D'] as const,
  orangeButton: ['#FFB347', '#F97316', '#C2410C'] as const,
  orangeGlowCard: ['rgba(249, 115, 22, 0.22)', '#24262B', '#181A1F'] as const,
  emergencyRed: ['#EF4444', '#B91C1C', '#7F1D1D'] as const,
  bezelBorder: ['#FFB347', '#F97316', '#7C2D12', '#2E323B'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 9999,
};

export const SHADOWS = {
  orangeGlow: Platform.select({
    ios: {
      shadowColor: '#F97316',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    default: {
      boxShadow: '0px 4px 18px rgba(249, 115, 22, 0.28)',
    },
  }),
  metallicCard: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
    default: {
      boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.55)',
    },
  }),
};
