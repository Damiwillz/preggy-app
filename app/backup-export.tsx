import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type StoragePair = readonly [string, string | null];

type BackupSummary = {
  itemCount: number;
  guestMode: boolean;
  profileSaved: boolean;
  reflectionCount: number;
  dailyPlanDays: number;
  trackerCount: number;
  memoryCount: number;
  lastChecked: string | null;
};

const emptySummary: BackupSummary = {
  itemCount: 0,
  guestMode: false,
  profileSaved: false,
  reflectionCount: 0,
  dailyPlanDays: 0,
  trackerCount: 0,
  memoryCount: 0,
  lastChecked: null,
};

const trackerHints = [
  'daily-care',
  'water-cups',
  'kicks',
  'mood',
  'sleep',
  'weight',
  'cravings',
  'blood-pressure',
  'contraction',
];

const memoryHints = ['journal', 'letters', 'bump-gallery', 'reflection'];

function isPreggyKey(key: string) {
  return key.startsWith('preggy:') || key.startsWith('@preggy_');
}

function countKeys(keys: string[], hints: string[]) {
  return keys.filter((key) => hints.some((hint) => key.includes(hint))).length;
}

function makeBackupPayload(pairs: ReadonlyArray<StoragePair>) {
  return {
    app: 'Preggy',
    backup_type: 'local_phone_backup',
    exported_at: new Date().toISOString(),
    note: 'This backup contains local Preggy data saved on this phone, including guest mode data and local tool data.',
    item_count: pairs.length,
    data: Object.fromEntries(pairs),
  };
}

function formatDate(value: string | null) {
  if (!value) return 'Not checked yet';

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SummaryTile({
  icon,
  label,
  value,
  detail,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  detail: string;
  palette: ReturnType<typeof useAppTheme>['palette'];
}) {
  return (
    <View style={[styles.tile, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
      <View style={[styles.tileIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={20} color={palette.accent} />
      </View>

      <Text style={[styles.tileValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: palette.text }]}>{label}</Text>
      <Text style={[styles.tileDetail, { color: palette.muted }]}>{detail}</Text>
    </View>
  );
}

export default function BackupExportScreen() {
  const { palette } = useAppTheme();

  const [summary, setSummary] = useState<BackupSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadPairs = useCallback(async () => {
    const keys = await AsyncStorage.getAllKeys();
    const preggyKeys = keys.filter(isPreggyKey).sort();

    return AsyncStorage.multiGet(preggyKeys);
  }, []);

  const refreshSummary = useCallback(async () => {
    setLoading(true);

    try {
      const pairs = await loadPairs();
      const keys = pairs.map(([key]) => key);

      setSummary({
        itemCount: pairs.length,
        guestMode: pairs.some(([key, value]) => key === '@preggy_guest_mode' && value === 'true'),
        profileSaved: keys.includes('@preggy_guest_profile'),
        reflectionCount: keys.filter((key) => key.startsWith('preggy:daily-reflection:')).length,
        dailyPlanDays: keys.filter((key) => key.startsWith('preggy:daily-plan-done:')).length,
        trackerCount: countKeys(keys, trackerHints),
        memoryCount: countKeys(keys, memoryHints),
        lastChecked: new Date().toISOString(),
      });
    } catch (error) {
      console.log('Backup summary error:', error);
      Alert.alert('Could not load backup info', 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [loadPairs]);

  useFocusEffect(
    useCallback(() => {
      void refreshSummary();
    }, [refreshSummary])
  );

  const stats = useMemo(
    () => [
      {
        icon: 'file-tray-full-outline' as const,
        label: 'Local items',
        value: summary.itemCount,
        detail: 'Saved records',
      },
      {
        icon: 'person-circle-outline' as const,
        label: 'Guest mode',
        value: summary.guestMode ? 'On' : 'Off',
        detail: summary.profileSaved ? 'Profile saved' : 'No guest profile',
      },
      {
        icon: 'calendar-outline' as const,
        label: 'Daily plans',
        value: summary.dailyPlanDays,
        detail: 'Completed days',
      },
      {
        icon: 'book-outline' as const,
        label: 'Memories',
        value: summary.memoryCount,
        detail: `${summary.reflectionCount} reflections`,
      },
    ],
    [summary]
  );

  async function exportBackup() {
    setExporting(true);

    try {
      const pairs = await loadPairs();

      if (pairs.length === 0) {
        Alert.alert('Nothing to export yet', 'Use Preggy a little more, then come back to export your saved data.');
        return;
      }

      const payload = makeBackupPayload(pairs);
      const json = JSON.stringify(payload, null, 2);

      await Share.share({
        title: 'Preggy Backup',
        message: json,
      });

      await refreshSummary();
    } catch (error) {
      console.log('Backup export error:', error);
      Alert.alert('Export failed', 'Could not export your backup right now. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen bottomSpace={50}>
      <Header title="Backup & Export" back />

      <View style={[styles.hero, { backgroundColor: palette.accent }]}>
        <View style={[styles.heroIcon, { backgroundColor: palette.onAccent }]}>
          <Ionicons name="shield-checkmark-outline" size={30} color={palette.accent} />
        </View>

        <Text style={[styles.kicker, { color: palette.onAccent }]}>LOCAL BACKUP</Text>
        <Text style={[styles.title, { color: palette.onAccent }]}>Keep your Preggy journey safe</Text>
        <Text style={[styles.subtitle, { color: palette.onAccent }]}>
          Export guest mode and local tool data from this phone. Useful before deleting the app or changing devices.
        </Text>

        <AnimatedPressable
          onPress={exportBackup}
          disabled={exporting}
          style={[styles.primaryButton, { backgroundColor: palette.onAccent }]}
        >
          {exporting ? (
            <ActivityIndicator color={palette.accent} />
          ) : (
            <>
              <Ionicons name="share-outline" size={21} color={palette.accent} />
              <Text style={[styles.primaryText, { color: palette.accent }]}>Export backup</Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.sectionKicker, { color: palette.accent }]}>WHAT IS SAVED</Text>
            <Text style={[styles.cardTitle, { color: palette.ink }]}>On this phone</Text>
          </View>

          <AnimatedPressable
            onPress={refreshSummary}
            disabled={loading}
            style={[styles.refreshButton, { backgroundColor: palette.accentSoft }]}
          >
            <Ionicons name="refresh-outline" size={18} color={palette.accent} />
          </AnimatedPressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.text }]}>Checking saved data...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {stats.map((item) => (
              <SummaryTile
                key={item.label}
                palette={palette}
                icon={item.icon}
                label={item.label}
                value={item.value}
                detail={item.detail}
              />
            ))}
          </View>
        )}

        <Text style={[styles.checkedText, { color: palette.muted }]}>
          Last checked: {formatDate(summary.lastChecked)}
        </Text>
      </View>

      <View style={[styles.note, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={23} color={palette.accent} />

        <View style={{ flex: 1 }}>
          <Text style={[styles.noteTitle, { color: palette.ink }]}>Important</Text>
          <Text style={[styles.noteCopy, { color: palette.text }]}>
            This does not sync data online. It creates a shareable text backup of local Preggy data stored on this phone.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    padding: 24,
    marginTop: 18,
    marginBottom: 16,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  kicker: {
    ...type.small,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 36,
    marginTop: 6,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 10,
    opacity: 0.86,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 22,
  },
  primaryText: {
    ...type.bodyStrong,
  },
  card: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 18,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionKicker: {
    ...type.small,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    ...type.title,
    fontSize: 24,
    marginTop: 2,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    ...type.small,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    minHeight: 138,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tileValue: {
    ...type.title,
    fontSize: 24,
  },
  tileLabel: {
    ...type.bodyStrong,
    marginTop: 2,
  },
  tileDetail: {
    ...type.small,
    marginTop: 4,
  },
  checkedText: {
    ...type.small,
    marginTop: 14,
  },
  note: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  noteTitle: {
    ...type.bodyStrong,
    marginBottom: 4,
  },
  noteCopy: {
    ...type.small,
    lineHeight: 19,
  },
});
