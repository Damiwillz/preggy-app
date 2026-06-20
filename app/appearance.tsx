import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type AppearanceMode = 'system' | 'light' | 'dark';
type AccentColor = 'rose' | 'plum' | 'peach' | 'mint';

const modes: {
  key: AppearanceMode;
  title: string;
  copy: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'system',
    title: 'Use system setting',
    copy: 'Follow your iPhone light or dark mode.',
    icon: 'phone-portrait-outline',
  },
  {
    key: 'light',
    title: 'Light mode',
    copy: 'Keep the app bright, soft, and airy.',
    icon: 'sunny-outline',
  },
  {
    key: 'dark',
    title: 'Dark mode',
    copy: 'Use a calmer low light interface.',
    icon: 'moon-outline',
  },
];

const accents: {
  key: AccentColor;
  title: string;
}[] = [
  { key: 'rose', title: 'Rose' },
  { key: 'plum', title: 'Plum' },
  { key: 'peach', title: 'Peach' },
  { key: 'mint', title: 'Mint' },
];

const accentPreview: Record<AccentColor, string> = {
  rose: '#F4A6B4',
  plum: '#DFA8CE',
  peach: '#F6B68F',
  mint: '#A6D7B0',
};

export default function AppearanceScreen() {
  const { mode, accentColor, palette, setMode, setAccentColor } = useAppTheme();

  return (
    <Screen bottomSpace={36}>
      <Header title="Appearance" back />

      <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="color-palette" size={42} color={palette.accent} />
        </View>

        <Text style={[styles.title, { color: palette.ink }]}>Personalize Preggy</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Your theme and accent color now apply to shared screens, tabs, buttons, and the new AI chat.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Theme mode</Text>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {modes.map((item) => {
          const selected = mode === item.key;

          return (
            <AnimatedPressable
              key={item.key}
              onPress={() => setMode(item.key)}
              style={[styles.modeRow, selected && { backgroundColor: palette.accentSoft }]}
            >
              <View style={[styles.modeIcon, { backgroundColor: selected ? palette.accent : palette.softSurface }]}>
                <Ionicons name={item.icon} size={22} color={selected ? palette.onAccent : palette.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.ink }]}>{item.title}</Text>
                <Text style={[styles.rowCopy, { color: palette.text }]}>{item.copy}</Text>
              </View>

              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={25}
                color={selected ? palette.accent : palette.muted}
              />
            </AnimatedPressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Accent color</Text>

      <View style={[styles.accentCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {accents.map((item) => {
          const selected = accentColor === item.key;

          return (
            <AnimatedPressable
              key={item.key}
              onPress={() => setAccentColor(item.key)}
              style={[styles.accentOption, selected && { backgroundColor: palette.accentSoft }]}
            >
              <View style={[styles.accentCircle, { backgroundColor: accentPreview[item.key] }]}>
                {selected && <Ionicons name="checkmark" size={22} color="#FFFFFF" />}
              </View>

              <Text style={[styles.accentText, { color: palette.ink }]}>{item.title}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={[styles.preview, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Text style={[styles.previewLabel, { color: palette.accent }]}>LIVE PREVIEW</Text>

        <View style={[styles.previewCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.previewIcon, { backgroundColor: palette.accent }]}>
            <Ionicons name="heart" size={22} color={palette.onAccent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: palette.ink }]}>Preggers theme</Text>
            <Text style={[styles.previewCopy, { color: palette.text }]}>
              {mode} mode • {accentColor} accent
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    borderRadius: 30,
    padding: 26,
    marginTop: 22,
    marginBottom: 20,
    borderWidth: 1,
  },
  heroIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...type.title,
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 8,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    borderRadius: 26,
    padding: 8,
    marginBottom: 18,
    borderWidth: 1,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 20,
  },
  modeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  rowCopy: {
    ...type.small,
    marginTop: 3,
    lineHeight: 18,
  },
  accentCard: {
    borderRadius: 26,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  accentOption: {
    alignItems: 'center',
    gap: 8,
    width: 70,
    paddingVertical: 8,
    borderRadius: 18,
  },
  accentCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentText: {
    ...type.tiny,
    fontWeight: '800',
  },
  preview: {
    borderRadius: 24,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
  },
  previewLabel: {
    ...type.section,
  },
  previewCard: {
    marginTop: 12,
    minHeight: 78,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    ...type.bodyStrong,
  },
  previewCopy: {
    ...type.small,
    marginTop: 3,
  },
});
