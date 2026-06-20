import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export default function BiometricLockScreen() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          console.log('Biometric settings error:', error);

          Alert.alert('Biometric lock', 'Could not load biometric settings.');
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

  async function setBiometricEnabled(value: boolean) {
    if (!settings) return;

    const previous = settings;

    setSaving(true);
    setSettings({
      ...settings,
      biometric_lock: value,
      app_lock_enabled: value,
    });

    try {
      const updated = await updateMyPrivacySettings({
        biometric_lock: value,
        app_lock_enabled: value,
      });

      setSettings(updated);

      Alert.alert(
        'Biometric lock',
        value ? 'Biometric lock has been enabled.' : 'Biometric lock has been disabled.'
      );
    } catch (error) {
      console.log('Biometric update error:', error);

      setSettings(previous);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const enabled = !!settings?.biometric_lock;

  return (
    <Screen bottomSpace={32}>
      <Header title="Biometric Lock" back />

      <View style={styles.hero}>
        <View style={[styles.fingerprint, enabled && styles.fingerprintOn]}>
          <Ionicons name="finger-print" size={76} color={enabled ? '#FFF' : '#765B60'} />
        </View>

        <Text style={styles.title}>{enabled ? 'Biometric lock is on' : 'Protect your app'}</Text>
        <Text style={styles.subtitle}>
          Add an extra layer of privacy before opening pregnancy health information on this device.
        </Text>
      </View>

      {loading || !settings ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#765B60" />
          <Text style={styles.loadingText}>Loading lock settings...</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Use Face ID or Touch ID</Text>
                <Text style={styles.rowCopy}>
                  Preggy will remember this setting in your secure account preferences.
                </Text>
              </View>

              <Switch
                value={enabled}
                disabled={saving}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#DED2D0', true: '#F4B6C1' }}
                thumbColor={enabled ? '#765B60' : '#FFFFFF'}
              />
            </View>

            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={22} color="#765B60" />
              <Text style={styles.noteText}>
                This saves your preference now. The next step can add actual device Face ID or Touch ID checking before private screens open.
              </Text>
            </View>
          </View>

          <AnimatedPressable
            onPress={() => setBiometricEnabled(!enabled)}
            style={[styles.button, enabled && styles.buttonOff]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{enabled ? 'Turn off biometric lock' : 'Turn on biometric lock'}</Text>
            )}
          </AnimatedPressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 26,
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  fingerprint: {
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: '#FBE1E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  fingerprintOn: {
    backgroundColor: '#765B60',
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
    minHeight: 160,
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
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    fontSize: 17,
  },
  rowCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 5,
    lineHeight: 19,
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
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#765B60',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonOff: {
    backgroundColor: '#9D6A72',
  },
  buttonText: {
    ...type.bodyStrong,
    color: '#FFF',
  },
});
