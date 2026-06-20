import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { applyAppearanceMode } from '@/services/appAppearance';
import { type } from '@/constants/typography';
import {
  getMyPrivacySettings,
  updateMyPrivacySettings,
  type PrivacySettings,
} from '@/services/privacy';

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
    copy: 'Preggy follows your iPhone light or dark mode.',
    icon: 'phone-portrait-outline',
  },
  {
    key: 'light',
    title: 'Light mode',
    copy: 'Keep Preggy bright and soft all the time.',
    icon: 'sunny-outline',
  },
  {
    key: 'dark',
    title: 'Dark mode',
    copy: 'Use a calmer darker interface preference.',
    icon: 'moon-outline',
  },
];

const accents: {
  key: AccentColor;
  title: string;
  color: string;
}[] = [
  {
    key: 'rose',
    title: 'Rose',
    color: '#F4B6C1',
  },
  {
    key: 'plum',
    title: 'Plum',
    color: '#765B60',
  },
  {
    key: 'peach',
    title: 'Peach',
    color: '#F6B28B',
  },
  {
    key: 'mint',
    title: 'Mint',
    color: '#8AB985',
  },
];

export default function AppearanceScreen() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      setLoading(true);

      getMyPrivacySettings()
        .then((data) => {
          if (mounted) {
            setSettings(data);
          }
        })
        .catch((error) => {
          console.log('Appearance settings error:', error);

          Alert.alert('Appearance', 'Could not load appearance settings.');
        })
        .finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  async function saveAppearance(updates: Partial<PrivacySettings>, key: string) {
    if (!settings) return;

    const previous = settings;

    setSavingKey(key);
    setSettings({
      ...settings,
      ...updates,
    });

    try {
      const updated = await updateMyPrivacySettings(updates);

      setSettings(updated);

      if (updates.appearance_mode) {
        applyAppearanceMode(updates.appearance_mode);
      }
    } catch (error) {
      console.log('Appearance update error:', error);

      setSettings(previous);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSavingKey(null);
    }
  }

  const mode = settings?.appearance_mode ?? 'system';
  const accent = settings?.accent_color ?? 'rose';
  const currentAccent = accents.find((item) => item.key === accent) ?? accents[0];

  return (
    <Screen bottomSpace={36}>
      <Header title="Appearance" back />

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: currentAccent.color }]}>
          <Ionicons name="color-palette" size={42} color="#FFF" />
        </View>

        <Text style={styles.title}>Personalize Preggy</Text>
        <Text style={styles.subtitle}>
          Save your preferred theme and accent color to your Preggy account.
        </Text>
      </View>

      {loading || !settings ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#765B60" />
          <Text style={styles.loadingText}>Loading appearance...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Theme mode</Text>

          <View style={styles.card}>
            {modes.map((item) => {
              const selected = mode === item.key;

              return (
                <AnimatedPressable
                  key={item.key}
                  onPress={() => saveAppearance({ appearance_mode: item.key }, `mode-${item.key}`)}
                  disabled={!!savingKey}
                  style={[styles.modeRow, selected && styles.selectedRow]}
                >
                  <View style={[styles.modeIcon, selected && { backgroundColor: currentAccent.color }]}>
                    <Ionicons name={item.icon} size={22} color={selected ? '#FFF' : '#765B60'} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowCopy}>{item.copy}</Text>
                  </View>

                  {savingKey === `mode-${item.key}` ? (
                    <ActivityIndicator color="#765B60" />
                  ) : (
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={25}
                      color={selected ? currentAccent.color : '#C9BDBA'}
                    />
                  )}
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Accent color</Text>

          <View style={styles.accentCard}>
            {accents.map((item) => {
              const selected = accent === item.key;

              return (
                <AnimatedPressable
                  key={item.key}
                  onPress={() => saveAppearance({ accent_color: item.key }, `accent-${item.key}`)}
                  disabled={!!savingKey}
                  style={[styles.accentOption, selected && styles.accentSelected]}
                >
                  <View style={[styles.accentCircle, { backgroundColor: item.color }]}>
                    {selected && <Ionicons name="checkmark" size={22} color="#FFF" />}
                  </View>

                  <Text style={styles.accentText}>{item.title}</Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={22} color="#765B60" />
            <Text style={styles.noteText}>
              This saves the setting now. The next polish step can apply the saved theme across every screen automatically.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 26,
    marginTop: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E2DF',
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
    color: '#201A1D',
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: '#5E5356',
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 8,
  },
  loadingCard: {
    minHeight: 180,
    backgroundColor: '#FFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  loadingText: {
    ...type.small,
    color: '#765B60',
  },
  sectionTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 20,
  },
  selectedRow: {
    backgroundColor: '#FFF4F5',
  },
  modeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FBE1E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    fontSize: 16,
  },
  rowCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    lineHeight: 18,
  },
  accentCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
  },
  accentOption: {
    alignItems: 'center',
    gap: 8,
    width: 70,
    paddingVertical: 8,
    borderRadius: 18,
  },
  accentSelected: {
    backgroundColor: '#FFF4F5',
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
    color: colors.ink,
    fontWeight: '800',
  },
  note: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF4F5',
    borderRadius: 18,
    padding: 13,
    marginTop: 18,
  },
  noteText: {
    ...type.small,
    color: '#5E5356',
    flex: 1,
    lineHeight: 19,
  },
});
