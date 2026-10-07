import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function removeUserFiles(admin: ReturnType<typeof createClient>, userId: string) {
  const bucket = admin.storage.from('project-files');
  const folders = await listAll(bucket, userId);
  for (const folder of folders) {
    const prefix = `${userId}/${folder.name}`;
    const files = await listAll(bucket, prefix);
    const paths = files.filter(file => file.id).map(file => `${prefix}/${file.name}`);
    if (!paths.length) continue;
    const { error } = await bucket.remove(paths);
    if (error) return false;
  }
  return true;
}

async function listAll(
  bucket: ReturnType<ReturnType<typeof createClient>['storage']['from']>,
  prefix: string
) {
  const rows: Array<{ name: string; id: string | null }> = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const { data, error } = await bucket.list(prefix, { limit: 100, offset });
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 100) break;
  }
  return rows;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization || !supabaseUrl || !anonKey || !serviceKey) return json({ error: 'unauthorized' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const removed = await removeUserFiles(admin, userData.user.id);
    if (!removed) return json({ error: 'storage' }, 500);
  } catch {
    return json({ error: 'storage' }, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteError && deleteError.status !== 404) return json({ error: 'auth' }, 500);
  return json({ ok: true }, 200);
});
