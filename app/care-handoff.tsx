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

type ParentStatus = 'Doing well' | 'Needs rest' | 'Needs support';

type FeedingLog = {
  type?: string;
  createdAt: number;
};

type DiaperLog = {
  type?: string;
  createdAt: number;
};

type SleepLog = {
  startedAt: number;
  endedAt: number | null;
};

type Handoff = {
  id: string;
  from: string;
  to: string;
  parentStatus: ParentStatus;
  priorities: string[];
  note: string;
  createdAt: number;
};

const HANDOFF_KEY = 'preggy:care-handoffs';
const FEEDING_KEY = 'preggy:newborn-feedings';
const DIAPER_KEY = 'preggy:newborn-diapers';
const SLEEP_KEY = 'preggy:newborn-sleep';

const parentStatuses: ParentStatus[] = [
  'Doing well',
  'Needs rest',
  'Needs support',
];

const priorityOptions = [
  'Next feeding',
  'Diaper check',
  'Sleep watch',
  'Parent meal',
  'Medication',
  'Quiet time',
];

function parseArray<T>(value: string | null): T[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(timestamp?: number) {
  if (!timestamp) {
    return 'No record yet';
  }

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000)
  );

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return formatDate(timestamp);
}

export default function CareHandoffScreen() {
  const { palette } = useAppTheme();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [parentStatus, setParentStatus] =
    useState<ParentStatus>('Doing well');
  const [priorities, setPriorities] = useState<string[]>([
    'Next feeding',
  ]);
  const [note, setNote] = useState('');
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [feedings, setFeedings] = useState<FeedingLog[]>([]);
  const [diapers, setDiapers] = useState<DiaperLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const values = await AsyncStorage.multiGet([
          HANDOFF_KEY,
          FEEDING_KEY,
          DIAPER_KEY,
          SLEEP_KEY,
        ]);

        setHandoffs(
          parseArray<Handoff>(values[0]?.[1] ?? null)
        );
        setFeedings(
          parseArray<FeedingLog>(values[1]?.[1] ?? null)
        );
        setDiapers(
          parseArray<DiaperLog>(values[2]?.[1] ?? null)
        );
        setSleepLogs(
          parseArray<SleepLog>(values[3]?.[1] ?? null)
        );
      } catch (error) {
        console.log('Load care handoff error:', error);
      }
    }

    void loadData();
  }, []);

  const latestFeeding = useMemo(
    () =>
      [...feedings].sort(
        (a, b) => b.createdAt - a.createdAt
      )[0],
    [feedings]
  );

  const latestDiaper = useMemo(
    () =>
      [...diapers].sort(
        (a, b) => b.createdAt - a.createdAt
      )[0],
    [diapers]
  );

  const activeSleep = useMemo(
    () => sleepLogs.find((item) => item.endedAt === null),
    [sleepLogs]
  );

  const latestSleep = useMemo(
    () =>
      [...sleepLogs].sort(
        (a, b) => b.startedAt - a.startedAt
      )[0],
    [sleepLogs]
  );

  function togglePriority(priority: string) {
    setPriorities((current) =>
      current.includes(priority)
        ? current.filter((item) => item !== priority)
        : [...current, priority]
    );
  }

  function buildSummary(handoff: Handoff) {
    const feedingText = latestFeeding
      ? `${latestFeeding.type ?? 'Feeding'} ${timeAgo(
          latestFeeding.createdAt
        )}`
      : 'No feeding recorded';

    const diaperText = latestDiaper
      ? `${latestDiaper.type ?? 'Diaper'} ${timeAgo(
          latestDiaper.createdAt
        )}`
      : 'No diaper recorded';

    const sleepText = activeSleep
      ? `Baby is sleeping since ${formatTime(
          activeSleep.startedAt
        )}`
      : latestSleep?.endedAt
        ? `Last sleep ended ${timeAgo(latestSleep.endedAt)}`
        : 'No sleep recorded';

    return [
      'PREGGY CARE HANDOFF',
      '',
      `${handoff.from} → ${handoff.to}`,
      `Parent: ${handoff.parentStatus}`,
      '',
      `Feeding: ${feedingText}`,
      `Diaper: ${diaperText}`,
      `Sleep: ${sleepText}`,
      '',
      `Next priorities: ${
        handoff.priorities.length > 0
          ? handoff.priorities.join(', ')
          : 'None selected'
      }`,
      handoff.note ? `Note: ${handoff.note}` : '',
      '',
      `Created ${formatDate(handoff.createdAt)} at ${formatTime(
        handoff.createdAt
      )}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  async function saveHandoff() {
    if (!from.trim() || !to.trim()) {
      Alert.alert(
        'Add both names',
        'Enter who is handing over and who is taking over.'
      );
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    const nextHandoff: Handoff = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      from: from.trim(),
      to: to.trim(),
      parentStatus,
      priorities,
      note: note.trim(),
      createdAt: Date.now(),
    };

    const nextHandoffs = [nextHandoff, ...handoffs];

    try {
      await AsyncStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify(nextHandoffs)
      );

      setHandoffs(nextHandoffs);
      setNote('');

      Alert.alert(
        'Handoff ready',
        'The care instructions have been saved.',
        [
          {
            text: 'Share',
            onPress: () =>
              void Share.share({
                message: buildSummary(nextHandoff),
              }),
          },
          {
            text: 'Done',
          },
        ]
      );
    } catch (error) {
      console.log('Save care handoff error:', error);

      Alert.alert(
        'Could not save',
        'Please try again in a moment.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function shareHandoff(handoff: Handoff) {
    try {
      await Share.share({
        message: buildSummary(handoff),
      });
    } catch (error) {
      console.log('Share handoff error:', error);
    }
  }

  function deleteHandoff(id: string) {
    Alert.alert(
      'Delete this handoff?',
      'This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const nextHandoffs = handoffs.filter(
              (item) => item.id !== id
            );

            try {
              await AsyncStorage.setItem(
                HANDOFF_KEY,
                JSON.stringify(nextHandoffs)
              );

              setHandoffs(nextHandoffs);
            } catch (error) {
              console.log('Delete handoff error:', error);
            }
          },
        },
      ]
    );
  }

  return (
    <Screen bottomSpace={70}>
      <Header title="Care Handoff" back />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.heroIcon,
            { backgroundColor: palette.surface },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={29}
            color={palette.accent}
          />
        </View>

        <View style={styles.heroText}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            CARE SHIFT
          </Text>

          <Text style={[styles.heroTitle, { color: palette.ink }]}>
            Pass care confidently
          </Text>

          <Text style={[styles.heroCopy, { color: palette.text }]}>
            Everything the next caregiver needs in one place.
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.accent }]}>
        LIVE BABY SNAPSHOT
      </Text>

      <View style={styles.snapshotRow}>
        <View
          style={[
            styles.snapshotCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="restaurant-outline"
            size={22}
            color={palette.accent}
          />

          <Text style={[styles.snapshotTitle, { color: palette.ink }]}>
            Feeding
          </Text>

          <Text style={[styles.snapshotCopy, { color: palette.muted }]}>
            {latestFeeding
              ? timeAgo(latestFeeding.createdAt)
              : 'No record'}
          </Text>
        </View>

        <View
          style={[
            styles.snapshotCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="water-outline"
            size={22}
            color={palette.accent}
          />

          <Text style={[styles.snapshotTitle, { color: palette.ink }]}>
            Diaper
          </Text>

          <Text style={[styles.snapshotCopy, { color: palette.muted }]}>
            {latestDiaper
              ? timeAgo(latestDiaper.createdAt)
              : 'No record'}
          </Text>
        </View>

        <View
          style={[
            styles.snapshotCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="moon-outline"
            size={22}
            color={palette.accent}
          />

          <Text style={[styles.snapshotTitle, { color: palette.ink }]}>
            Sleep
          </Text>

          <Text style={[styles.snapshotCopy, { color: palette.muted }]}>
            {activeSleep
              ? 'Sleeping now'
              : latestSleep?.endedAt
                ? timeAgo(latestSleep.endedAt)
                : 'No record'}
          </Text>
        </View>
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
        <Text style={[styles.formTitle, { color: palette.ink }]}>
          Who is changing shifts?
        </Text>

        <Text style={[styles.inputLabel, { color: palette.text }]}>
          Handing over
        </Text>

        <TextInput
          value={from}
          onChangeText={setFrom}
          placeholder="Your name"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            {
              color: palette.ink,
              borderColor: palette.line,
              backgroundColor: palette.canvas,
            },
          ]}
        />

        <Text style={[styles.inputLabel, { color: palette.text }]}>
          Taking over
        </Text>

        <TextInput
          value={to}
          onChangeText={setTo}
          placeholder="Partner or caregiver name"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            {
              color: palette.ink,
              borderColor: palette.line,
              backgroundColor: palette.canvas,
            },
          ]}
        />

        <Text style={[styles.inputLabel, { color: palette.text }]}>
          How is the parent doing?
        </Text>

        <View style={styles.statusWrap}>
          {parentStatuses.map((status) => {
            const active = status === parentStatus;

            return (
              <AnimatedPressable
                key={status}
                onPress={() => setParentStatus(status)}
                style={[
                  styles.choice,
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
                    styles.choiceText,
                    {
                      color: active ? '#FFFFFF' : palette.text,
                    },
                  ]}
                >
                  {status}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { color: palette.text }]}>
          Next priorities
        </Text>

        <View style={styles.priorityWrap}>
          {priorityOptions.map((priority) => {
            const active = priorities.includes(priority);

            return (
              <AnimatedPressable
                key={priority}
                onPress={() => togglePriority(priority)}
                style={[
                  styles.priority,
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
                <Ionicons
                  name={
                    active
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={18}
                  color={active ? palette.accent : palette.muted}
                />

                <Text
                  style={[
                    styles.priorityText,
                    { color: palette.ink },
                  ]}
                >
                  {priority}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { color: palette.text }]}>
          Important note
        </Text>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Medicine, soothing method, supplies or anything important"
          placeholderTextColor={palette.muted}
          multiline
          maxLength={300}
          style={[
            styles.noteInput,
            {
              color: palette.ink,
              borderColor: palette.line,
              backgroundColor: palette.canvas,
            },
          ]}
        />

        <AnimatedPressable
          onPress={() => void saveHandoff()}
          style={[
            styles.saveButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.saveText}>
            {saving ? 'Saving...' : 'Create handoff'}
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.historyHeader}>
        <View>
          <Text style={[styles.sectionLabel, { color: palette.accent }]}>
            HISTORY
          </Text>

          <Text style={[styles.historyTitle, { color: palette.ink }]}>
            Previous handoffs
          </Text>
        </View>

        <Text style={[styles.historyCount, { color: palette.muted }]}>
          {handoffs.length} saved
        </Text>
      </View>

      {handoffs.length === 0 ? (
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
            name="swap-horizontal-outline"
            size={29}
            color={palette.accent}
          />

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            No handoffs yet
          </Text>

          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Saved care shifts will appear here.
          </Text>
        </View>
      ) : (
        handoffs.slice(0, 10).map((handoff) => (
          <View
            key={handoff.id}
            style={[
              styles.handoffCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View style={styles.handoffTop}>
              <View style={styles.handoffNames}>
                <Text
                  style={[styles.handoffTitle, { color: palette.ink }]}
                >
                  {handoff.from} → {handoff.to}
                </Text>

                <Text
                  style={[styles.handoffTime, { color: palette.muted }]}
                >
                  {formatDate(handoff.createdAt)} ·{' '}
                  {formatTime(handoff.createdAt)}
                </Text>
              </View>

              <AnimatedPressable
                onPress={() => void shareHandoff(handoff)}
                style={[
                  styles.iconButton,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <Ionicons
                  name="share-outline"
                  size={19}
                  color={palette.accent}
                />
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => deleteHandoff(handoff.id)}
                style={styles.iconButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={palette.muted}
                />
              </AnimatedPressable>
            </View>

            <Text
              style={[styles.handoffStatus, { color: palette.text }]}
            >
              Parent: {handoff.parentStatus}
            </Text>

            {handoff.priorities.length > 0 ? (
              <Text
                style={[styles.handoffCopy, { color: palette.text }]}
              >
                Next: {handoff.priorities.join(' · ')}
              </Text>
            ) : null}

            {handoff.note ? (
              <Text
                style={[styles.handoffNote, { color: palette.ink }]}
              >
                “{handoff.note}”
              </Text>
            ) : null}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    marginLeft: 15,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 4,
  },
  heroTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  heroCopy: {
    ...type.small,
    marginTop: 4,
  },
  sectionLabel: {
    ...type.section,
    marginBottom: 8,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 25,
  },
  snapshotCard: {
    flex: 1,
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
  },
  snapshotTitle: {
    ...type.small,
    marginTop: 8,
  },
  snapshotCopy: {
    ...type.tiny,
    marginTop: 2,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 17,
    marginBottom: 28,
  },
  formTitle: {
    ...type.title,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 17,
  },
  inputLabel: {
    ...type.small,
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    ...type.body,
    height: 54,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 14,
  },
  statusWrap: {
    gap: 8,
  },
  choice: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  choiceText: {
    ...type.small,
  },
  priorityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priority: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityText: {
    ...type.tiny,
  },
  noteInput: {
    ...type.body,
    minHeight: 95,
    borderWidth: 1,
    borderRadius: 17,
    padding: 14,
    textAlignVertical: 'top',
  },
  saveButton: {
    height: 58,
    borderRadius: 19,
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  saveText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  historyCount: {
    ...type.small,
    marginBottom: 3,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 10,
  },
  emptyCopy: {
    ...type.small,
    marginTop: 4,
  },
  handoffCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 11,
  },
  handoffTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handoffNames: {
    flex: 1,
  },
  handoffTitle: {
    ...type.bodyStrong,
  },
  handoffTime: {
    ...type.tiny,
    marginTop: 2,
  },
  handoffStatus: {
    ...type.small,
    marginTop: 12,
  },
  handoffCopy: {
    ...type.small,
    marginTop: 6,
  },
  handoffNote: {
    ...type.small,
    marginTop: 9,
    fontStyle: 'italic',
  },
  iconButton: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
});
