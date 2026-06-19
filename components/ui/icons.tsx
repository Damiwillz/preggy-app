import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

type Props = { size?: number; color?: string };
export const HomeIcon = (p: Props) => <Ionicons name="home-outline" size={p.size ?? 22} color={p.color ?? colors.text} />;
export const CalculatorIcon = (p: Props) => <Ionicons name="calculator-outline" size={p.size ?? 22} color={p.color ?? colors.text} />;
export const GrowthIcon = (p: Props) => <MaterialCommunityIcons name="sprout-outline" size={p.size ?? 24} color={p.color ?? colors.text} />;
export const TipsIcon = (p: Props) => <Ionicons name="bulb-outline" size={p.size ?? 22} color={p.color ?? colors.text} />;
export const ProfileIcon = (p: Props) => <Ionicons name="person-outline" size={p.size ?? 22} color={p.color ?? colors.text} />;
export const LogIcon = (p: Props) => <Ionicons name="journal-outline" size={p.size ?? 22} color={p.color ?? colors.text} />;
export const CalendarIcon = (p: Props) => <Ionicons name="calendar-outline" size={p.size ?? 22} color={p.color ?? colors.text} />;
export const BackIcon = (p: Props) => <Ionicons name="chevron-back" size={p.size ?? 24} color={p.color ?? colors.ink} />;
export const PinIcon = (p: Props) => <Ionicons name="location-outline" size={p.size ?? 20} color={p.color ?? colors.text} />;
export const PlusIcon = (p: Props) => <Ionicons name="add" size={p.size ?? 26} color={p.color ?? colors.surface} />;
export const HeartIcon = (p: Props) => <Ionicons name="heart-outline" size={p.size ?? 24} color={p.color ?? colors.rose} />;
export const WaterIcon = (p: Props) => <Ionicons name="water-outline" size={p.size ?? 22} color={p.color ?? colors.plum} />;
