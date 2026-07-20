import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BloodPressureReading = {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  note: string;
  createdAt: number;
};

type ReadingLevel = 'normal' | 'elevated' | 'high' | 'severe';

const STORAGE_KEY = 'preggy:blood-pressure-readings';

function parseReadings(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as BloodPressureReading[]) : [];
  } catch {
    return [];
  }
}

function getReadingLevel(systolic: number, diastolic: number): ReadingLevel {
  if (systolic >= 160 || diastolic >= 110) return 'severe';
  if (systolic >= 140 || diastolic >= 90) return 'high';
  if (systolic >= 120 && diastolic < 80) return 'elevated';

  return 'normal';
}

function getLevelCopy(level: ReadingLevel) {
  if (level === 'severe') {
    return {
      title: 'Severe range',
      copy: 'Contact your care team now or seek urgent care, especially if you have symptoms.',
      icon: 'warning-outline' as const,
    };
  }

  if (level === 'high') {
    return {
      title: 'High reading',
      copy: 'Rest, retake if advised, and contact your care team about this reading.',
      icon: 'alert-circle-outline' as const,
    };
  }

  if (level === 'elevated') {
    return {
      title: 'Elevated',
      copy: 'Keep watching your trend and mention it at your next visit.',
      icon: 'trending-up-outline' as const,
    };
  }

  return {
    title: 'In usual range',
    copy: 'Keep logging readings as recommended by your care team.',
    icon: 'checkmark-circle-outline' as const,
  };
}

function formatDate(value: number) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BloodPressureTrackerScreen() {
  const { palette } = useAppTheme();

  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    async function loadReadings() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setReadings(parseReadings(saved));
      } catch (error) {
        console.log('Blood pressure load error:', error);
      }
    }

    void loadReadings();
  }, []);

  const latest = readings[0] ?? null;
  const latestLevel = latest ? getReadingLevel(latest.systolic, latest.diastolic) : 'normal';
  const latestInfo = getLevelCopy(latestLevel);

  const averages = useMemo(() => {
    const recent = readings.slice(0, 7);

    if (!recent.length) {
      return {
        systolic: '--',
        diastolic: '--',
      };
    }

    const systolicAverage = Math.round(recent.reduce((sum, item) => sum + item.systolic, 0) / recent.length);
    const diastolicAverage = Math.round(recent.reduce((sum, item) => sum + item.diastolic, 0) / recent.length);

    return {
      systolic: String(systolicAverage),
      diastolic: String(diastolicAverage),
    };
  }, [readings]);

  async function saveReadings(next: BloodPressureReading[]) {
    setReadings(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Blood pressure save error:', error);
    }
  }

  async function addReading() {
    const nextSystolic = Number(systolic);
    const nextDiastolic = Number(diastolic);
    const nextPulse = pulse.trim() ? Number(pulse) : null;

    if (!Number.isFinite(nextSystolic) || !Number.isFinite(nextDiastolic)) {
      Alert.alert('Add reading', 'Enter systolic and diastolic numbers first.');
      return;
    }

    if (nextSystolic < 70 || nextSystolic > 250 || nextDiastolic < 40 || nextDiastolic > 160) {
      Alert.alert('Check numbers', 'That reading looks unusual. Please check the numbers and try again.');
      return;
    }

    if (nextPulse !== null && (!Number.isFinite(nextPulse) || nextPulse < 35 || nextPulse > 220)) {
      Alert.alert('Check pulse', 'That pulse number looks unusual. Please check it and try again.');
      return;
    }

    const nextReading: BloodPressureReading = {
      id: String(Date.now()),
      systolic: Math.round(nextSystolic),
      diastolic: Math.round(nextDiastolic),
      pulse: nextPulse === null ? null : Math.round(nextPulse),
      note: note.trim(),
      createdAt: Date.now(),
    };

    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNote('');

    await saveReadings([nextReading, ...readings].slice(0, 60));

    const level = getReadingLevel(nextReading.systolic, nextReading.diastolic);

    if (level === 'severe') {
      Alert.alert('Severe range', 'Please contact your care team now or seek urgent care.');
    } else if (level === 'high') {
      Alert.alert('High reading', 'Please contact your care team about this reading.');
    }
  }

  async function deleteReading(id: string) {
    await saveReadings(readings.filter((item) => item.id !== id));
  }

  function clearAll() {
    Alert.alert('Clear readings?', 'This removes all saved blood pressure readings from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void saveReadings([]);
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>TRACKING</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Blood Pressure</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Save readings and watch your trend between visits.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.accentRail, { backgroundColor: palette.accent }]} />

        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>LATEST READING</Text>
            <Text style={[styles.latestValue, { color: palette.ink }]}>
              {latest ? `${latest.systolic}/${latest.diastolic}` : '--/--'}
            </Text>
            <Text style={[styles.latestMeta, { color: palette.text }]}>
              {latest ? `${formatDate(latest.createdAt)} at ${formatTime(latest.createdAt)}` : 'No reading saved yet'}
            </Text>
          </View>

          <View style={[styles.levelBadge, { backgroundColor: latestLevel === 'severe' ? palette.danger : palette.accentSoft }]}>
            <Ionicons
              name={latestInfo.icon}
              size={24}
              color={latestLevel === 'severe' ? '#FFFFFF' : palette.accent}
            />
          </View>
        </View>

        <View style={[styles.levelPanel, { backgroundColor: latestLevel === 'severe' ? palette.danger : palette.accentSoft }]}>
          <Text style={[styles.levelTitle, { color: latestLevel === 'severe' ? '#FFFFFF' : palette.accent }]}>
            {latestInfo.title}
          </Text>
          <Text style={[styles.levelCopy, { color: latestLevel === 'severe' ? '#FFFFFF' : palette.text }]}>
            {latestInfo.copy}
          </Text>
        </View>
      </View>

      <View style={styles.quickRow}>
        <MiniCard label="Saved" value={String(readings.length)} icon="albums-outline" />
        <MiniCard label="Avg sys" value={averages.systolic} icon="trending-up-outline" />
        <MiniCard label="Avg dia" value={averages.diastolic} icon="pulse-outline" />
      </View>

      <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.cardLabel, { color: palette.accent }]}>ADD READING</Text>

        <View style={styles.inputRow}>
          <NumberField label="Systolic" value={systolic} onChangeText={setSystolic} placeholder="120" />
          <NumberField label="Diastolic" value={diastolic} onChangeText={setDiastolic} placeholder="80" />
        </View>

        <NumberField label="Pulse optional" value={pulse} onChangeText={setPulse} placeholder="78" />

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note, symptoms, or context"
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[
            styles.noteInput,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />

        <AnimatedPressable onPress={addReading} style={[styles.addButton, { backgroundColor: palette.accent }]}>
          <Ionicons name="add" size={20} color={palette.onAccent} />
          <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Save reading</Text>
        </AnimatedPressable>
      </View>

      <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.listHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>HISTORY</Text>
            <Text style={[styles.listTitle, { color: palette.ink }]}>
              {readings.length} reading{readings.length === 1 ? '' : 's'}
            </Text>
          </View>

          {readings.length ? (
            <AnimatedPressable onPress={clearAll} style={[styles.clearButton, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.clearText, { color: palette.accent }]}>Clear</Text>
            </AnimatedPressable>
          ) : null}
        </View>

        {readings.length ? (
          readings.map((item, index) => (
            <ReadingRow
              key={item.id}
              reading={item}
              last={index === readings.length - 1}
              onDelete={() => deleteReading(item.id)}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: palette.text }]}>
            No readings yet. Add your first reading above.
          </Text>
        )}
      </View>

      <View style={[styles.disclaimer, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name="information-circle-outline" size={19} color={palette.accent} />
        <Text style={[styles.disclaimerText, { color: palette.text }]}>
          This tracker does not diagnose conditions. Follow your care team's plan and seek urgent help for severe readings or warning symptoms.
        </Text>
      </View>
    </Screen>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.numberField}>
      <Text style={[styles.inputLabel, { color: palette.ink }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        keyboardType="number-pad"
        style={[
          styles.numberInput,
          {
            backgroundColor: palette.canvas,
            borderColor: palette.line,
            color: palette.ink,
          },
        ]}
      />
    </View>
  );
}

function MiniCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.miniCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={[styles.miniIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>
      <Text style={[styles.miniValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.miniLabel, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

function ReadingRow({
  reading,
  last,
  onDelete,
}: {
  reading: BloodPressureReading;
  last: boolean;
  onDelete: () => void;
}) {
  const { palette } = useAppTheme();
  const level = getReadingLevel(reading.systolic, reading.diastolic);
  const info = getLevelCopy(level);

  return (
    <View style={[styles.readingRow, { borderBottomColor: last ? 'transparent' : palette.line }]}>
      <View
        style={[
          styles.readingIcon,
          {
            backgroundColor: level === 'severe' ? palette.danger : palette.accentSoft,
          },
        ]}
      >
        <Ionicons
          name={info.icon}
          size={18}
          color={level === 'severe' ? '#FFFFFF' : palette.accent}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.readingValue, { color: palette.ink }]}>
          {reading.systolic}/{reading.diastolic}
          {reading.pulse ? ` • ${reading.pulse} bpm` : ''}
        </Text>
        <Text style={[styles.readingMeta, { color: palette.text }]}>
          {formatDate(reading.createdAt)} at {formatTime(reading.createdAt)} • {info.title}
        </Text>
        {reading.note ? (
          <Text style={[styles.readingNote, { color: palette.text }]} numberOfLines={2}>
            {reading.note}
          </Text>
        ) : null}
      </View>

      <AnimatedPressable onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={18} color={palette.danger} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 10,
    marginBottom: 14,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.4,
  },
  title: {
    ...type.title,
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: 0,
    marginTop: 2,
  },
  subtitle: {
    ...type.body,
    marginTop: 6,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardLabel: {
    ...type.tiny,
    letterSpacing: 1.3,
  },
  latestValue: {
    fontSize: 39,
    lineHeight: 44,
    fontWeight: '900',
    marginTop: 3,
  },
  latestMeta: {
    ...type.small,
    marginTop: 2,
  },
  levelBadge: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPanel: {
    borderRadius: 18,
    padding: 13,
    marginTop: 14,
  },
  levelTitle: {
    ...type.bodyStrong,
  },
  levelCopy: {
    ...type.small,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  miniCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    minHeight: 106,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  miniValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  miniLabel: {
    ...type.tiny,
    marginTop: 1,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  numberField: {
    flex: 1,
    marginBottom: 12,
  },
  inputLabel: {
    ...type.small,
    marginBottom: 7,
  },
  numberInput: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    ...type.bodyStrong,
  },
  noteInput: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    ...type.body,
  },
  addButton: {
    minHeight: 56,
    borderRadius: 18,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    ...type.bodyStrong,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  listTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
  },
  clearButton: {
    minHeight: 36,
    borderRadius: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    ...type.small,
    fontWeight: '900',
  },
  emptyText: {
    ...type.body,
  },
  readingRow: {
    minHeight: 82,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  readingIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingValue: {
    ...type.bodyStrong,
  },
  readingMeta: {
    ...type.small,
    marginTop: 1,
  },
  readingNote: {
    ...type.small,
    marginTop: 3,
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  disclaimerText: {
    ...type.small,
    flex: 1,
  },
});
