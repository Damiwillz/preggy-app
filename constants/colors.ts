import { DynamicColorIOS, Platform } from 'react-native';

function adaptive(light: string, dark: string): string {
  return Platform.OS === 'ios'
    ? (DynamicColorIOS({ light, dark }) as unknown as string)
    : light;
}

export const colors = {
  canvas: adaptive('#FFF7F4', '#151113'),
  surface: adaptive('#FFFFFF', '#211B1E'),
  softSurface: adaptive('#FFF0EC', '#2B2226'),
  blush: adaptive('#F6D7D2', '#563B43'),
  blushDeep: adaptive('#EFB7AE', '#845761'),
  rose: adaptive('#C96D73', '#E58B91'),
  plum: adaptive('#5E2C4D', '#F0B6D6'),
  plumSoft: adaptive('#8E617E', '#CCA0BB'),
  ink: adaptive('#2C1824', '#FFF5F8'),
  text: adaptive('#6A4D5E', '#D7C6CE'),
  muted: adaptive('#A48B9A', '#A9969F'),
  line: adaptive('#EEDBD7', '#43353B'),
  cream: adaptive('#FFFDF8', '#1D181A'),
  green: adaptive('#79986C', '#A4C58F'),
  yellow: adaptive('#F1D98D', '#E7CF82'),
  red: adaptive('#D86C6C', '#FF9090'),
  tab: adaptive('#FFFDFB', '#1B1618'),
  overlay: adaptive('rgba(44,24,36,0.08)', 'rgba(0,0,0,0.34)'),
} as const;
