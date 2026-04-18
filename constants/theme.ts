export const theme = {
  colors: {
    // Uber Light Theme Design System
    primary: '#000000',       // Pure black for primary text, headings, CTA
    background: '#F6F6F6',    // Light grey background
    surface: '#FFFFFF',       // White card surfaces

    // Core brand & state colors
    uberGreen: '#06C167',     // Positive/live states, active nav (Services)
    emergencyRed: '#C81919',  // Emergency elements, SOS, active nav (Emergency)

    // Emergency Service Secondary Palette (used for tinted bg & icon strokes)
    policeBlue: '#1A56DB',
    medicalRed: '#C81919',
    rescueAmber: '#B45309',

    // Vibrant Service Icons
    repair: '#FF6B35',
    cleaning: '#00D9A5',
    moving: '#00B8E6',
    painting: '#9B59B6',
    beauty: '#FF69B4',
    petCare: '#FFA500',
    tech: '#00CED1',
    more: '#87CEEB',

    // Status Colors
    online: '#06C167',      // Map to uber green
    offline: '#95A5A6',
    emergency: '#C81919',   // Map to emergency red

    // Text Colors
    text: '#000000',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    white: '#FFFFFF',

    // Functional Colors
    success: '#06C167',
    warning: '#F59E0B',
    error: '#C81919',
    info: '#3B82F6',

    // Border & Divider
    border: '#E8E8E8',      // 1px border for cards
    divider: '#E8E8E8',      // 1px border for dividers
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
