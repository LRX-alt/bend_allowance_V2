import { getSupabase } from './client.js';

export const PROJECT_BUCKET = 'project-files';

export function sourceObjectPath(userId, projectId) {
  return `${userId}/${projectId}/source.dxf`;
}

function requireClient(supabase) {
  if (supabase) return;
  const error = new Error('Supabase non configurato');
  error.code = 'not_configured';
  throw error;
}

export async function uploadSource(userId, projectId, text) {
  const supabase = await getSupabase();
  requireClient(supabase);
  const path = sourceObjectPath(userId, projectId);
  const body = new Blob([text], { type: 'application/dxf' });
  const { error } = await supabase.storage.from(PROJECT_BUCKET).upload(path, body, {
    contentType: 'application/dxf',
    upsert: false,
  });
  if (error) {
    const wrapped = new Error('Upload DXF non riuscito');
    wrapped.code = 'storage';
    throw wrapped;
  }
  return path;
}

export async function downloadSource(path) {
  const supabase = await getSupabase();
  requireClient(supabase);
  const { data, error } = await supabase.storage.from(PROJECT_BUCKET).download(path);
  if (error) {
    const wrapped = new Error('Download DXF non riuscito');
    wrapped.code = 'storage';
    throw wrapped;
  }
  return data.text();
}

export async function removeSource(path) {
  if (!path) return;
  const supabase = await getSupabase();
  requireClient(supabase);
  const { error } = await supabase.storage.from(PROJECT_BUCKET).remove([path]);
  if (error) {
    const wrapped = new Error('Rimozione DXF non riuscita');
    wrapped.code = 'storage';
    throw wrapped;
  }
}
