import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserProfile } from '@/services/profile';

const GUEST_MODE_KEY = '@preggy_guest_mode';
const GUEST_PROFILE_KEY = '@preggy_guest_profile';

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
