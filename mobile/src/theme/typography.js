import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontHeading = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const typography = {
  fontFamily,
  fontHeading,

  // Display & Hero Titles
  displayLarge: {
    fontFamily: fontHeading,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: '#0F172A',
  },
  displayMedium: {
    fontFamily: fontHeading,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#0F172A',
  },

  // Section & Card Headings
  headingLarge: {
    fontFamily: fontHeading,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  headingMedium: {
    fontFamily: fontHeading,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: '#0F172A',
  },
  headingSmall: {
    fontFamily: fontHeading,
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.1,
    color: '#0F172A',
  },

  // High-Precision Metric Numbers (Tabular figures)
  metricHero: {
    fontFamily: fontHeading,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  metricLarge: {
    fontFamily: fontHeading,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  metricMedium: {
    fontFamily: fontHeading,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },

  // Micro Labels & Badges
  labelMicro: {
    fontFamily: fontHeading,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#64748B',
  },
  labelSmall: {
    fontFamily: fontHeading,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#475569',
  },

  // Body & Paragraph Text
  body: {
    fontFamily,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
    color: '#334155',
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: '#64748B',
  },
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    color: '#94A3B8',
  },
};
