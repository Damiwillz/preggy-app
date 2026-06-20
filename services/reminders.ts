import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

type Medication = {
  id: string;
  user_id: string;
  name: string;
  time?: string | null;
  dosage?: string | null;
};

type Appointment = {
  id: string;
  user_id: string;
  title?: string | null;
  type?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  status?: string | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  const userId = data.user?.id;

  if (!userId) {
    throw new Error('No logged in user.');
  }

  return userId;
}

export async function requestReminderPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('preggy-reminders', {
      name: 'Preggy Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F4A6B4',
    });
  }

  return requested.granted;
}

function parseTime(time?: string | null) {
  if (!time) {
    return {
      hour: 9,
      minute: 0,
    };
  }

  const normalized = time.trim().toLowerCase();
  const ampm = normalized.includes('pm') ? 'pm' : normalized.includes('am') ? 'am' : null;
  const clean = normalized.replace('am', '').replace('pm', '').trim();
  const [hourRaw, minuteRaw] = clean.split(':');

  let hour = Number(hourRaw);
  const minute = Number(minuteRaw ?? 0);

  if (Number.isNaN(hour)) hour = 9;

  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;

  return {
    hour: Math.min(Math.max(hour, 0), 23),
    minute: Number.isNaN(minute) ? 0 : Math.min(Math.max(minute, 0), 59),
  };
}

function getAppointmentDate(date?: string | null, time?: string | null) {
  if (!date) return null;

  const parsedTime = parseTime(time);
  const appointmentDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(appointmentDate.getTime())) return null;

  appointmentDate.setHours(parsedTime.hour);
  appointmentDate.setMinutes(parsedTime.minute);
  appointmentDate.setSeconds(0);
  appointmentDate.setMilliseconds(0);

  return appointmentDate;
}

export async function cancelAllPreggyReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const preggyScheduled = scheduled.filter((item) => {
    const data = item.content.data ?? {};
    return data.source === 'preggy';
  });

  await Promise.all(
    preggyScheduled.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );

  return preggyScheduled.length;
}

export async function scheduleMedicationReminders() {
  const hasPermission = await requestReminderPermission();

  if (!hasPermission) {
    throw new Error('Notifications permission was not granted.');
  }

  const userId = await getUserId();

  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  const medications = (data ?? []) as Medication[];
  let count = 0;

  for (const medication of medications) {
    const parsedTime = parseTime(medication.time);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${medication.name}`,
        body: medication.dosage
          ? `Preggy reminder: take ${medication.dosage}.`
          : 'Preggy reminder: time for your medication or supplement.',
        sound: true,
        data: {
          source: 'preggy',
          type: 'medication',
          medication_id: medication.id,
        },
      },
      trigger: {
        type: 'calendar',
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        repeats: true,
        channelId: 'preggy-reminders',
      } as Notifications.NotificationTriggerInput,
    });

    count += 1;
  }

  return count;
}

export async function scheduleAppointmentReminders() {
  const hasPermission = await requestReminderPermission();

  if (!hasPermission) {
    throw new Error('Notifications permission was not granted.');
  }

  const userId = await getUserId();

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'Cancelled');

  if (error) throw error;

  const appointments = (data ?? []) as Appointment[];
  const now = new Date();
  let count = 0;

  for (const appointment of appointments) {
    const appointmentDate = getAppointmentDate(appointment.date, appointment.time);

    if (!appointmentDate) continue;

    const dayBefore = new Date(appointmentDate);
    dayBefore.setDate(dayBefore.getDate() - 1);

    const twoHoursBefore = new Date(appointmentDate);
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);

    const title = appointment.title || appointment.type || 'Pregnancy appointment';
    const location = appointment.location ? ` at ${appointment.location}` : '';

    const reminders = [
      {
        date: dayBefore,
        body: `${title}${location} is tomorrow.`,
        reminderType: 'appointment_day_before',
      },
      {
        date: twoHoursBefore,
        body: `${title}${location} is coming up soon.`,
        reminderType: 'appointment_two_hours',
      },
    ];

    for (const reminder of reminders) {
      if (reminder.date <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Preggy appointment reminder',
          body: reminder.body,
          sound: true,
          data: {
            source: 'preggy',
            type: reminder.reminderType,
            appointment_id: appointment.id,
          },
        },
        trigger: {
          type: 'date',
          date: reminder.date,
          channelId: 'preggy-reminders',
        } as Notifications.NotificationTriggerInput,
      });

      count += 1;
    }
  }

  return count;
}

export async function getPreggyScheduledReminderCount() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  return scheduled.filter((item) => item.content.data?.source === 'preggy').length;
}
