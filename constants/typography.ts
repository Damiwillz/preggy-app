import { Platform } from 'react-native';

const family = Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'System' });

export const type = {
  brand: { fontFamily: family, fontSize: 30, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.5 },
  hero: { fontFamily: family, fontSize: 34, lineHeight: 42, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontFamily: family, fontSize: 27, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.45 },
  section: { fontFamily: family, fontSize: 12, lineHeight: 16, fontWeight: '800' as const, letterSpacing: 1.2 },
  body: { fontFamily: family, fontSize: 16, lineHeight: 23, fontWeight: '500' as const },
  bodyStrong: { fontFamily: family, fontSize: 16, lineHeight: 23, fontWeight: '700' as const },
  small: { fontFamily: family, fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  tiny: { fontFamily: family, fontSize: 11, lineHeight: 14, fontWeight: '700' as const }
};
