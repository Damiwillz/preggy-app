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

type RelayTask = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
};

type SavedRelay = {
  caregiver: string;
  startTime: string;
  endTime: string;
  note: string;
  tasks: RelayTask[];
  active: boolean;
  savedAt: string;
};

const STORAGE_KEY = 'preggy:rest-relay';

const defaultTasks: RelayTask[] = [
  {
    id: 'feeding',
    label: 'Feeding support',
    icon: 'restaurant-outline',
    selected: true,
  },
  {
    id: 'diapers',
    label: 'Diaper changes',
    icon: 'water-outline',
    selected: true,
  },
  {
    id: 'soothing',
    label: 'Soothing baby',
    icon: 'heart-outline',
    selected: false,
  },
  {
    id: 'house',
    label: 'Quiet house tasks',
    icon: 'home-outline',
    selected: false,
  },
  {
    id: 'check-in',
    label: 'Parent check-in',
    icon: 'chatbubble-ellipses-outline',
    selected: true,
  },
  {
    id: 'medication',
    label: 'Medication reminder',
    icon: 'medical-outline',
    selected: false,
  },
];

export default function RestRelayScreen() {
  const { palette } = useAppTheme();

  const [caregiver, setCaregiver] = useState('');
  const [startTime, setStartTime] = useState('10:00 PM');
  const [endTime, setEndTime] = useState('2:00 AM');
  const [note, setNote] = useState('');
  const [tasks, setTasks] = useState<RelayTask[]>(defaultTasks);
  const [active, setActive] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;

        const saved = JSON.parse(value) as SavedRelay;
        setCaregiver(saved.caregiver ?? '');
        setStartTime(saved.startTime ?? '10:00 PM');
        setEndTime(saved.endTime ?? '2:00 AM');
        setNote(saved.note ?? '');
        setTasks(saved.tasks?.length ? saved.tasks : defaultTasks);
        setActive(Boolean(saved.active));
        setSavedAt(saved.savedAt ?? null);
      })
      .catch((error) => {
        console.log('Rest Relay load error:', error);
      });
  }, []);

  const selectedTasks = useMemo(
    () => tasks.filter((task) => task.selected),
    [tasks]
  );

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, selected: !task.selected }
          : task
      )
    );
  }

  async function saveRelay(nextActive = active) {
    if (!caregiver.trim()) {
      Alert.alert(
        'Add a caregiver',
        'Enter the name of the person taking this care shift.'
      );
      return;
    }

    if (selectedTasks.length === 0) {
      Alert.alert(
        'Choose at least one task',
        'Select what the caregiver will handle during this shift.'
      );
      return;
    }

    const now = new Date().toISOString();

    const relay: SavedRelay = {
      caregiver: caregiver.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      note: note.trim(),
      tasks,
      active: nextActive,
      savedAt: now,
    };

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(relay)
      );

      setActive(nextActive);
      setSavedAt(now);

      Alert.alert(
        nextActive ? 'Rest relay started' : 'Rest relay saved',
        nextActive
          ? caregiver.trim() + ' is now covering this care shift.'
          : 'Your rest relay is ready when you need it.'
      );
    } catch (error) {
      console.log('Rest Relay save error:', error);
      Alert.alert(
        'Could not save',
        'Please try again in a moment.'
      );
    }
  }

  async function endRelay() {
    await saveRelay(false);
  }

  async function shareRelay() {
    if (!caregiver.trim()) {
      Alert.alert('Add a caregiver first');
      return;
    }

    const lines = [
      'Preggy Rest Relay',
      '',
      'Caregiver: ' + caregiver.trim(),
      'Shift: ' + startTime.trim() + ' – ' + endTime.trim(),
      '',
      'Responsibilities:',
      ...selectedTasks.map((task) => '• ' + task.label),
      note.trim() ? '' : null,
      note.trim() ? 'Handoff note: ' + note.trim() : null,
      '',
      'The goal of this shift is protected rest.',
    ].filter(Boolean) as string[];

    await Share.share({
      title: 'Preggy Rest Relay',
      message: lines.join('\n'),
    });
  }

  return (
    <Screen bottomSpace={70}>
      <Header title="Rest Relay" back />

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
              name="moon-outline"
              size={29}
              color={palette.onAccent}
            />
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: active
                  ? palette.onAccent
                  : 'rgba(255,255,255,0.18)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: active
                    ? palette.success
                    : palette.onAccent,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: active
                    ? palette.accent
                    : palette.onAccent,
                },
              ]}
            >
              {active ? 'RELAY ACTIVE' : 'PLANNING'}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          Rest is part of the care plan.
        </Text>

        <Text
          style={[
            styles.heroCopy,
            { color: palette.onAccent },
          ]}
        >
          Give one trusted person a clear care shift so you can properly switch off and recover.
        </Text>
      </View>

      {active ? (
        <View
          style={[
            styles.activeCard,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accent,
            },
          ]}
        >
          <View
            style={[
              styles.activeIcon,
              { backgroundColor: palette.accent },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={palette.onAccent}
            />
          </View>

          <View style={styles.activeContent}>
            <Text
              style={[
                styles.activeEyebrow,
                { color: palette.accent },
              ]}
            >
              CURRENT CAREGIVER
            </Text>
            <Text
              style={[
                styles.activeName,
                { color: palette.ink },
              ]}
            >
              {caregiver}
            </Text>
            <Text
              style={[
                styles.activeTime,
                { color: palette.text },
              ]}
            >
              {startTime} – {endTime}
            </Text>
          </View>
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          Who is taking over?
        </Text>
        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          Add the person responsible for this rest window.
        </Text>

        <TextInput
          value={caregiver}
          onChangeText={setCaregiver}
          placeholder="Partner or caregiver name"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={[styles.label, { color: palette.text }]}>
              Starts
            </Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="10:00 PM"
              placeholderTextColor={palette.muted}
              style={[
                styles.input,
                {
                  backgroundColor: palette.canvas,
                  borderColor: palette.line,
                  color: palette.ink,
                },
              ]}
            />
          </View>

          <View style={styles.timeField}>
            <Text style={[styles.label, { color: palette.text }]}>
              Ends
            </Text>
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              placeholder="2:00 AM"
              placeholderTextColor={palette.muted}
              style={[
                styles.input,
                {
                  backgroundColor: palette.canvas,
                  borderColor: palette.line,
                  color: palette.ink,
                },
              ]}
            />
          </View>
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
        <View style={styles.sectionHeading}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>
              Shift responsibilities
            </Text>
            <Text style={[styles.sectionCopy, { color: palette.text }]}>
              Choose what the caregiver is taking off your mind.
            </Text>
          </View>

          <View
            style={[
              styles.countBadge,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Text style={[styles.countText, { color: palette.accent }]}>
              {selectedTasks.length}
            </Text>
          </View>
        </View>

        <View style={styles.taskGrid}>
          {tasks.map((task) => (
            <AnimatedPressable
              key={task.id}
              onPress={() => toggleTask(task.id)}
              style={[
                styles.task,
                {
                  backgroundColor: task.selected
                    ? palette.accentSoft
                    : palette.canvas,
                  borderColor: task.selected
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.taskIcon,
                  {
                    backgroundColor: task.selected
                      ? palette.accent
                      : palette.surface,
                  },
                ]}
              >
                <Ionicons
                  name={task.icon}
                  size={21}
                  color={
                    task.selected
                      ? palette.onAccent
                      : palette.muted
                  }
                />
              </View>

              <Text
                style={[
                  styles.taskLabel,
                  {
                    color: task.selected
                      ? palette.ink
                      : palette.text,
                  },
                ]}
              >
                {task.label}
              </Text>

              <Ionicons
                name={
                  task.selected
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={21}
                color={
                  task.selected
                    ? palette.accent
                    : palette.muted
                }
              />
            </AnimatedPressable>
          ))}
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
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          Handoff note
        </Text>
        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          Add anything the caregiver should know before you rest.
        </Text>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Example: The next bottle is in the fridge..."
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
      </View>

      <View style={styles.actions}>
        <AnimatedPressable
          onPress={() => saveRelay(true)}
          style={[
            styles.primaryButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name={active ? 'refresh-outline' : 'moon-outline'}
            size={21}
            color={palette.onAccent}
          />
          <Text
            style={[
              styles.primaryButtonText,
              { color: palette.onAccent },
            ]}
          >
            {active ? 'Update active relay' : 'Start rest relay'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={shareRelay}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="share-outline"
            size={21}
            color={palette.accent}
          />
          <Text
            style={[
              styles.secondaryButtonText,
              { color: palette.ink },
            ]}
          >
            Share with caregiver
          </Text>
        </AnimatedPressable>

        {active ? (
          <AnimatedPressable
            onPress={endRelay}
            style={styles.endButton}
          >
            <Text style={[styles.endButtonText, { color: palette.muted }]}>
              End this relay
            </Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {savedAt ? (
        <Text style={[styles.savedText, { color: palette.muted }]}>
          Last saved {new Date(savedAt).toLocaleString()}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 32,
    padding: 22,
    marginTop: 12,
    marginBottom: 15,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    ...type.tiny,
    letterSpacing: 0.7,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 32,
    lineHeight: 38,
  },
  heroCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 9,
    opacity: 0.88,
  },
  activeCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContent: {
    marginLeft: 13,
    flex: 1,
  },
  activeEyebrow: {
    ...type.tiny,
    letterSpacing: 1,
  },
  activeName: {
    ...type.bodyStrong,
    fontSize: 19,
    marginTop: 2,
  },
  activeTime: {
    ...type.small,
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginBottom: 15,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    ...type.title,
    fontSize: 21,
    lineHeight: 26,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 15,
  },
  label: {
    ...type.small,
    marginBottom: 7,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 15,
    ...type.body,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  timeField: {
    flex: 1,
  },
  countBadge: {
    minWidth: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...type.bodyStrong,
  },
  taskGrid: {
    gap: 9,
  },
  task: {
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskLabel: {
    ...type.bodyStrong,
    flex: 1,
    marginHorizontal: 11,
  },
  noteInput: {
    minHeight: 115,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    ...type.body,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primaryButtonText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
  endButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    ...type.small,
    textDecorationLine: 'underline',
  },
  savedText: {
    ...type.tiny,
    textAlign: 'center',
    marginTop: 14,
  },
});
