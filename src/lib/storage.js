import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

async function uploadImage(bucket, path, uri) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return { path };
}

export function publicUrl(bucket, path) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadBarbershopImage(barbershopId, uri) {
  return uploadImage('barbershops', `${barbershopId}/${Date.now()}.jpg`, uri);
}

export async function uploadAvatar(userId, uri) {
  return uploadImage('avatars', `${userId}/${Date.now()}.jpg`, uri);
}

export async function removeStoredImage(bucket, path) {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
