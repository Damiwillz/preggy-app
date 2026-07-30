import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserProfile } from '@/services/profile';

const GUEST_MODE_KEY = '@preggy_guest_mode';
const GUEST_PROFILE_KEY = '@preggy_guest_profile';
const GUEST_THEME_KEY = '@preggy_guest_theme';
const GUEST_MEDICATIONS_KEY = '@preggy_guest_medications';
const GUEST_APPOINTMENTS_KEY = '@preggy_guest_appointments';

export type GuestAppearanceMode = 'system' | 'light' | 'dark';
export type GuestAccentColor = 'rose' | 'plum' | 'peach' | 'mint';

export type GuestMedication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  time: string | null;
  frequency: string | null;
  instructions: string | null;
  taken: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type GuestAppointment = {
  id: string;
  user_id: string;
  title: string | null;
  doctor: string | null;
  clinic: string | null;
  appointment_at: string | null;
  status: string | null;
  notes: string | null;
  doctor_name: string | null;
  clinic_name: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  type: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const defaultGuestProfile: UserProfile = {
  id: 'guest-user',
  full_name: 'Guest Mom',
  username: 'Guest Mom',
  avatar_url: null,
  due_date: null,
  baby_nickname: 'Peanut',
  pregnancy_week: 20,
  pregnancy_days: 0,
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, list: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

function makeAppointmentAt(date?: string | null, time?: string | null) {
  if (!date) return null;

  const cleanTime = (time || '').trim().toUpperCase();
  const timeForDate = /^\d{1,2}:\d{2}$/.test(cleanTime) ? cleanTime : '09:00';
  const parsed = new Date(`${date}T${timeForDate}:00`);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

export async function enableGuestMode() {
  await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');

  const savedProfile = await AsyncStorage.getItem(GUEST_PROFILE_KEY);

  if (!savedProfile) {
    await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(defaultGuestProfile));
  }
}

export async function disableGuestMode() {
  await AsyncStorage.removeItem(GUEST_MODE_KEY);
}

export async function isGuestMode() {
  const value = await AsyncStorage.getItem(GUEST_MODE_KEY);

  return value === 'true';
}

export async function getGuestProfile(): Promise<UserProfile> {
  const savedProfile = await AsyncStorage.getItem(GUEST_PROFILE_KEY);

  if (!savedProfile) {
    return defaultGuestProfile;
  }

  try {
    return {
      ...defaultGuestProfile,
      ...JSON.parse(savedProfile),
    };
  } catch {
    return defaultGuestProfile;
  }
}

export async function updateGuestProfile(profile: Partial<UserProfile>) {
  const currentProfile = await getGuestProfile();

  const nextProfile: UserProfile = {
    ...currentProfile,
    ...profile,
    id: 'guest-user',
    full_name: profile.full_name?.trim() || currentProfile.full_name,
    username: profile.username?.trim() || profile.full_name?.trim() || currentProfile.username,
  };

  await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(nextProfile));

  return nextProfile;
}

export async function getGuestThemeSettings() {
  const raw = await AsyncStorage.getItem(GUEST_THEME_KEY);

  if (!raw) {
    return {
      appearance_mode: 'system' as GuestAppearanceMode,
      accent_color: 'rose' as GuestAccentColor,
    };
  }

  try {
    return {
      appearance_mode: 'system' as GuestAppearanceMode,
      accent_color: 'rose' as GuestAccentColor,
      ...JSON.parse(raw),
    };
  } catch {
    return {
      appearance_mode: 'system' as GuestAppearanceMode,
      accent_color: 'rose' as GuestAccentColor,
    };
  }
}

export async function updateGuestThemeSettings(settings: {
  appearance_mode?: GuestAppearanceMode;
  accent_color?: GuestAccentColor;
}) {
  const current = await getGuestThemeSettings();
  const next = {
    ...current,
    ...settings,
  };

  await AsyncStorage.setItem(GUEST_THEME_KEY, JSON.stringify(next));

  return next;
}

export async function getGuestMedications() {
  const medications = await readList<GuestMedication>(GUEST_MEDICATIONS_KEY);

  return medications.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}

export async function getGuestMedication(id: string | null) {
  if (!id) return null;

  const medications = await getGuestMedications();

  return medications.find((item) => item.id === id) ?? null;
}

export async function saveGuestMedication(
  medication: Partial<GuestMedication> & { name: string },
  medicationId?: string | null
) {
  const medications = await getGuestMedications();
  const now = new Date().toISOString();

  if (medicationId) {
    const nextMedications = medications.map((item) =>
      item.id === medicationId
        ? {
            ...item,
            ...medication,
            id: item.id,
            user_id: 'guest-user',
            updated_at: now,
          }
        : item
    );

    await writeList(GUEST_MEDICATIONS_KEY, nextMedications);

    return nextMedications.find((item) => item.id === medicationId) ?? null;
  }

  const nextMedication: GuestMedication = {
    id: makeId('guest-med'),
    user_id: 'guest-user',
    name: medication.name,
    dosage: medication.dosage ?? null,
    time: medication.time ?? null,
    frequency: medication.frequency ?? 'Daily',
    instructions: medication.instructions ?? null,
    taken: medication.taken ?? false,
    created_at: now,
    updated_at: now,
  };

  await writeList(GUEST_MEDICATIONS_KEY, [...medications, nextMedication]);

  return nextMedication;
}

export async function updateGuestMedication(id: string, updates: Partial<GuestMedication>) {
  const medications = await getGuestMedications();
  const now = new Date().toISOString();

  const nextMedications = medications.map((item) =>
    item.id === id
      ? {
          ...item,
          ...updates,
          id: item.id,
          user_id: 'guest-user',
          updated_at: now,
        }
      : item
  );

  await writeList(GUEST_MEDICATIONS_KEY, nextMedications);

  return nextMedications.find((item) => item.id === id) ?? null;
}

export async function deleteGuestMedication(id: string) {
  const medications = await getGuestMedications();

  await writeList(
    GUEST_MEDICATIONS_KEY,
    medications.filter((item) => item.id !== id)
  );
}

export async function getGuestAppointments() {
  const appointments = await readList<GuestAppointment>(GUEST_APPOINTMENTS_KEY);

  return appointments.sort((a, b) => {
    const first = Date.parse(a.appointment_at || a.appointment_date || a.date || a.created_at || '');
    const second = Date.parse(b.appointment_at || b.appointment_date || b.date || b.created_at || '');

    return (Number.isFinite(first) ? first : Number.MAX_SAFE_INTEGER) -
      (Number.isFinite(second) ? second : Number.MAX_SAFE_INTEGER);
  });
}

export async function getGuestAppointment(id: string | null) {
  if (!id) return null;

  const appointments = await getGuestAppointments();

  return appointments.find((item) => item.id === id) ?? null;
}

export async function saveGuestAppointment(
  appointment: Partial<GuestAppointment> & { title: string },
  appointmentId?: string | null
) {
  const appointments = await getGuestAppointments();
  const now = new Date().toISOString();
  const cleanDate = appointment.appointment_date || appointment.date || null;
  const cleanTime = appointment.appointment_time || appointment.time || null;
  const appointmentAt = appointment.appointment_at ?? makeAppointmentAt(cleanDate, cleanTime);

  if (appointmentId) {
    const nextAppointments = appointments.map((item) =>
      item.id === appointmentId
        ? {
            ...item,
            ...appointment,
            id: item.id,
            user_id: 'guest-user',
            appointment_at: appointmentAt,
            updated_at: now,
          }
        : item
    );

    await writeList(GUEST_APPOINTMENTS_KEY, nextAppointments);

    return nextAppointments.find((item) => item.id === appointmentId) ?? null;
  }

  const nextAppointment: GuestAppointment = {
    id: makeId('guest-appt'),
    user_id: 'guest-user',
    title: appointment.title,
    doctor: appointment.doctor ?? null,
    clinic: appointment.clinic ?? null,
    appointment_at: appointmentAt,
    status: appointment.status ?? 'Upcoming',
    notes: appointment.notes ?? null,
    doctor_name: appointment.doctor_name ?? appointment.doctor ?? null,
    clinic_name: appointment.clinic_name ?? appointment.clinic ?? appointment.location ?? null,
    appointment_date: cleanDate,
    appointment_time: cleanTime,
    date: appointment.date ?? cleanDate,
    time: appointment.time ?? cleanTime,
    location: appointment.location ?? appointment.clinic ?? null,
    type: appointment.type ?? appointment.title,
    created_at: now,
    updated_at: now,
  };

  await writeList(GUEST_APPOINTMENTS_KEY, [...appointments, nextAppointment]);

  return nextAppointment;
}

export async function updateGuestAppointment(id: string, updates: Partial<GuestAppointment>) {
  const appointments = await getGuestAppointments();
  const now = new Date().toISOString();

  const nextAppointments = appointments.map((item) =>
    item.id === id
      ? {
          ...item,
          ...updates,
          id: item.id,
          user_id: 'guest-user',
          updated_at: now,
        }
      : item
  );

  await writeList(GUEST_APPOINTMENTS_KEY, nextAppointments);

  return nextAppointments.find((item) => item.id === id) ?? null;
}

export async function deleteGuestAppointment(id: string) {
  const appointments = await getGuestAppointments();

  await writeList(
    GUEST_APPOINTMENTS_KEY,
    appointments.filter((item) => item.id !== id)
  );
}
