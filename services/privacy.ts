import { supabase } from '@/lib/supabase';

export type PrivacySettings = {
  id?: string;
  user_id: string;
  biometric_lock: boolean;
  health_data_sharing: boolean;
  analytics_tracking: boolean;
  personalized_tips: boolean;
  ai_chat_history: boolean;
  app_lock_enabled: boolean;
  appearance_mode: 'system' | 'light' | 'dark';
  accent_color: 'rose' | 'plum' | 'peach' | 'mint';
  created_at?: string;
  updated_at?: string;
};

const defaultSettings = {
  biometric_lock: false,
  health_data_sharing: false,
  analytics_tracking: true,
  personalized_tips: true,
  ai_chat_history: true,
  app_lock_enabled: false,
  appearance_mode: 'system',
  accent_color: 'rose',
};

export async function getMyPrivacySettings() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('No logged in user.');
  }

  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data as PrivacySettings;
  }

  const { data: created, error: createError } = await supabase
    .from('privacy_settings')
    .insert({
      user_id: userId,
      ...defaultSettings,
    })
    .select()
    .single();

  if (createError) throw createError;

  return created as PrivacySettings;
}

export async function updateMyPrivacySettings(updates: Partial<PrivacySettings>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('No logged in user.');
  }

  const { data, error } = await supabase
    .from('privacy_settings')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data as PrivacySettings;
}
