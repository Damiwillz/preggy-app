import { supabase } from '@/lib/supabase';

export async function requestAccountDeletion() {
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = data.user;

  if (!user) {
    throw new Error('You need to be logged in to request account deletion.');
  }

  const { error } = await supabase
    .from('account_deletion_requests')
    .upsert(
      {
        user_id: user.id,
        email: user.email,
        status: 'pending',
        requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    throw error;
  }

  return true;
}
