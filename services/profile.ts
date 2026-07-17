import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  due_date: string | null;
  pregnancy_week: number | null;
  pregnancy_days: number | null;
  baby_nickname: string | null;
};

function getFallbackName(email?: string | null) {
  if (!email) return 'Sarah Miller';

  const name = email.split('@')[0] ?? 'Sarah';

  return name
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getUserName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.full_name;

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }

  return getFallbackName(user.email);
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  if (!data.session?.user) {
    throw new Error('Please log in again before saving your pregnancy profile.');
  }

  return data.session.user;
}

function starterProfile(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const fullName = getUserName(user);

  return {
    id: user.id,
    full_name: fullName,
    username: fullName,
    baby_nickname: 'Peanut',
    pregnancy_week: 24,
    pregnancy_days: 0,
  };
}

function withoutDueDate(profile: Partial<UserProfile>) {
  const { due_date: _dueDate, ...rest } = profile;

  return rest;
}

function shouldRetryWithoutDueDate(error: unknown, profile: Partial<UserProfile>) {
  if (profile.due_date === undefined) return false;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : '';

  return message.toLowerCase().includes('due_date');
}

export async function getMyProfile() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data as UserProfile;
  }

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert(starterProfile(user))
    .select()
    .single();

  if (createError) throw createError;

  return createdProfile as UserProfile;
}

async function updateMyProfileAttempt(profile: Partial<UserProfile>, canRetryDueDate: boolean): Promise<UserProfile> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    if (canRetryDueDate && shouldRetryWithoutDueDate(error, profile)) {
      return updateMyProfileAttempt(withoutDueDate(profile), false);
    }

    throw error;
  }

  if (data) {
    return data as UserProfile;
  }

  const base = starterProfile(user);
  const fullName = profile.full_name?.trim() || base.full_name;
  const username = profile.username?.trim() || fullName;

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      ...base,
      ...profile,
      id: user.id,
      full_name: fullName,
      username,
    })
    .select()
    .single();

  if (createError) {
    if (canRetryDueDate && shouldRetryWithoutDueDate(createError, profile)) {
      return updateMyProfileAttempt(withoutDueDate(profile), false);
    }

    throw createError;
  }

  return createdProfile as UserProfile;
}

export async function updateMyProfile(profile: Partial<UserProfile>) {
  return updateMyProfileAttempt(profile, true);
}
