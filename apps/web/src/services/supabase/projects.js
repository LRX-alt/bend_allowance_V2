import { getSupabase } from './client.js';

const LIST_COLUMNS =
  'id, kind, name, description, units, material_id, thickness, width, height, bend_count, part_status, source_file_name, source_path, revision, schema_version, created_at, updated_at';

const SORTS = {
  updated_at: { column: 'updated_at', ascending: false },
  name: { column: 'name', ascending: true },
};

function requireClient(supabase) {
  if (supabase) return;
  const error = new Error('Supabase non configurato');
  error.code = 'not_configured';
  throw error;
}

function cleanSearch(value) {
  return String(value || '')
    .replace(/[%_\\]/g, ' ')
    .trim();
}

export async function listProjects({
  search = '',
  sort = 'updated_at',
  page = 0,
  pageSize = 50,
} = {}) {
  const supabase = await getSupabase();
  requireClient(supabase);
  const order = SORTS[sort] || SORTS.updated_at;
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('projects')
    .select(LIST_COLUMNS, { count: 'exact' })
    .order(order.column, { ascending: order.ascending });
  const term = cleanSearch(search);
  if (term) query = query.ilike('name', `%${term}%`);
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function listAllProjects() {
  const supabase = await getSupabase();
  requireClient(supabase);
  const pageSize = 100;
  const rows = [];
  for (let page = 0; page < 100; page += 1) {
    const from = page * pageSize;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export async function getProject(id) {
  const supabase = await getSupabase();
  requireClient(supabase);
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(row) {
  const supabase = await getSupabase();
  requireClient(supabase);
  const { data, error } = await supabase.from('projects').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateProject(id, revision, patch) {
  const supabase = await getSupabase();
  requireClient(supabase);
  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .eq('revision', revision)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: existing, error: readError } = await supabase
    .from('projects')
    .select('id, revision')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) {
    const missing = new Error('Progetto non trovato');
    missing.code = 'not_found';
    throw missing;
  }
  return { conflict: true, remoteRevision: existing.revision };
}

export async function deleteProject(id) {
  const supabase = await getSupabase();
  requireClient(supabase);
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    const missing = new Error('Progetto non trovato');
    missing.code = 'not_found';
    throw missing;
  }
}
