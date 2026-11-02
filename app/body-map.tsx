import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BodyArea = {
  id: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type BodyMapEntry = {
  id: string;
  area: string;
  sensation: string;
  intensity: number;
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = 'preggy:body-map-entries';

const bodyAreas: BodyArea[] = [
  {
    id: 'head',
    title: 'Head',
    icon: 'happy-outline',
  },
  {
    id: 'chest',
    title: 'Chest',
    icon: 'heart-outline',
  },
  {
    id: 'abdomen',
    title: 'Belly',
    icon: 'body-outline',
  },
  {
    id: 'back',
    title: 'Back',
    icon: 'person-outline',
  },
  {
    id: 'pelvis',
    title: 'Pelvis',
    icon: 'accessibility-outline',
  },
  {
    id: 'legs',
    title: 'Legs & feet',
    icon: 'footsteps-outline',
  },
];

const sensations = [
  'Ache',
  'Pressure',
  'Cramp',
  'Sharp',
  'Burning',
  'Tingling',
  'Swelling',
  'Other',
];

function formatEntryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BodyMapScreen() {
  const { palette } = useAppTheme();

  const [entries, setEntries] = useState<BodyMapEntry[]>([]);
  const [selectedArea, setSelectedArea] = useState('abdomen');
  const [sensation, setSensation] = useState('Ache');
  const [intensity, setIntensity] = useState(2);
  const [notes, setNotes] = useState('');

  const selectedAreaInfo = useMemo(
    () =>
      bodyAreas.find((area) => area.id === selectedArea) ??
      bodyAreas[0],
    [selectedArea]
  );

  const recentEntries = useMemo(
    () =>
      [...entries]
        .sort((first, second) =>
          second.createdAt.localeCompare(first.createdAt)
        )
        .slice(0, 5),
    [entries]
  );

  const averageIntensity = useMemo(() => {
    if (!entries.length) return 0;

    const total = entries.reduce(
      (sum, entry) => sum + entry.intensity,
      0
    );

    return Math.round((total / entries.length) * 10) / 10;
  }, [entries]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;

        const parsed = JSON.parse(value);
        setEntries(Array.isArray(parsed) ? parsed : []);
      })
      .catch((error) => {
        console.log('Body Map load error:', error);
      });
  }, []);

  async function saveEntries(next: BodyMapEntry[]) {
    setEntries(next);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch (error) {
      console.log('Body Map save error:', error);
      Alert.alert(
        'Could not save',
        'Please try again in a moment.'
      );
    }
  }

  async function addEntry() {
    const entry: BodyMapEntry = {
      id: String(Date.now()),
      area: selectedAreaInfo.title,
      sensation,
      intensity,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [entry, ...entries].slice(0, 50);

    await saveEntries(next);
    setNotes('');

    Alert.alert(
      'Body check-in saved',
      selectedAreaInfo.title +
        ' discomfort was added to your history.'
    );
  }

  function deleteEntry(id: string) {
    Alert.alert(
      'Delete this entry?',
      'This body check-in will be removed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const next = entries.filter(
              (entry) => entry.id !== id
            );
            void saveEntries(next);
          },
        },
      ]
    );
  }

  async function shareSummary() {
    if (!entries.length) {
      Alert.alert(
        'No entries yet',
        'Save a body check-in before sharing a summary.'
      );
      return;
    }

    const summaryEntries = recentEntries.map(
      (entry, index) => {
        const note = entry.notes
          ? ' — ' + entry.notes
          : '';

        return (
          String(index + 1) +
          '. ' +
          entry.area +
          ': ' +
          entry.sensation +
          ', intensity ' +
          String(entry.intensity) +
          '/5' +
          note +
          ' (' +
          formatEntryDate(entry.createdAt) +
          ')'
        );
      }
    );

    const message = [
      'Preggy Body Map Summary',
      '',
      'Average intensity: ' +
        String(averageIntensity) +
        '/5',
      'Total entries: ' + String(entries.length),
      '',
      'Recent check-ins:',
      ...summaryEntries,
      '',
      'This is a personal symptom record, not a diagnosis.',
    ].join('\n');

    await Share.share({
      title: 'Preggy Body Map Summary',
      message,
    });
  }

  return (
    <Screen bottomSpace={80}>
      <Header title="Body Map" back />

      <View
        style={[
          styles.hero,
          { backgroundColor: palette.accent },
        ]}
      >
        <View style={styles.heroTop}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: 'rgba(255,255,255,0.18)' },
            ]}
          >
            <Ionicons
              name="body-outline"
              size={32}
              color={palette.onAccent}
            />
          </View>

          <View
            style={[
              styles.heroBadge,
              { backgroundColor: palette.onAccent },
            ]}
          >
            <Text
              style={[
                styles.heroBadgeValue,
                { color: palette.accent },
              ]}
            >
              {entries.length}
            </Text>
            <Text
              style={[
                styles.heroBadgeLabel,
                { color: palette.accent },
              ]}
            >
              entries
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          Notice what your body is telling you.
        </Text>

        <Text
          style={[
            styles.heroCopy,
            { color: palette.onAccent },
          ]}
        >
          Record where you feel discomfort and create a clear history for your next appointment.
        </Text>

        {entries.length > 0 ? (
          <View
            style={[
              styles.averageRow,
              { backgroundColor: 'rgba(255,255,255,0.14)' },
            ]}
          >
            <Ionicons
              name="pulse-outline"
              size={20}
              color={palette.onAccent}
            />
            <Text
              style={[
                styles.averageText,
                { color: palette.onAccent },
              ]}
            >
              Average recorded intensity: {averageIntensity}/5
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: palette.accent }]}>
          STEP 1
        </Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          Where do you feel it?
        </Text>
        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          Choose the area that best matches what you are feeling.
        </Text>

        <View style={styles.areaGrid}>
          {bodyAreas.map((area) => {
            const selected = area.id === selectedArea;

            return (
              <AnimatedPressable
                key={area.id}
                onPress={() => setSelectedArea(area.id)}
                style={[
                  styles.areaButton,
                  {
                    backgroundColor: selected
                      ? palette.accentSoft
                      : palette.canvas,
                    borderColor: selected
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.areaIcon,
                    {
                      backgroundColor: selected
                        ? palette.accent
                        : palette.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={area.icon}
                    size={23}
                    color={
                      selected
                        ? palette.onAccent
                        : palette.muted
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.areaText,
                    {
                      color: selected
                        ? palette.ink
                        : palette.text,
                    },
                  ]}
                >
                  {area.title}
                </Text>

                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color={palette.accent}
                  />
                ) : null}
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: palette.accent }]}>
          STEP 2
        </Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          What does it feel like?
        </Text>

        <View style={styles.chipWrap}>
          {sensations.map((item) => {
            const selected = item === sensation;

            return (
              <AnimatedPressable
                key={item}
                onPress={() => setSensation(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? palette.accent
                      : palette.canvas,
                    borderColor: selected
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: selected
                        ? palette.onAccent
                        : palette.text,
                    },
                  ]}
                >
                  {item}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <Text
          style={[
            styles.intensityTitle,
            { color: palette.ink },
          ]}
        >
          Intensity
        </Text>

        <Text
          style={[
            styles.intensityCopy,
            { color: palette.text },
          ]}
        >
          1 is mild and 5 is very strong.
        </Text>

        <View style={styles.intensityRow}>
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = value === intensity;

            return (
              <AnimatedPressable
                key={value}
                onPress={() => setIntensity(value)}
                style={[
                  styles.intensityButton,
                  {
                    backgroundColor: selected
                      ? palette.accent
                      : palette.canvas,
                    borderColor: selected
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.intensityValue,
                    {
                      color: selected
                        ? palette.onAccent
                        : palette.ink,
                    },
                  ]}
                >
                  {value}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: palette.accent }]}>
          STEP 3
        </Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          Add context
        </Text>
        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          Include when it started, what you were doing or what made it better.
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Example: Started after walking and improved when I rested..."
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[
            styles.notesInput,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />

        <AnimatedPressable
          onPress={addEntry}
          style={[
            styles.saveButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={palette.onAccent}
          />
          <Text
            style={[
              styles.saveButtonText,
              { color: palette.onAccent },
            ]}
          >
            Save body check-in
          </Text>
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.historyCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.historyHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionLabel, { color: palette.accent }]}>
              HISTORY
            </Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>
              Recent check-ins
            </Text>
          </View>

          <AnimatedPressable
            onPress={shareSummary}
            style={[
              styles.shareButton,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={palette.accent}
            />
          </AnimatedPressable>
        </View>

        {recentEntries.length ? (
          <View style={styles.historyList}>
            {recentEntries.map((entry) => (
              <View
                key={entry.id}
                style={[
                  styles.historyItem,
                  {
                    backgroundColor: palette.canvas,
                    borderColor: palette.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.historyIntensity,
                    { backgroundColor: palette.accentSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.historyIntensityValue,
                      { color: palette.accent },
                    ]}
                  >
                    {entry.intensity}
                  </Text>
                  <Text
                    style={[
                      styles.historyIntensityLabel,
                      { color: palette.accent },
                    ]}
                  >
                    /5
                  </Text>
                </View>

                <View style={styles.historyContent}>
                  <Text
                    style={[
                      styles.historyTitle,
                      { color: palette.ink },
                    ]}
                  >
                    {entry.area} · {entry.sensation}
                  </Text>

                  <Text
                    style={[
                      styles.historyDate,
                      { color: palette.muted },
                    ]}
                  >
                    {formatEntryDate(entry.createdAt)}
                  </Text>

                  {entry.notes ? (
                    <Text
                      style={[
                        styles.historyNotes,
                        { color: palette.text },
                      ]}
                      numberOfLines={2}
                    >
                      {entry.notes}
                    </Text>
                  ) : null}
                </View>

                <AnimatedPressable
                  onPress={() => deleteEntry(entry.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons
                    name="trash-outline"
                    size={19}
                    color={palette.danger}
                  />
                </AnimatedPressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="body-outline"
              size={35}
              color={palette.muted}
            />
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>
              No check-ins yet
            </Text>
            <Text style={[styles.emptyCopy, { color: palette.text }]}>
              Your saved body check-ins will appear here.
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.safetyNote,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={23}
          color={palette.accent}
        />
        <Text style={[styles.safetyText, { color: palette.text }]}>
          Body Map helps you keep notes—it does not diagnose symptoms. Contact your care provider for severe, sudden or worrying symptoms.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    padding: 23,
    marginTop: 12,
    marginBottom: 15,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    minWidth: 66,
    minHeight: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  heroBadgeValue: {
    ...type.title,
    fontSize: 21,
    lineHeight: 23,
  },
  heroBadgeLabel: {
    ...type.tiny,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 33,
    lineHeight: 39,
  },
  heroCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 9,
    opacity: 0.88,
  },
  averageRow: {
    borderRadius: 18,
    padding: 13,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  averageText: {
    ...type.small,
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 15,
  },
  sectionLabel: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 3,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 15,
  },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  areaButton: {
    width: '48%',
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaText: {
    ...type.small,
    flex: 1,
    marginLeft: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...type.small,
  },
  intensityTitle: {
    ...type.bodyStrong,
    marginTop: 21,
  },
  intensityCopy: {
    ...type.small,
    marginTop: 3,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  intensityButton: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityValue: {
    ...type.title,
    fontSize: 20,
  },
  notesInput: {
    minHeight: 115,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    ...type.body,
  },
  saveButton: {
    minHeight: 57,
    borderRadius: 22,
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  saveButtonText: {
    ...type.bodyStrong,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    width: 45,
    height: 45,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyList: {
    gap: 10,
    marginTop: 16,
  },
  historyItem: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 21,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIntensity: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  historyIntensityValue: {
    ...type.title,
    fontSize: 19,
  },
  historyIntensityLabel: {
    ...type.tiny,
  },
  historyContent: {
    flex: 1,
    marginHorizontal: 11,
  },
  historyTitle: {
    ...type.bodyStrong,
  },
  historyDate: {
    ...type.tiny,
    marginTop: 2,
  },
  historyNotes: {
    ...type.small,
    marginTop: 5,
  },
  deleteButton: {
    width: 37,
    height: 37,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 10,
  },
  emptyCopy: {
    ...type.small,
    marginTop: 4,
    textAlign: 'center',
  },
  safetyNote: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  safetyText: {
    ...type.small,
    lineHeight: 19,
    flex: 1,
  },
});
