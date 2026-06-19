import React, { useEffect, useState } from 'react';
import { Appearance, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

type ThemeMode = 'light' | 'dark';

function ThemeChoice({
  title,
  description,
  icon,
  mode,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  icon: 'sunny-outline' | 'moon-outline';
  mode: ThemeMode;
  selected: boolean;
  onSelect: (mode: ThemeMode) => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onSelect(mode)}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={[styles.iconShell, selected && styles.iconShellSelected]}>
        <Ionicons name={icon} size={26} color={colors.plum as any} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function AppearanceScreen() {
  const systemScheme = useColorScheme() ?? 'light';
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(systemScheme);

  useEffect(() => {
    setSelectedMode(systemScheme);
  }, [systemScheme]);

  const applyTheme = (mode: ThemeMode) => {
    setSelectedMode(mode);
    Appearance.setColorScheme(mode);
  };

  return (
    <Screen bottomSpace={44}>
      <Header title="Appearance" back />
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name={selectedMode === 'dark' ? 'moon' : 'sunny'} size={34} color={colors.plum as any} />
        </View>
        <Text style={styles.title}>Choose your look</Text>
        <Text style={styles.copy}>
          Pick the appearance that feels most comfortable. Your choice updates every screen immediately.
        </Text>
      </View>

      <Text style={styles.section}>DISPLAY MODE</Text>
      <View style={styles.optionsCard} accessibilityRole="radiogroup">
        <ThemeChoice
          title="Light Mode"
          description="Bright, soft and easy to read during the day"
          icon="sunny-outline"
          mode="light"
          selected={selectedMode === 'light'}
          onSelect={applyTheme}
        />
        <View style={styles.divider} />
        <ThemeChoice
          title="Dark Mode"
          description="Reduced brightness for evenings and low light"
          icon="moon-outline"
          mode="dark"
          selected={selectedMode === 'dark'}
          onSelect={applyTheme}
        />
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewAvatar} />
          <View style={styles.previewLines}>
            <View style={styles.previewLineLong} />
            <View style={styles.previewLineShort} />
          </View>
          <Ionicons name="heart" size={22} color={colors.rose as any} />
        </View>
        <Text style={styles.previewText}>
          {selectedMode === 'dark' ? 'Dark Mode is active across Preggers.' : 'Light Mode is active across Preggers.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 34, paddingBottom: 24 },
  heroIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  title: { ...type.title, color: colors.ink, marginTop: 18, textAlign: 'center' },
  copy: { ...type.body, color: colors.text, textAlign: 'center', marginTop: 9, lineHeight: 24, maxWidth: 340 },
  section: { ...type.section, color: colors.text, marginBottom: 9 },
  optionsCard: { backgroundColor: colors.surface, borderRadius: 26, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  option: { minHeight: 92, paddingHorizontal: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionSelected: { backgroundColor: colors.softSurface },
  optionPressed: { opacity: 0.82 },
  iconShell: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softSurface },
  iconShellSelected: { backgroundColor: colors.blush },
  optionText: { flex: 1 },
  optionTitle: { ...type.bodyStrong, color: colors.ink },
  optionDescription: { ...type.small, color: colors.text, lineHeight: 19, marginTop: 3 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.plum },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.plum },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 82 },
  preview: { backgroundColor: colors.softSurface, borderRadius: 26, padding: 18, marginTop: 22, borderWidth: 1, borderColor: colors.line },
  previewLabel: { ...type.section, color: colors.text },
  previewCard: { minHeight: 78, borderRadius: 20, backgroundColor: colors.surface, marginTop: 13, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  previewAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.blush },
  previewLines: { flex: 1, gap: 8 },
  previewLineLong: { width: '78%', height: 9, borderRadius: 5, backgroundColor: colors.ink },
  previewLineShort: { width: '48%', height: 7, borderRadius: 4, backgroundColor: colors.muted },
  previewText: { ...type.small, color: colors.text, textAlign: 'center', marginTop: 12 },
});
