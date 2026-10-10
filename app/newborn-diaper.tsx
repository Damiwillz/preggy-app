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

type DiaperType = 'Wet' | 'Dirty' | 'Mixed';

type DiaperLog = {
  id: string;
  type: DiaperType;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:newborn-diapers';

const diaperOptions: {
  type: DiaperType;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  copy: string;
}[] = [
  {
    type: 'Wet',
    icon: 'water-outline',
    copy: 'Wet diaper',
  },
  {
    type: 'Dirty',
    icon: 'leaf-outline',
    copy: 'Dirty diaper',
  },
  {
    type: 'Mixed',
    icon: 'sparkles-outline',
    copy: 'Wet and dirty',
  },
];

function isToday(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();

  return date.toDateString() === today.toDateString();
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);

  if (isToday(timestamp)) {
    return 'Today';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function NewbornDiaperScreen() {
  const { palette } = useAppTheme();

  const [logs, setLogs] = useState<DiaperLog[]>([]);
  const [selectedType, setSelectedType] =
    useState<DiaperType>('Wet');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved) {
          return;
        }

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setLogs(parsed);
        }
      } catch (error) {
        console.log('Load diaper logs error:', error);
      }
    }

    void loadLogs();
  }, []);

  const todayLogs = useMemo(
    () => logs.filter((item) => isToday(item.createdAt)),
    [logs]
  );

  const wetCount = todayLogs.filter(
    (item) => item.type === 'Wet' || item.type === 'Mixed'
  ).length;

  const dirtyCount = todayLogs.filter(
    (item) => item.type === 'Dirty' || item.type === 'Mixed'
  ).length;

  async function saveDiaper() {
    if (saving) {
      return;
    }

    setSaving(true);

    const nextLog: DiaperLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: selectedType,
      note: note.trim(),
      createdAt: Date.now(),
    };

    const nextLogs = [nextLog, ...logs];

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextLogs)
      );

      setLogs(nextLogs);
      setNote('');

      Alert.alert(
        'Diaper saved',
        'The Newborn Dashboard has been updated.'
      );
    } catch (error) {
      console.log('Save diaper log error:', error);

      Alert.alert(
        'Could not save',
        'Please try again in a moment.'
      );
    } finally {
      setSaving(false);
    }
  }

  function removeLog(id: string) {
    Alert.alert(
      'Delete this diaper log?',
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
            const nextLogs = logs.filter((item) => item.id !== id);

            try {
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(nextLogs)
              );

              setLogs(nextLogs);
            } catch (error) {
              console.log('Delete diaper log error:', error);

              Alert.alert(
                'Could not delete',
                'Please try again.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <Screen bottomSpace={70}>
      <Header title="Diaper Tracker" back />

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
            name="happy-outline"
            size={28}
            color={palette.accent}
          />
        </View>

        <View style={styles.heroText}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            TODAY
          </Text>

          <Text style={[styles.heroTitle, { color: palette.ink }]}>
            {todayLogs.length} diaper
            {todayLogs.length === 1 ? '' : 's'}
          </Text>

          <Text style={[styles.heroCopy, { color: palette.text }]}>
            {wetCount} wet · {dirtyCount} dirty
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.accent }]}>
        WHAT KIND?
      </Text>

      <View style={styles.optionRow}>
        {diaperOptions.map((option) => {
          const active = selectedType === option.type;

          return (
            <AnimatedPressable
              key={option.type}
              onPress={() => setSelectedType(option.type)}
              style={[
                styles.option,
                {
                  backgroundColor: active
                    ? palette.accent
                    : palette.surface,
                  borderColor: active
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={23}
                color={active ? '#FFFFFF' : palette.accent}
              />

              <Text
                style={[
                  styles.optionTitle,
                  {
                    color: active ? '#FFFFFF' : palette.ink,
                  },
                ]}
              >
                {option.type}
              </Text>

              <Text
                style={[
                  styles.optionCopy,
                  {
                    color: active ? '#FFFFFF' : palette.muted,
                  },
                ]}
              >
                {option.copy}
              </Text>
            </AnimatedPressable>
          );
        })}
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
        <Text style={[styles.inputLabel, { color: palette.ink }]}>
          Optional note
        </Text>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add color, consistency or another note"
          placeholderTextColor={palette.muted}
          multiline
          maxLength={160}
          style={[
            styles.input,
            {
              color: palette.ink,
              borderColor: palette.line,
              backgroundColor: palette.canvas,
            },
          ]}
        />

        <AnimatedPressable
          onPress={() => void saveDiaper()}
          style={[
            styles.saveButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.saveText}>
            {saving ? 'Saving...' : `Log ${selectedType} diaper`}
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.historyHeader}>
        <View>
          <Text style={[styles.sectionLabel, { color: palette.accent }]}>
            HISTORY
          </Text>

          <Text style={[styles.historyTitle, { color: palette.ink }]}>
            Recent changes
          </Text>
        </View>

        <Text style={[styles.historyCount, { color: palette.muted }]}>
          {logs.length} total
        </Text>
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
          <Ionicons
            name="time-outline"
            size={27}
            color={palette.accent}
          />

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            No diaper changes yet
          </Text>

          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Your saved diaper changes will appear here.
          </Text>
        </View>
      ) : (
        logs.slice(0, 12).map((item) => (
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
                  item.type === 'Wet'
                    ? 'water-outline'
                    : item.type === 'Dirty'
                      ? 'leaf-outline'
                      : 'sparkles-outline'
                }
                size={21}
                color={palette.accent}
              />
            </View>

            <View style={styles.logContent}>
              <Text style={[styles.logTitle, { color: palette.ink }]}>
                {item.type} diaper
              </Text>

              <Text style={[styles.logTime, { color: palette.muted }]}>
                {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
              </Text>

              {item.note ? (
                <Text style={[styles.logNote, { color: palette.text }]}>
                  {item.note}
                </Text>
              ) : null}
            </View>

            <AnimatedPressable
              onPress={() => removeLog(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color={palette.muted}
              />
            </AnimatedPressable>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 26,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    marginLeft: 16,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 4,
  },
  heroTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 30,
  },
  heroCopy: {
    ...type.small,
    marginTop: 3,
  },
  sectionLabel: {
    ...type.section,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  option: {
    flex: 1,
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 21,
    padding: 13,
    justifyContent: 'center',
  },
  optionTitle: {
    ...type.bodyStrong,
    marginTop: 9,
  },
  optionCopy: {
    ...type.tiny,
    marginTop: 2,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 28,
  },
  inputLabel: {
    ...type.bodyStrong,
    marginBottom: 9,
  },
  input: {
    ...type.body,
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    textAlignVertical: 'top',
  },
  saveButton: {
    height: 56,
    borderRadius: 18,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    marginTop: 11,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    marginTop: 4,
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
    marginLeft: 12,
  },
  logTitle: {
    ...type.bodyStrong,
  },
  logTime: {
    ...type.tiny,
    marginTop: 1,
  },
  logNote: {
    ...type.small,
    marginTop: 5,
  },
  deleteButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
