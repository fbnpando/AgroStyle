// Supabase Storage uploader.
// Configura en .env.local:
//   VITE_SUPABASE_URL=https://xxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//   VITE_SUPABASE_BUCKET=agrostyle   (opcional, default 'agrostyle')

import { supabase, SUPABASE_BUCKET, isSupabaseConfigured } from './supabase';

export { isSupabaseConfigured as isUploaderConfigured };

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function upload(file, folder = 'misc') {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase no esta configurado. Crea .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY y reinicia el dev server.'
    );
  }

  const path = `${folder}/${Date.now()}_${sanitize(file.name)}`;

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw new Error(`No se pudo subir el archivo: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// Para imagenes
export function uploadImage(file, folder = 'misc') {
  return upload(file, folder);
}

// Para cualquier archivo (PDFs, docs, etc.)
export function uploadFile(file, folder = 'misc') {
  return upload(file, folder);
}
