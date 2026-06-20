import { DynamicColorIOS, Platform } from 'react-native';

function adaptive(light: string, dark: string): string {
  return Platform.OS === 'ios' ? (DynamicColorIOS({ light, dark }) as unknown as string) : light;
}

export const colors = {
  canvas: adaptive('#FFF8F5', '#100C0E'),
  surface: adaptive('#FFFFFF', '#1B1518'),
  elevated: adaptive('#FFFFFF', '#241C20'),
  softSurface: adaptive('#FFF0EC', '#2A2024'),

  blush: adaptive('#F6D7D2', '#50333B'),
  blushDeep: adaptive('#EFB7AE', '#9D626D'),
  rose: adaptive('#C96D73', '#F19AA4'),
  plum: adaptive('#5E2C4D', '#F0B6D6'),
  plumSoft: adaptive('#8E617E', '#D4A6C2'),

  ink: adaptive('#2C1824', '#FFF5F8'),
  text: adaptive('#6A4D5E', '#D8C7CF'),
  muted: adaptive('#A48B9A', '#A8979F'),
  line: adaptive('#EEDBD7', '#3D3035'),

  cream: adaptive('#FFFDF8', '#161214'),
  green: adaptive('#79986C', '#A4C58F'),
  yellow: adaptive('#F1D98D', '#E7CF82'),
  red: adaptive('#D86C6C', '#FF9090'),

  tab: adaptive('#FFFDFB', '#181315'),
  overlay: adaptive('rgba(44,24,36,0.08)', 'rgba(0,0,0,0.46)'),
  shadow: adaptive('#8B5462', '#000000'),

  darkPrimaryText: adaptive('#FFFFFF', '#1B1014'),
  danger: adaptive('#B23A48', '#FF8F9A'),
} as const;
