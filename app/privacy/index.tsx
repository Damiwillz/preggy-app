import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import {
  getMyPrivacySettings,
  updateMyPrivacySettings,
  type PrivacySettings,
} from '@/services/privacy';

type ToggleKey =
  | 'health_data_sharing'
  | 'analytics_tracking'
  | 'personalized_tips'
  | 'ai_chat_history';

type ToggleRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ icon, title, copy, value, disabled, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={22} color="#765B60" />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCopy}>{copy}</Text>
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: '#DED2D0', true: '#F4B6C1' }}
        thumbColor={value ? '#765B60' : '#FFFFFF'}
      />
    </View>
  );
}

function LinkRow({
  icon,
  title,
  copy,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.linkRow}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={22} color="#765B60" />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCopy}>{copy}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#8B7E81" />
    </AnimatedPressable>
  );
}

export default function DataPrivacyScreen() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadSettings = useCallback(() => {
    let mounted = true;

    setLoading(true);

    getMyPrivacySettings()
      .then((data) => {
        if (mounted) {
          setSettings(data);
        }
      })
      .catch((error) => {
        console.log('Privacy settings error:', error);

        Alert.alert('Privacy settings', 'Could not load your privacy settings.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(loadSettings);

  async function toggle(key: ToggleKey, value: boolean) {
    if (!settings) return;

    const previous = settings;

    setSavingKey(key);
    setSettings({
      ...settings,
      [key]: value,
    });

    try {
      const updated = await updateMyPrivacySettings({
        [key]: value,
      });

      setSettings(updated);
    } catch (error) {
      console.log('Privacy update error:', error);

      setSettings(previous);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Screen bottomSpace={36}>
      <Header title="Data Privacy" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark" size={40} color="#FFF" />
        </View>

        <Text style={styles.title}>Your data stays yours</Text>
        <Text style={styles.subtitle}>
          Control what Preggy can use to personalize your pregnancy experience.
        </Text>
      </View>

      {loading || !settings ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#765B60" />
          <Text style={styles.loadingText}>Loading privacy controls...</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <ToggleRow
              icon="medkit-outline"
              title="Health data sharing"
              copy="Allow Preggy to use your logged symptoms, appointments, and routines for personalized insights."
              value={settings.health_data_sharing}
              disabled={savingKey === 'health_data_sharing'}
              onValueChange={(value) => toggle('health_data_sharing', value)}
            />

            <ToggleRow
              icon="bar-chart-outline"
              title="Analytics tracking"
              copy="Help improve the app with basic usage analytics."
              value={settings.analytics_tracking}
              disabled={savingKey === 'analytics_tracking'}
              onValueChange={(value) => toggle('analytics_tracking', value)}
            />

            <ToggleRow
              icon="sparkles-outline"
              title="Personalized tips"
              copy="Show tips based on your pregnancy week, saved profile, and app activity."
              value={settings.personalized_tips}
              disabled={savingKey === 'personalized_tips'}
              onValueChange={(value) => toggle('personalized_tips', value)}
            />

            <ToggleRow
              icon="chatbubble-ellipses-outline"
              title="AI chat history"
              copy="Allow Preggy AI to remember recent chat context inside your account."
              value={settings.ai_chat_history}
              disabled={savingKey === 'ai_chat_history'}
              onValueChange={(value) => toggle('ai_chat_history', value)}
            />
          </View>

          <View style={styles.card}>
            <LinkRow
              icon="finger-print-outline"
              title="Biometric lock"
              copy={settings.biometric_lock ? 'Currently enabled' : 'Currently disabled'}
              onPress={() => router.push('/privacy/biometric' as never)}
            />

            <LinkRow
              icon="download-outline"
              title="Download my data"
              copy="Export your profile, symptoms, appointments, medications, and privacy settings."
              onPress={() => router.push('/privacy/download-data' as never)}
            />
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
    borderRadius: 28,
    padding: 24,
    marginTop: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#765B60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    ...type.title,
    fontSize: 28,
    color: '#201A1D',
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: '#5E5356',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 23,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 20,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FBE1E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
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
});
