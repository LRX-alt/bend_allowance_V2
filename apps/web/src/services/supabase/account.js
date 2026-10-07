import { getSupabase } from './client.js';
import { clearDraft } from '@/persistence/drafts.js';

export async function deleteAccount() {
  const supabase = await getSupabase();
  if (!supabase) {
    const error = new Error('Supabase non configurato');
    error.code = 'not_configured';
    throw error;
  }
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error || data?.error) {
    const wrapped = new Error('Eliminazione account non riuscita');
    wrapped.code = 'delete';
    throw wrapped;
  }
  await clearDraft('part');
  await clearDraft('profile');
  return data;
}
