import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import {
  cancelAllPreggyReminders,
  getPreggyScheduledReminderCount,
  getReminderPermissionStatus,
  requestReminderPermission,
  scheduleAppointmentReminders,
  scheduleMedicationReminders,
} from '@/services/reminders';

function normalizePermissionStatus(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'granted' : 'denied';

  if (
    value &&
    typeof value === 'object' &&
    'status' in value &&
    typeof (value as { status?: unknown }).status === 'string'
  ) {
    return (value as { status: string }).status;
  }

  return 'unknown';
}

export default function RemindersScreen() {
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [scheduledCount, setScheduledCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refreshStatus() {
    try {
      const status = normalizePermissionStatus(await getReminderPermissionStatus());
      const count = await getPreggyScheduledReminderCount();

      setPermissionStatus(status);
      setScheduledCount(count);
      setNotificationsEnabled(status === 'granted' && count > 0);
    } catch (error) {
      console.log('Reminder status error:', error);
      setPermissionStatus('unknown');
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function enableNotifications() {
    setBusy(true);

    try {
      const status = normalizePermissionStatus(await requestReminderPermission());
      setPermissionStatus(status);

      if (status === 'granted') {
        Alert.alert('Notifications enabled', 'Preggy can now send appointment and medication reminders.');
      } else {
        Alert.alert(
          'Permission needed',
          'Notifications are not enabled yet. You can allow them from your device settings.'
        );
      }
    } catch (error) {
      console.log('Permission error:', error);
      Alert.alert('Could not enable notifications', 'Please try again from your device settings.');
    } finally {
      setBusy(false);
      void refreshStatus();
    }
  }

  async function scheduleReminders() {
    setBusy(true);

    try {
      const status = normalizePermissionStatus(await requestReminderPermission());

      if (status !== 'granted') {
        setPermissionStatus(status);
        Alert.alert('Permission needed', 'Please allow notifications before scheduling reminders.');
        return;
      }

      await scheduleMedicationReminders();
      await scheduleAppointmentReminders();

      await refreshStatus();

      Alert.alert('Reminders scheduled', 'Preggy will remind you about saved medications and appointments.');
    } catch (error) {
      console.log('Schedule reminders error:', error);
      Alert.alert('Could not schedule reminders', 'Please check your saved medications and appointments, then try again.');
    } finally {
      setBusy(false);
    }
  }

  async function cancelReminders() {
    Alert.alert(
      'Cancel all reminders?',
      'This will remove all scheduled Preggy medication and appointment reminders from this device.',
      [
        {
          text: 'Keep reminders',
          style: 'cancel',
        },
        {
          text: 'Cancel reminders',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);

            try {
              await cancelAllPreggyReminders();
              await refreshStatus();

              Alert.alert('Reminders cancelled', 'All scheduled Preggy reminders have been removed.');
            } catch (error) {
              console.log('Cancel reminders error:', error);
              Alert.alert('Could not cancel reminders', 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  async function toggleNotifications(value: boolean) {
    if (busy) return;

    setBusy(true);

    try {
      if (value) {
        const status = normalizePermissionStatus(await requestReminderPermission());

        setPermissionStatus(status);

        if (status !== 'granted') {
          setNotificationsEnabled(false);

          Alert.alert(
            'Notifications not enabled',
            'Please allow notifications in your device settings to receive Preggy reminders.'
          );

          return;
        }

        await scheduleMedicationReminders();
        await scheduleAppointmentReminders();

        const count = await getPreggyScheduledReminderCount();

        setScheduledCount(count);
        setNotificationsEnabled(true);

        Alert.alert('Notifications enabled', 'Preggy reminders are now turned on.');
      } else {
        await cancelAllPreggyReminders();

        setScheduledCount(0);
        setNotificationsEnabled(false);

        Alert.alert('Notifications turned off', 'Scheduled Preggy reminders have been cancelled.');
      }
    } catch (error) {
      console.log('Notification toggle error:', error);
      Alert.alert('Notification settings', 'Could not update reminders right now. Please try again.');
    } finally {
      setBusy(false);
      void refreshStatus();
    }
  }

  const permissionLabel =
    permissionStatus === 'granted'
      ? 'Allowed'
      : permissionStatus === 'denied'
        ? 'Blocked'
        : permissionStatus === 'checking'
          ? 'Checking'
          : 'Not enabled';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <AnimatedPressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color="#2A151B" />
          </AnimatedPressable>

          <Text style={styles.topTitle}>Reminders</Text>

          <View style={styles.topSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="notifications-outline" size={34} color="#CE6F79" />
          </View>

          <Text style={styles.eyebrow}>REMINDER SETTINGS</Text>
          <Text style={styles.title}>Stay on top of care</Text>
          <Text style={styles.subtitle}>
            Manage appointment and medication reminders from one calm place.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color="#CE6F79" />
          </View>

          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>Notification status</Text>
            <Text style={styles.statusCopy}>
              Permission: {permissionLabel} • Scheduled reminders: {scheduledCount}
            </Text>
          </View>
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>Preggy reminders</Text>
            <Text style={styles.toggleCopy}>
              Turn appointment and medication reminders on or off for this device.
            </Text>
          </View>

          <Switch
            value={notificationsEnabled}
            disabled={busy}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#E8DADB', true: '#F3A7AF' }}
            thumbColor={notificationsEnabled ? '#CE6F79' : '#FFFFFF'}
          />
        </View>

        {permissionStatus !== 'granted' ? (
          <AnimatedPressable
            onPress={enableNotifications}
            disabled={busy}
            style={[styles.enableButton, busy && styles.disabledRow]}
          >
            <Ionicons name="notifications-outline" size={21} color="#FFFFFF" />
            <Text style={styles.enableButtonText}>Enable Notifications</Text>
          </AnimatedPressable>
        ) : null}

        <View style={styles.card}>
          <ReminderRow
            icon="notifications-outline"
            title="Notification permission"
            copy={
              permissionStatus === 'granted'
                ? 'Notifications are allowed on this device.'
                : 'Allow Preggy to send reminder alerts.'
            }
            actionLabel={permissionStatus === 'granted' ? 'Allowed' : 'Enable'}
            disabled={busy || permissionStatus === 'granted'}
            onPress={enableNotifications}
          />

          <ReminderRow
            icon="calendar-outline"
            title="Schedule reminders"
            copy="Create reminders for saved medications and appointments."
            actionLabel="Schedule"
            disabled={busy}
            onPress={scheduleReminders}
          />

          <ReminderRow
            icon="trash-outline"
            title="Cancel reminders"
            copy="Remove all scheduled Preggy reminders from this device."
            actionLabel="Cancel"
            danger
            disabled={busy || scheduledCount === 0}
            onPress={cancelReminders}
          />
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={21} color="#8B6F76" />
          <Text style={styles.noteText}>
            Reminders only work on devices where Preggy is installed and notifications are allowed.
          </Text>
        </View>

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color="#CE6F79" />
            <Text style={styles.busyText}>Updating reminders...</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReminderRow({
  icon,
  title,
  copy,
  actionLabel,
  onPress,
  disabled,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  actionLabel: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.row, disabled && styles.disabledRow]}
    >
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={23} color={danger ? '#C94956' : '#CE6F79'} />
      </View>

      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
        <Text style={styles.rowCopy}>{copy}</Text>
      </View>

      <Text style={[styles.actionText, danger && styles.dangerText]}>{actionLabel}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  container: {
    paddingHorizontal: 22,
    paddingBottom: 34,
  },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  topTitle: {
    ...type.bodyStrong,
    color: '#2A151B',
    fontSize: 18,
  },
  topSpacer: {
    width: 46,
    height: 46,
  },
  hero: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    ...type.small,
    color: '#CE6F79',
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    ...type.title,
    color: '#2A151B',
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  subtitle: {
    ...type.body,
    color: '#765B60',
    lineHeight: 23,
    marginTop: 8,
  },
  statusCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  statusIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    ...type.bodyStrong,
    color: '#2A151B',
    fontSize: 17,
  },
  statusCopy: {
    ...type.small,
    color: '#765B60',
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '700',
  },
  card: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    overflow: 'hidden',
  },
  row: {
    minHeight: 92,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E4E1',
  },
  disabledRow: {
    opacity: 0.55,
  },
  rowIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: {
    backgroundColor: '#F9E9EA',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...type.bodyStrong,
    color: '#2A151B',
    fontSize: 16,
  },
  rowCopy: {
    ...type.small,
    color: '#765B60',
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '700',
  },
  actionText: {
    ...type.small,
    color: '#CE6F79',
    fontWeight: '900',
  },
  dangerText: {
    color: '#C94956',
  },
  note: {
    marginTop: 16,
    backgroundColor: '#FFF0F1',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    gap: 10,
  },
  noteText: {
    ...type.small,
    flex: 1,
    color: '#8B6F76',
    lineHeight: 19,
    fontWeight: '700',
  },
  busy: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  busyText: {
    ...type.small,
    color: '#765B60',
    fontWeight: '800',
  },

  enableButton: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },
  enableButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },

  toggleCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    ...type.bodyStrong,
    color: '#2A151B',
    fontSize: 17,
  },
  toggleCopy: {
    ...type.small,
    color: '#765B60',
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '700',
  },
});
