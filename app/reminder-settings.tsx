import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type ReminderKey = 'water' | 'medication' | 'kicks' | 'appointments' | 'journal';

type ReminderItem = {
  key: ReminderKey;
  title: string;
  copy: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultTime: string;
};

type ReminderSettings = Record<
  ReminderKey,
  {
    enabled: boolean;
    time: string;
  }
>;

const STORAGE_KEY = 'preggy:reminder-settings';

const reminderItems: ReminderItem[] = [
  {
    key: 'water',
    title: 'Water',
    copy: 'Gentle hydration check-in',
    icon: 'water-outline',
    defaultTime: '09:00',
  },
  {
    key: 'medication',
    title: 'Medication',
    copy: 'Remember vitamins or medicine',
    icon: 'medkit-outline',
    defaultTime: '08:00',
  },
  {
    key: 'kicks',
    title: 'Baby movement',
    copy: 'A soft kick counter reminder',
    icon: 'footsteps-outline',
    defaultTime: '18:00',
  },
  {
    key: 'appointments',
    title: 'Appointments',
    copy: 'Prepare before care visits',
    icon: 'calendar-outline',
    defaultTime: '19:00',
  },
  {
    key: 'journal',
    title: 'Journal',
    copy: 'Capture a memory or note',
    icon: 'book-outline',
    defaultTime: '20:00',
  },
];

function buildDefaultSettings(): ReminderSettings {
  return reminderItems.reduce((acc, item) => {
    acc[item.key] = {
      enabled: false,
      time: item.defaultTime,
    };

    return acc;
  }, {} as ReminderSettings);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export default function ReminderSettingsScreen() {
  const { palette } = useAppTheme();

  const [settings, setSettings] = useState<ReminderSettings>(buildDefaultSettings());

  const enabledCount = useMemo(
    () => Object.values(settings).filter((item) => item.enabled).length,
    [settings]
  );

  useEffect(() => {
    async function loadSettings() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : null;
        const defaults = buildDefaultSettings();

        if (parsed && typeof parsed === 'object') {
          setSettings({
            ...defaults,
            ...parsed,
          });
        }
      } catch (error) {
        console.log('Reminder settings load error:', error);
      }
    }

    void loadSettings();
  }, []);

  async function saveSettings(next: ReminderSettings) {
    setSettings(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Reminder settings save error:', error);
    }
  }

  function toggleReminder(key: ReminderKey) {
    const next = {
      ...settings,
      [key]: {
        ...settings[key],
        enabled: !settings[key].enabled,
      },
    };

    void saveSettings(next);
  }

  function updateTime(key: ReminderKey, time: string) {
    setSettings((current) => ({
      ...current,
      [key]: {
        ...current[key],
        time,
      },
    }));
  }

  async function saveTime(key: ReminderKey) {
    const nextTime = settings[key].time.trim();

    if (!isValidTime(nextTime)) {
      Alert.alert('Check time', 'Use 24-hour format like 09:00 or 18:30.');
      return;
    }

    const next = {
      ...settings,
      [key]: {
        ...settings[key],
        time: nextTime,
      },
    };

    await saveSettings(next);
  }

  async function resetSettings() {
    Alert.alert('Reset reminders?', 'This will turn off all reminder preferences.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => void saveSettings(buildDefaultSettings()),
      },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>REMINDERS</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Reminder Settings</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Choose the pregnancy check-ins you want to keep close.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="notifications-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>ACTIVE REMINDERS</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {enabledCount} of {reminderItems.length} enabled
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              Your preferences are saved on this device.
            </Text>
          </View>
        </View>

        <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            These settings prepare the reminder preferences. Push notifications can be connected later.
          </Text>
        </View>

        <View style={styles.reminderList}>
          {reminderItems.map((item) => {
            const current = settings[item.key];

            return (
              <View
                key={item.key}
                style={[styles.reminderCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
              >
                <View style={styles.reminderTop}>
                  <View style={[styles.reminderIcon, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name={item.icon} size={21} color={palette.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reminderTitle, { color: palette.ink }]}>{item.title}</Text>
                    <Text style={[styles.reminderCopy, { color: palette.text }]}>{item.copy}</Text>
                  </View>

                  <Switch
                    value={current.enabled}
                    onValueChange={() => toggleReminder(item.key)}
                    trackColor={{ false: palette.line, true: palette.accentSoft }}
                    thumbColor={current.enabled ? palette.accent : palette.surface}
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.timeLabel, { color: palette.text }]}>Reminder time</Text>
                    <TextInput
                      value={current.time}
                      onChangeText={(value) => updateTime(item.key, value)}
                      onBlur={() => void saveTime(item.key)}
                      placeholder="09:00"
                      placeholderTextColor={palette.muted}
                      keyboardType="numbers-and-punctuation"
                      style={[
                        styles.timeInput,
                        {
                          color: palette.ink,
                          backgroundColor: palette.canvas,
                          borderColor: palette.line,
                        },
                      ]}
                    />
                  </View>

                  <AnimatedPressable
                    onPress={() => void saveTime(item.key)}
                    style={[styles.saveButton, { backgroundColor: palette.accentSoft }]}
                  >
                    <Text style={[styles.saveText, { color: palette.accent }]}>Save</Text>
                  </AnimatedPressable>
                </View>
              </View>
            );
          })}
        </View>

        <AnimatedPressable
          onPress={resetSettings}
          style={[styles.resetButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="refresh-outline" size={19} color={palette.accent} />
          <Text style={[styles.resetText, { color: palette.accent }]}>Reset reminders</Text>
        </AnimatedPressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '800',
  },
  heroCard: {
    minHeight: 116,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  noteCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
    fontWeight: '800',
  },
  reminderList: {
    gap: 12,
  },
  reminderCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 15,
  },
  reminderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    ...type.bodyStrong,
    fontSize: 17,
    lineHeight: 22,
  },
  reminderCopy: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 3,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  timeLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 7,
  },
  timeInput: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    ...type.bodyStrong,
    fontSize: 15,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    ...type.tiny,
    fontWeight: '900',
  },
  resetButton: {
    minHeight: 52,
    borderRadius: 21,
    borderWidth: 1,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetText: {
    ...type.small,
    fontWeight: '900',
  },
});
