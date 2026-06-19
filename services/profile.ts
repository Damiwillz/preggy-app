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

export async function getMyProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('No logged in user.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return data as UserProfile;
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