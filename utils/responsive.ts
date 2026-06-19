import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const base = 390;
export const rs = (value: number) => Math.round((width / base) * value);
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
export const screenPad = clamp(rs(22), 18, 28);
