import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';
import { updateMyProfile } from '@/services/profile';

function getFileExtension(uri: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const parts = cleanUri.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';

  if (extension === 'png') return 'png';
  if (extension === 'webp') return 'webp';
  if (extension === 'jpeg') return 'jpg';

  return 'jpg';
}

function getContentType(extension: string) {
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';

  return 'image/jpeg';
}

export async function uploadMyAvatar(uri: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const user = userData.user;

  if (!user) {
    throw new Error('No logged in user.');
  }

  const extension = getFileExtension(uri);
  const contentType = getContentType(extension);
  const path = `${user.id}/avatar.${extension}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);

  const avatarUrl = `${data.publicUrl}?updated=${Date.now()}`;

  await updateMyProfile({
    avatar_url: avatarUrl,
  });

  return avatarUrl;
}