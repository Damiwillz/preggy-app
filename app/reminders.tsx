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
    const [permissionStatus, scheduledCount] = await Promise.all([
      getReminderPermissionStatus(),
      getPreggyScheduledReminderCount(),
    ]);

    setPermission(permissionStatus);
    setCount(scheduledCount);
  }

  useFocusEffect(
    useCallback(() => {
      refresh().catch((error) => {
        console.log('Reminder refresh error:', error);
      });
    }, [])
  );

  async function runAction(key: string, action: () => Promise<void>, successMessage: string) {
    setBusy(key);

    try {
      await action();
      await refresh();
      Alert.alert('Done', successMessage);
    } catch (error) {
      console.log(`${key} reminder error:`, error);
      Alert.alert('Reminder error', 'Could not complete this reminder action. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handlePermission() {
    await runAction(
      'permission',
      async () => {
        const result = await requestReminderPermission();

        if (!result.granted && !result.canAskAgain) {
          Alert.alert(
            'Notifications blocked',
            'Open Android settings and allow notifications for Preggy.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      },
      'Notification permission checked.'
    );
  }

  async function handleTestNotification() {
    await runAction(
      'test',
      sendTestPreggyReminder,
      'A test notification has been sent. Check your notification shade if you do not see it immediately.'
    );
  }

  async function handleImmediateNotification() {
    await runAction(
      'immediate',
      sendImmediatePreggyReminder,
      'An immediate reminder has been sent.'
    );
  }

  async function handleScheduleAll() {
    await runAction(
      'schedule',
      async () => {
        await scheduleMedicationReminders();
        await scheduleAppointmentReminders();
      },
      'Medication and appointment reminders have been scheduled.'
    );
  }

  async function handleCancelAll() {
    await runAction(
      'cancel',
      cancelAllPreggyReminders,
      'All Preggy reminders have been cancelled.'
    );
  }

  const granted = permission?.granted ?? false;

  return (
    <Screen bottomSpace={40}>
      <Header title="Notifications" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>REMINDERS</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Preggy notifications</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Test notifications, request permission, and schedule medication or appointment reminders.
        </Text>
      </View>

      <View style={[styles.statusCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.statusIcon, { backgroundColor: granted ? palette.accentSoft : palette.softSurface }]}>
          <Ionicons
            name={granted ? 'notifications' : 'notifications-off-outline'}
            size={28}
            color={granted ? palette.accent : palette.muted}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.statusTitle, { color: palette.ink }]}>
            {granted ? 'Notifications allowed' : 'Notifications not allowed yet'}
          </Text>
          <Text style={[styles.statusCopy, { color: palette.text }]}>
            Status: {permission?.status ?? 'checking'} • Scheduled reminders: {count}
          </Text>
        </View>
      </View>

      <AnimatedPressable
        onPress={handleTestNotification}
        disabled={busy !== null}
        style={[styles.testButton, { backgroundColor: palette.accent }]}
      >
        {busy === 'test' ? (
          <ActivityIndicator color={palette.onAccent} />
        ) : (
          <>
            <Ionicons name="flash" size={22} color={palette.onAccent} />
            <Text style={[styles.testButtonText, { color: palette.onAccent }]}>Test notification</Text>
          </>
        )}
      </AnimatedPressable>

      <View style={styles.actions}>
        <ReminderRow
          icon="shield-checkmark-outline"
          title="Allow notifications"
          copy="Ask Android for notification permission"
          busy={busy === 'permission'}
          onPress={handlePermission}
        />

        <ReminderRow
          icon="send-outline"
          title="Send immediate reminder"
          copy="Send a Preggy reminder right now"
          busy={busy === 'immediate'}
          onPress={handleImmediateNotification}
        />

        <ReminderRow
          icon="calendar-outline"
          title="Schedule all reminders"
          copy="Schedule medication and appointment reminders"
          busy={busy === 'schedule'}
          onPress={handleScheduleAll}
        />

        <ReminderRow
          icon="trash-outline"
          title="Cancel all reminders"
          copy="Remove all scheduled Preggy reminders"
          danger
          busy={busy === 'cancel'}
          onPress={handleCancelAll}
        />
      </View>

      <View style={[styles.note, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="information-circle" size={22} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Notifications work best in this Android development build. Expo Go does not fully support this feature.
        </Text>
      </View>
    </Screen>
  );
}

function ReminderRow({
  icon,
  title,
  copy,
  busy,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  busy: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={busy}
      style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? palette.danger + '22' : palette.accentSoft }]}>
        {busy ? (
          <ActivityIndicator color={danger ? palette.danger : palette.accent} />
        ) : (
          <Ionicons name={icon} size={23} color={danger ? palette.danger : palette.accent} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: danger ? palette.danger : palette.ink }]}>{title}</Text>
        <Text style={[styles.rowCopy, { color: palette.text }]}>{copy}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={palette.muted} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 22,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 31,
    marginTop: 3,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 7,
  },
  statusCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  statusIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  statusCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
  },
  testButton: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginBottom: 16,
  },
  testButtonText: {
    ...type.bodyStrong,
  },
  actions: {
    gap: 12,
  },
  row: {
    minHeight: 78,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  rowIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  rowCopy: {
    ...type.small,
    lineHeight: 18,
    marginTop: 3,
  },
  note: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  noteText: {
    ...type.small,
    flex: 1,
    lineHeight: 19,
  },
});
