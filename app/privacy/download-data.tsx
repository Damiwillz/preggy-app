import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';
import { getMyPrivacySettings } from '@/services/privacy';
import { getMyProfile } from '@/services/profile';

type ExportBundle = {
  exported_at: string;
  profile: unknown;
  privacy_settings: unknown;
  symptom_logs: unknown[];
  medications: unknown[];
  appointments: unknown[];
};

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  const userId = data.user?.id;

  if (!userId) {
    throw new Error('No logged in user.');
  }

  return userId;
}

async function getRows(table: string, userId: string) {
  const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);

  if (error) throw error;

  return data ?? [];
}

export default function DownloadMyDataScreen() {
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<ExportBundle | null>(null);

  async function exportData() {
    setExporting(true);

    try {
      const userId = await getUserId();

      const [profile, privacySettings, symptomLogs, medications, appointments] = await Promise.all([
        getMyProfile(),
        getMyPrivacySettings(),
        getRows('symptom_logs', userId),
        getRows('medications', userId),
        getRows('appointments', userId),
      ]);

      const bundle: ExportBundle = {
        exported_at: new Date().toISOString(),
        profile,
        privacy_settings: privacySettings,
        symptom_logs: symptomLogs,
        medications,
        appointments,
      };

      setPreview(bundle);

      const json = JSON.stringify(bundle, null, 2);

      await Share.share({
        title: 'Preggy App Data Export',
        message: json,
      });
    } catch (error) {
      console.log('Data export error:', error);

      Alert.alert('Export failed', 'Could not export your data. Please check your connection and try again.');
    } finally {
      setExporting(false);
    }
  }

  const counts = preview
    ? [
        ['Symptom logs', preview.symptom_logs.length],
        ['Medications', preview.medications.length],
        ['Appointments', preview.appointments.length],
        ['Privacy settings', preview.privacy_settings ? 1 : 0],
      ]
    : [
        ['Profile', 1],
        ['Symptom logs', 0],
        ['Medications', 0],
        ['Appointments', 0],
      ];

  return (
    <Screen bottomSpace={36}>
      <Header title="Download My Data" back />

      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="download" size={44} color="#FFF" />
        </View>

        <Text style={styles.title}>Export your Preggy data</Text>
        <Text style={styles.subtitle}>
          Download a copy of your profile, symptom logs, medication routines, appointments, and privacy settings.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Included in your export</Text>

        {counts.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="checkmark-circle" size={22} color="#7EA579" />
              <Text style={styles.rowTitle}>{label}</Text>
            </View>

            <Text style={styles.rowCount}>{value}</Text>
          </View>
        ))}
      </View>

      <AnimatedPressable onPress={exportData} style={styles.button} disabled={exporting}>
        {exporting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="share-outline" size={22} color="#FFF" />
            <Text style={styles.buttonText}>Export and share data</Text>
          </>
        )}
      </AnimatedPressable>

      {preview && (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Latest export preview</Text>
          <Text style={styles.previewMeta}>Exported at {new Date(preview.exported_at).toLocaleString()}</Text>

          <ScrollView style={styles.previewBox}>
            <Text style={styles.previewText}>{JSON.stringify(preview, null, 2)}</Text>
          </ScrollView>
        </View>
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
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#765B60',
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    fontSize: 18,
    marginBottom: 8,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0E6E3',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  rowTitle: {
    ...type.body,
    color: colors.ink,
  },
  rowCount: {
    ...type.bodyStrong,
    color: '#765B60',
  },
  button: {
    height: 58,
    borderRadius: 29,
    backgroundColor: '#765B60',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
  },
  buttonText: {
    ...type.bodyStrong,
    color: '#FFF',
  },
  previewCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  previewTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    fontSize: 17,
  },
  previewMeta: {
    ...type.small,
    color: colors.text,
    marginTop: 4,
    marginBottom: 10,
  },
  previewBox: {
    maxHeight: 260,
    backgroundColor: '#F8F2F0',
    borderRadius: 16,
    padding: 12,
  },
  previewText: {
    ...type.tiny,
    color: '#42383B',
    lineHeight: 16,
  },
});
