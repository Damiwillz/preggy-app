import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  cancelAllPreggyReminders,
  getPreggyScheduledReminderCount,
  getReminderPermissionStatus,
  requestReminderPermission,
  scheduleAppointmentReminders,
  scheduleMedicationReminders,
  sendImmediatePreggyReminder,
  sendTestPreggyReminder,
} from '@/services/reminders';

type PermissionStatus = {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
};

export default function RemindersScreen() {
  const { palette } = useAppTheme();
  const [count, setCount] = useState(0);
  const [permission, setPermission] = useState<PermissionStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const [nextCount, nextPermission] = await Promise.all([
      getPreggyScheduledReminderCount(),
      getReminderPermissionStatus(),
    ]);

    setCount(nextCount);
    setPermission(nextPermission);
  }

  useFocusEffect(
    useCallback(() => {
      refresh().catch((error) => {
        console.log('Reminder refresh error:', error);
      });
    }, [])
  );

  async function askPermission() {
    setBusy('permission');

    try {
      const granted = await requestReminderPermission();
      await refresh();

      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Open Settings and allow notifications for Preggy or Expo Go, then try again.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.log('Permission error:', error);
      Alert.alert('Permission error', 'Could not request notification permission.');
    } finally {
      setBusy(null);
    }
  }

  async function immediateTest() {
    setBusy('test-now');

    try {
      await sendImmediatePreggyReminder();
      await refresh();

      Alert.alert('Sent', 'If notifications are allowed, the test reminder should appear now.');
    } catch (error) {
      console.log('Immediate test error:', error);

      Alert.alert('Could not send test', 'Please allow notifications and try again.');
    } finally {
      setBusy(null);
    }
  }

  async function delayedTest() {
    setBusy('test-delay');

    try {
      await sendTestPreggyReminder();
      await refresh();

      Alert.alert('Scheduled', 'The test reminder should appear in about 5 seconds.');
    } catch (error) {
      console.log('Delayed test error:', error);

      Alert.alert('Could not schedule test', 'Please allow notifications and try again.');
    } finally {
      setBusy(null);
    }
  }

  async function enableAll() {
    setBusy('all');

    try {
      const hasPermission = await requestReminderPermission();

      if (!hasPermission) {
        Alert.alert('Notifications disabled', 'Please allow notifications to receive Preggy reminders.');
        return;
      }

      await cancelAllPreggyReminders();

      const medicationCount = await scheduleMedicationReminders();
      const appointmentCount = await scheduleAppointmentReminders();

      await refresh();

      Alert.alert(
        'Reminders scheduled',
        `${medicationCount} medication reminder${medicationCount === 1 ? '' : 's'} and ${appointmentCount} appointment reminder${appointmentCount === 1 ? '' : 's'} were scheduled.`
      );
    } catch (error) {
      console.log('Enable reminders error:', error);

      Alert.alert('Could not schedule reminders', 'Please check your saved medication and appointment details.');
    } finally {
      setBusy(null);
    }
  }

  async function clearReminders() {
    setBusy('clear');

    try {
      const cancelled = await cancelAllPreggyReminders();
      await refresh();

      Alert.alert('Reminders cleared', `${cancelled} Preggy reminder${cancelled === 1 ? '' : 's'} cancelled.`);
    } catch (error) {
      console.log('Clear reminders error:', error);

      Alert.alert('Could not clear reminders', 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  const permissionText = permission?.granted
    ? 'Notifications allowed'
    : permission?.status
      ? `Notifications ${permission.status}`
      : 'Checking permission...';

  return (
    <Screen bottomSpace={36}>
      <Header title="Reminders" back />

      <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="notifications" size={42} color={palette.accent} />
        </View>

        <Text style={[styles.title, { color: palette.ink }]}>Preggy reminders</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Schedule local reminders for medications, supplements, and upcoming appointments.
        </Text>

        <View style={[styles.statusBox, { backgroundColor: palette.accentSoft }]}>
          <Text style={[styles.statusText, { color: palette.accent }]}>
            {permissionText} • {count} scheduled
          </Text>
        </View>
      </View>

      <ReminderAction
        title="Allow notifications"
        copy="Ask iOS for permission or open Settings if permission was denied."
        icon="lock-open-outline"
        busy={busy === 'permission'}
        disabled={!!busy}
        onPress={askPermission}
      />

      <ReminderAction
        title="Send instant test"
        copy="Show a notification immediately so we can confirm the system works."
        icon="flash-outline"
        accent
        busy={busy === 'test-now'}
        disabled={!!busy}
        onPress={immediateTest}
      />

      <ReminderAction
        title="Send 5 second test"
        copy="Schedule a test notification that should appear in about 5 seconds."
        icon="timer-outline"
        busy={busy === 'test-delay'}
        disabled={!!busy}
        onPress={delayedTest}
      />

      <ReminderAction
        title="Enable all reminders"
        copy="Clear old Preggy reminders and schedule fresh medication and appointment reminders."
        icon="sparkles"
        accent
        busy={busy === 'all'}
        disabled={!!busy}
        onPress={enableAll}
      />

      <ReminderAction
        title="Clear Preggy reminders"
        copy="Cancel all local reminders created by Preggy on this device."
        icon="trash-outline"
        danger
        busy={busy === 'clear'}
        disabled={!!busy}
        onPress={clearReminders}
      />

      <View style={[styles.note, { backgroundColor: palette.softSurface, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Expo Go can be limited for notifications. If the instant test does not appear, the final app should be tested with a development build.
        </Text>
      </View>
    </Screen>
  );
}

function ReminderAction({
  title,
  copy,
  icon,
  onPress,
  busy,
  disabled,
  accent,
  danger,
}: {
  title: string;
  copy: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  busy: boolean;
  disabled: boolean;
  accent?: boolean;
  danger?: boolean;
}) {
  const { palette } = useAppTheme();

  const iconColor = danger ? palette.danger : accent ? palette.onAccent : palette.accent;
  const iconBg = danger ? palette.danger + '22' : accent ? palette.accent : palette.accentSoft;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.action,
        {
          backgroundColor: palette.surface,
          borderColor: palette.line,
          opacity: disabled && !busy ? 0.62 : 1,
        },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        {busy ? <ActivityIndicator color={iconColor} /> : <Ionicons name={icon} size={25} color={iconColor} />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: palette.ink }]}>{title}</Text>
        <Text style={[styles.actionCopy, { color: palette.text }]}>{copy}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color={palette.muted} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    borderRadius: 30,
    padding: 26,
    marginTop: 22,
    marginBottom: 18,
    borderWidth: 1,
  },
  heroIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...type.title,
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 8,
  },
  statusBox: {
    marginTop: 16,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    ...type.small,
    fontWeight: '800',
  },
  action: {
    minHeight: 92,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  actionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
  },
  note: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  noteText: {
    ...type.small,
    flex: 1,
    lineHeight: 19,
  },
});
