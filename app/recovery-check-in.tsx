import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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

type Rating = 1 | 2 | 3 | 4 | 5;
type RatingField = 'mood' | 'energy' | 'rest' | 'comfort';

type RecoveryLog = {
  id: string;
  date: string;
  mood: Rating;
  energy: Rating;
  rest: Rating;
  comfort: Rating;
  notes: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:recovery-check-ins';

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function parseLogs(raw: string | null): RecoveryLog[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? (parsed as RecoveryLog[])
      : [];
  } catch {
    return [];
  }
}

function RatingRow({
  icon,
  title,
  copy,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  value: Rating;
  onChange: (value: Rating) => void;
}) {
  const { palette } = useAppTheme();

  return (
    <View
      style={[
        styles.ratingCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.line,
        },
      ]}
    >
      <View style={styles.ratingHeading}>
        <View
          style={[
            styles.ratingIcon,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Ionicons
            name={icon}
            size={21}
            color={palette.accent}
          />
        </View>

        <View style={styles.ratingContent}>
          <Text
            style={[
              styles.ratingTitle,
              { color: palette.ink },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.ratingCopy,
              { color: palette.text },
            ]}
          >
            {copy}
          </Text>
        </View>

        <Text
          style={[
            styles.ratingValue,
            { color: palette.accent },
          ]}
        >
          {value}/5
        </Text>
      </View>

      <View style={styles.ratingOptions}>
        {([1, 2, 3, 4, 5] as Rating[]).map(
          (rating) => {
            const active = rating === value;

            return (
              <AnimatedPressable
                key={rating}
                onPress={() => onChange(rating)}
                style={[
                  styles.ratingButton,
                  {
                    backgroundColor: active
                      ? palette.accent
                      : palette.canvas,
                    borderColor: active
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ratingNumber,
                    {
                      color: active
                        ? palette.onAccent
                        : palette.ink,
                    },
                  ]}
                >
                  {rating}
                </Text>
              </AnimatedPressable>
            );
          }
        )}
      </View>
    </View>
  );
}

export default function RecoveryCheckInScreen() {
  const { palette } = useAppTheme();

  const [logs, setLogs] = useState<RecoveryLog[]>([]);
  const [mood, setMood] = useState<Rating>(3);
  const [energy, setEnergy] = useState<Rating>(3);
  const [rest, setRest] = useState<Rating>(3);
  const [comfort, setComfort] = useState<Rating>(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        const parsed = parseLogs(saved);
        setLogs(parsed);

        const today = parsed.find(
          (log) => log.date === dateKey()
        );

        if (today) {
          setMood(today.mood);
          setEnergy(today.energy);
          setRest(today.rest);
          setComfort(today.comfort);
          setNotes(today.notes);
        }
      })
      .catch((error) => {
        console.log('Recovery check-in load error:', error);
      });
  }, []);

  async function saveCheckIn() {
    setSaving(true);

    try {
      const existing = logs.find(
        (log) => log.date === dateKey()
      );

      const entry: RecoveryLog = {
        id: existing?.id || String(Date.now()),
        date: dateKey(),
        mood,
        energy,
        rest,
        comfort,
        notes: notes.trim(),
        createdAt: existing?.createdAt || Date.now(),
      };

      const next = [
        entry,
        ...logs.filter(
          (log) => log.date !== dateKey()
        ),
      ].sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );

      setLogs(next);

      Alert.alert(
        'Check-in saved',
        'Today’s recovery check-in has been saved.'
      );
    } catch (error) {
      console.log('Recovery check-in save error:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const todaySaved = logs.some(
    (log) => log.date === dateKey()
  );

  const recentLogs = logs.slice(0, 7);

  const overallScore = useMemo(() => {
    if (!recentLogs.length) return 0;

    const total = recentLogs.reduce(
      (sum, log) =>
        sum +
        log.mood +
        log.energy +
        log.rest +
        log.comfort,
      0
    );

    return Math.round(
      (total / (recentLogs.length * 20)) * 100
    );
  }, [recentLogs]);

  function updateRating(
    field: RatingField,
    value: Rating
  ) {
    if (field === 'mood') setMood(value);
    if (field === 'energy') setEnergy(value);
    if (field === 'rest') setRest(value);
    if (field === 'comfort') setComfort(value);
  }

  return (
    <Screen bottomSpace={110}>
      <Header title="Recovery Check-in" back />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="heart-circle-outline"
              size={29}
              color={palette.onAccent}
            />
          </View>

          <View style={styles.heroScore}>
            <Text style={styles.heroScoreValue}>
              {recentLogs.length
                ? `${overallScore}%`
                : '—'}
            </Text>

            <Text style={styles.heroScoreLabel}>
              recent
            </Text>
          </View>
        </View>

        <Text style={styles.heroEyebrow}>
          A MOMENT FOR YOU
        </Text>

        <Text style={styles.heroTitle}>
          How are you recovering today?
        </Text>

        <Text style={styles.heroCopy}>
          Notice how you feel without judgement. Small
          changes are worth recording.
        </Text>

        <View style={styles.heroStatus}>
          <Ionicons
            name={
              todaySaved
                ? 'checkmark-circle'
                : 'time-outline'
            }
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.heroStatusText}>
            {todaySaved
              ? 'Today’s check-in is saved'
              : 'Today’s check-in is waiting'}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text
          style={[
            styles.sectionEyebrow,
            { color: palette.accent },
          ]}
        >
          TODAY
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: palette.ink },
          ]}
        >
          Your daily check-in
        </Text>

        <Text
          style={[
            styles.sectionCopy,
            { color: palette.text },
          ]}
        >
          One means very difficult. Five means very good.
        </Text>
      </View>

      <RatingRow
        icon="happy-outline"
        title="Mood"
        copy="How are you feeling emotionally?"
        value={mood}
        onChange={(value) =>
          updateRating('mood', value)
        }
      />

      <RatingRow
        icon="flash-outline"
        title="Energy"
        copy="How much energy do you have?"
        value={energy}
        onChange={(value) =>
          updateRating('energy', value)
        }
      />

      <RatingRow
        icon="moon-outline"
        title="Rest"
        copy="How restorative has your rest felt?"
        value={rest}
        onChange={(value) =>
          updateRating('rest', value)
        }
      />

      <RatingRow
        icon="body-outline"
        title="Physical comfort"
        copy="How comfortable does your body feel?"
        value={comfort}
        onChange={(value) =>
          updateRating('comfort', value)
        }
      />

      <View
        style={[
          styles.notesCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text
          style={[
            styles.notesLabel,
            { color: palette.accent },
          ]}
        >
          TODAY’S NOTE
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything you want to remember about today"
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
          disabled={saving}
          onPress={() => void saveCheckIn()}
          style={[
            styles.saveButton,
            { backgroundColor: palette.accent },
            saving && styles.disabled,
          ]}
        >
          <Ionicons
            name={
              todaySaved
                ? 'checkmark-circle-outline'
                : 'save-outline'
            }
            size={20}
            color={palette.onAccent}
          />

          <Text
            style={[
              styles.saveText,
              { color: palette.onAccent },
            ]}
          >
            {saving
              ? 'Saving...'
              : todaySaved
                ? 'Update today’s check-in'
                : 'Save today’s check-in'}
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.historyHeading}>
        <View>
          <Text
            style={[
              styles.sectionEyebrow,
              { color: palette.accent },
            ]}
          >
            RECENT PATTERN
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: palette.ink },
            ]}
          >
            Last seven check-ins
          </Text>
        </View>

        <View
          style={[
            styles.historyCount,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Text
            style={[
              styles.historyCountText,
              { color: palette.accent },
            ]}
          >
            {recentLogs.length}/7
          </Text>
        </View>
      </View>

      {recentLogs.length ? (
        <View style={styles.historyList}>
          {recentLogs.map((log) => {
            const average = Math.round(
              ((log.mood +
                log.energy +
                log.rest +
                log.comfort) /
                20) *
                100
            );

            return (
              <View
                key={log.id}
                style={[
                  styles.historyCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.historyIcon,
                    { backgroundColor: palette.accentSoft },
                  ]}
                >
                  <Ionicons
                    name="pulse-outline"
                    size={21}
                    color={palette.accent}
                  />
                </View>

                <View style={styles.historyContent}>
                  <Text
                    style={[
                      styles.historyDate,
                      { color: palette.ink },
                    ]}
                  >
                    {formatDate(log.date)}
                  </Text>

                  <Text
                    style={[
                      styles.historyMeta,
                      { color: palette.text },
                    ]}
                  >
                    Mood {log.mood} • Energy {log.energy} •
                    Rest {log.rest} • Comfort {log.comfort}
                  </Text>

                  {log.notes ? (
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.historyNote,
                        { color: palette.muted },
                      ]}
                    >
                      {log.notes}
                    </Text>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.historyScore,
                    { color: palette.accent },
                  ]}
                >
                  {average}%
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={31}
            color={palette.accent}
          />

          <Text
            style={[
              styles.emptyTitle,
              { color: palette.ink },
            ]}
          >
            Your pattern will appear here
          </Text>

          <Text
            style={[
              styles.emptyCopy,
              { color: palette.text },
            ]}
          >
            Save today’s check-in to begin your recovery history.
          </Text>
        </View>
      )}

      <View
        style={[
          styles.safetyCard,
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

        <Text
          style={[
            styles.safetyText,
            { color: palette.text },
          ]}
        >
          This check-in does not diagnose medical conditions.
          Contact your care provider whenever something feels
          concerning or unsafe.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 21,
    marginTop: 12,
    marginBottom: 26,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScore: {
    minWidth: 68,
    minHeight: 53,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScoreValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 21,
  },
  heroScoreLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.74)',
  },
  heroEyebrow: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.3,
    marginTop: 25,
  },
  heroTitle: {
    ...type.title,
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    marginTop: 5,
  },
  heroCopy: {
    ...type.body,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 22,
    marginTop: 8,
  },
  heroStatus: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    marginTop: 19,
  },
  heroStatusText: {
    ...type.small,
    color: '#FFFFFF',
  },
  sectionHeading: {
    marginBottom: 13,
  },
  sectionEyebrow: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 2,
  },
  sectionCopy: {
    ...type.small,
    marginTop: 4,
  },
  ratingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 15,
    marginBottom: 10,
  },
  ratingHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  ratingIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingContent: {
    flex: 1,
  },
  ratingTitle: {
    ...type.bodyStrong,
  },
  ratingCopy: {
    ...type.small,
    marginTop: 2,
  },
  ratingValue: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  ratingButton: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 49,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNumber: {
    ...type.bodyStrong,
  },
  notesCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 16,
    marginTop: 5,
  },
  notesLabel: {
    ...type.tiny,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  notesInput: {
    ...type.body,
    minHeight: 108,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  saveButton: {
    minHeight: 57,
    borderRadius: 20,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    ...type.bodyStrong,
  },
  disabled: {
    opacity: 0.6,
  },
  historyHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 27,
    marginBottom: 12,
  },
  historyCount: {
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  historyCountText: {
    ...type.tiny,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 23,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    ...type.bodyStrong,
  },
  historyMeta: {
    ...type.tiny,
    lineHeight: 17,
    marginTop: 3,
  },
  historyNote: {
    ...type.tiny,
    marginTop: 4,
  },
  historyScore: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  emptyCard: {
    minHeight: 190,
    borderWidth: 1,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 23,
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 12,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    marginTop: 4,
  },
  safetyCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 16,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  safetyText: {
    ...type.small,
    flex: 1,
    lineHeight: 20,
  },
});
