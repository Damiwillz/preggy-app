import { supabase } from '@/lib/supabase';
import { disableGuestMode } from '@/services/guest';

async function createStarterRows(userId: string, fullName: string) {
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      username: fullName,
      baby_nickname: 'Peanut',
      pregnancy_week: 24,
      pregnancy_days: 0,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.log('Starter profile skipped:', profileError.message);
  }

  const { error: privacyError } = await supabase.from('privacy_settings').upsert({
    user_id: userId,
  });

  if (privacyError) {
    console.log('Starter privacy skipped:', privacyError.message);
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const cleanEmail = email.trim();
  const cleanName = fullName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
      },
    },
  });

  if (error) throw error;

  if (data.session?.user.id) {
    await createStarterRows(data.session.user.id, cleanName);
  }

  await disableGuestMode();

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  await disableGuestMode();

  return data;
}

export async function sendPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'preggy://auth/update-password',
  });

  if (error) throw error;

  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  await disableGuestMode();

  const { error } = await supabase.auth.signOut();

  if (error && !error.message.toLowerCase().includes('session')) {
    throw error;
  }
}
