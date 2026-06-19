import { supabase } from '@/lib/supabase';

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  const userId = data.user?.id;

  if (userId) {
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      username: fullName,
      baby_nickname: 'Peanut',
      pregnancy_week: 24,
      pregnancy_days: 0,
    });

    await supabase.from('privacy_settings').upsert({
      user_id: userId,
    });
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function sendPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) throw error;

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}