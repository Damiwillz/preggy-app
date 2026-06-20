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

export async function getMyProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const user = userData.user;

  if (!user) {
    throw new Error('No logged in user.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data as UserProfile;
  }

  const fullName =
    typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : getFallbackName(user.email);

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: fullName,
      username: fullName,
      baby_nickname: 'Peanut',
      pregnancy_week: 24,
      pregnancy_days: 0,
    })
    .select()
    .single();

  if (createError) throw createError;

  await supabase.from('privacy_settings').upsert({
    user_id: user.id,
  });

  return createdProfile as UserProfile;
}

export async function updateMyProfile(profile: Partial<UserProfile>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('No logged in user.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return data as UserProfile;
}