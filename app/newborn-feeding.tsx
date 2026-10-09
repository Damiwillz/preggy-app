import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type FeedingType = 'Breastfeeding' | 'Bottle' | 'Formula';
type FeedingSide = 'Left' | 'Right' | 'Both';

type FeedingLog = {
  id: string;
  type: FeedingType;
  amount?: string;
  side?: FeedingSide;
  durationMinutes?: number;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:newborn-feedings';

const feedingTypes: FeedingType[] = [
  'Breastfeeding',
  'Bottle',
  'Formula',
];

const feedingSides: FeedingSide[] = ['Left', 'Right', 'Both'];

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(value: number) {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
}

export default function NewbornFeedingScreen() {
  const { palette } = useAppTheme();

  const [logs, setLogs] = useState<FeedingLog[]>([]);
  const [feedingType, setFeedingType] =
    useState<FeedingType>('Breastfeeding');
  const [side, setSide] = useState<FeedingSide>('Left');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        setLogs(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Newborn feeding load error:', error);
      }
    }

    void loadLogs();
  }, []);

  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimerSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  async function saveLogs(next: FeedingLog[]) {
    setLogs(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Newborn feeding save error:', error);
    }
  }

  async function saveFeeding() {
    const cleanAmount = amount.trim();

    if (
      feedingType !== 'Breastfeeding' &&
      (!cleanAmount || Number(cleanAmount) <= 0)
    ) {
      Alert.alert(
        'Add the amount',
        'Enter the bottle or formula amount in millilitres.'
      );
      return;
    }

    if (feedingType === 'Breastfeeding' && timerSeconds === 0) {
      Alert.alert(
        'Start the timer',
        'Start the feeding timer before saving this session.'
      );
      return;
    }

    const nextLog: FeedingLog = {
      id: String(Date.now()),
      type: feedingType,
      amount:
        feedingType === 'Breastfeeding'
          ? undefined
          : `${cleanAmount} ml`,
      side:
        feedingType === 'Breastfeeding'
          ? side
          : undefined,
      durationMinutes:
        feedingType === 'Breastfeeding'
          ? Math.max(1, Math.round(timerSeconds / 60))
          : undefined,
      note: note.trim(),
      createdAt: Date.now(),
    };

    await saveLogs([nextLog, ...logs]);

    setAmount('');
    setNote('');
    setTimerActive(false);
    setTimerSeconds(0);

    Alert.alert('Feeding saved', 'The Newborn Dashboard has been updated.');
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete feeding?', 'This feeding log will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void saveLogs(logs.filter((item) => item.id !== id));
        },
      },
    ]);
  }

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  const todayLogs = logs.filter(
    (item) => item.createdAt >= todayStart
  );

  const lastFeeding = logs[0];

  return (
    <Screen bottomSpace={140}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          NEWBORN CARE
        </Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          Feeding Tracker
        </Text>

        <Text style={[styles.subtitle, { color: palette.text }]}>
          Log breastfeeding, bottle, and formula sessions throughout the day.
        </Text>
      </View>

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
              name="restaurant-outline"
              size={27}
              color={palette.accent}
            />
          </View>

          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>TODAY</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>
          {todayLogs.length} feedings
        </Text>

        <Text style={styles.heroCopy}>
          {lastFeeding
            ? `Last feeding at ${formatTime(lastFeeding.createdAt)}`
            : 'No feeding has been logged yet'}
        </Text>
      </View>

      <View
        style={[
          styles.formCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: palette.accent }]}>
          NEW FEEDING
        </Text>

        <Text style={[styles.formTitle, { color: palette.ink }]}>
          What type of feeding?
        </Text>

        <View style={styles.typeRow}>
          {feedingTypes.map((item) => {
            const active = feedingType === item;

            return (
              <AnimatedPressable
                key={item}
                onPress={() => {
                  setFeedingType(item);
                  setTimerActive(false);
                  setTimerSeconds(0);
                  setAmount('');
                }}
                style={[
                  styles.typeButton,
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
                <Ionicons
                  name={
                    item === 'Breastfeeding'
                      ? 'heart-outline'
                      : item === 'Bottle'
                        ? 'water-outline'
                        : 'nutrition-outline'
                  }
                  size={18}
                  color={active ? '#FFFFFF' : palette.accent}
                />

                <Text
                  style={[
                    styles.typeText,
                    { color: active ? '#FFFFFF' : palette.ink },
                  ]}
                >
                  {item}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {feedingType === 'Breastfeeding' ? (
          <>
            <Text style={[styles.label, { color: palette.text }]}>
              Feeding side
            </Text>

            <View style={styles.sideRow}>
              {feedingSides.map((item) => {
                const active = side === item;

                return (
                  <AnimatedPressable
                    key={item}
                    onPress={() => setSide(item)}
                    style={[
                      styles.sideButton,
                      {
                        backgroundColor: active
                          ? palette.accentSoft
                          : palette.canvas,
                        borderColor: active
                          ? palette.accent
                          : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sideText,
                        {
                          color: active
                            ? palette.accent
                            : palette.ink,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <View
              style={[
                styles.timerCard,
                {
                  backgroundColor: palette.canvas,
                  borderColor: palette.line,
                },
              ]}
            >
              <Text style={[styles.timerLabel, { color: palette.text }]}>
                FEEDING TIMER
              </Text>

              <Text style={[styles.timerValue, { color: palette.ink }]}>
                {formatTimer(timerSeconds)}
              </Text>

              <View style={styles.timerActions}>
                <AnimatedPressable
                  onPress={() => setTimerActive((current) => !current)}
                  style={[
                    styles.timerMainButton,
                    { backgroundColor: palette.accent },
                  ]}
                >
                  <Ionicons
                    name={timerActive ? 'pause' : 'play'}
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.timerMainText}>
                    {timerActive ? 'Pause' : 'Start'}
                  </Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => {
                    setTimerActive(false);
                    setTimerSeconds(0);
                  }}
                  style={[
                    styles.timerResetButton,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={20}
                    color={palette.text}
                  />
                </AnimatedPressable>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: palette.text }]}>
              Amount in millilitres
            </Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Example: 90"
              placeholderTextColor={palette.muted}
              keyboardType="number-pad"
              style={[
                styles.input,
                {
                  color: palette.ink,
                  backgroundColor: palette.canvas,
                  borderColor: palette.line,
                },
              ]}
            />
          </>
        )}

        <Text style={[styles.label, { color: palette.text }]}>
          Notes
        </Text>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional feeding note"
          placeholderTextColor={palette.muted}
          multiline
          style={[
            styles.input,
            styles.noteInput,
            {
              color: palette.ink,
              backgroundColor: palette.canvas,
              borderColor: palette.line,
            },
          ]}
        />

        <AnimatedPressable
          onPress={() => void saveFeeding()}
          style={[
            styles.saveButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.saveButtonText}>Save feeding</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.historyHeader}>
        <View>
          <Text style={[styles.historyTitle, { color: palette.ink }]}>
            Recent feedings
          </Text>

          <Text style={[styles.historyCopy, { color: palette.text }]}>
            {logs.length} total logs
          </Text>
        </View>
      </View>

      {logs.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="restaurant-outline"
              size={28}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            No feedings yet
          </Text>

          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Your saved feeding sessions will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {logs.slice(0, 12).map((item) => (
            <View
              key={item.id}
              style={[
                styles.logCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.logIcon,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <Ionicons
                  name={
                    item.type === 'Breastfeeding'
                      ? 'heart-outline'
                      : 'water-outline'
                  }
                  size={21}
                  color={palette.accent}
                />
              </View>

              <View style={styles.logContent}>
                <Text style={[styles.logTitle, { color: palette.ink }]}>
                  {item.type}
                </Text>

                <Text style={[styles.logDetail, { color: palette.text }]}>
                  {item.amount
                    ? item.amount
                    : `${item.durationMinutes ?? 0} min • ${item.side}`}
                </Text>

                <Text style={[styles.logTime, { color: palette.muted }]}>
                  {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
                </Text>

                {item.note ? (
                  <Text style={[styles.logNote, { color: palette.text }]}>
                    {item.note}
                  </Text>
                ) : null}
              </View>

              <AnimatedPressable
                onPress={() => confirmDelete(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={palette.muted}
                />
              </AnimatedPressable>
            </View>
          ))}
        </View>
      )}

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={palette.accent}
        />

        <Text style={[styles.infoText, { color: palette.text }]}>
          This tracker records feeding information only. Speak with your
          baby’s care professional if you have feeding concerns.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 4,
    marginBottom: 20,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 5,
  },
  title: {
    ...type.hero,
  },
  subtitle: {
    ...type.body,
    marginTop: 7,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  todayBadgeText: {
    ...type.tiny,
    color: '#FFFFFF',
  },
  heroTitle: {
    ...type.title,
    color: '#FFFFFF',
    marginTop: 18,
  },
  heroCopy: {
    ...type.body,
    color: 'rgba(255,255,255,0.84)',
    marginTop: 4,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 17,
    marginBottom: 24,
  },
  sectionLabel: {
    ...type.section,
  },
  formTitle: {
    ...type.title,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 4,
    marginBottom: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 7,
  },
  typeButton: {
    flex: 1,
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  typeText: {
    ...type.tiny,
    textAlign: 'center',
  },
  label: {
    ...type.small,
    marginTop: 15,
    marginBottom: 7,
  },
  sideRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sideButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sideText: {
    ...type.small,
  },
  timerCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 18,
    alignItems: 'center',
    marginTop: 15,
  },
  timerLabel: {
    ...type.section,
  },
  timerValue: {
    ...type.hero,
    fontSize: 42,
    lineHeight: 52,
    marginTop: 4,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 13,
  },
  timerMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  timerMainText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  timerResetButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...type.body,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  noteInput: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 18,
  },
  saveButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  historyHeader: {
    marginBottom: 12,
  },
  historyTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  historyCopy: {
    ...type.small,
    marginTop: 2,
  },
  historyList: {
    gap: 10,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderRadius: 21,
    padding: 13,
  },
  logIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    ...type.bodyStrong,
  },
  logDetail: {
    ...type.small,
    marginTop: 2,
  },
  logTime: {
    ...type.tiny,
    marginTop: 4,
  },
  logNote: {
    ...type.small,
    marginTop: 6,
  },
  deleteButton: {
    padding: 5,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 13,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    marginTop: 22,
  },
  infoText: {
    ...type.small,
    flex: 1,
  },
});
