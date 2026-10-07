import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';

const envFile = fileURLToPath(new URL('../../.env.test.local', import.meta.url));
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]])
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const enabled = Boolean(url && anonKey && serviceKey);
const suite = enabled ? describe : describe.skip;

function client(key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function row(name) {
  return {
    kind: 'profile',
    name,
    schema_version: 1,
    data: { profile: { spessore: 2, segments: [] } },
    units: 'mm',
    thickness: 2,
    bend_count: 1,
  };
}

suite('row level security e storage', () => {
  const admin = enabled ? client(serviceKey) : null;
  const anon = enabled ? client(anonKey) : null;
  const userA = enabled ? client(anonKey) : null;
  const userB = enabled ? client(anonKey) : null;
  const stamp = Date.now();
  const emailA = `rls-a-${stamp}@example.com`;
  const emailB = `rls-b-${stamp}@example.com`;
  const password = `Rls-${stamp}-password`;
  let idA = '';
  let idB = '';
  let projectA = '';

  afterAll(async () => {
    if (!admin) return;
    if (idA) await admin.auth.admin.deleteUser(idA);
    if (idB) await admin.auth.admin.deleteUser(idB);
  });

  it('crea due utenti di prova', async () => {
    const first = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });
    const second = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    });
    expect(first.error, first.error?.message).toBeNull();
    expect(second.error, second.error?.message).toBeNull();
    idA = first.data.user.id;
    idB = second.data.user.id;
    const loginA = await userA.auth.signInWithPassword({ email: emailA, password });
    const loginB = await userB.auth.signInWithPassword({ email: emailB, password });
    expect(loginA.error, loginA.error?.message).toBeNull();
    expect(loginB.error, loginB.error?.message).toBeNull();
  });

  it('consente il crud solo sul proprio progetto', async () => {
    const created = await userA.from('projects').insert(row('Profilo A')).select('*').single();
    expect(created.error, created.error?.message).toBeNull();
    projectA = created.data.id;
    expect(created.data.user_id).toBe(idA);
    expect(created.data.revision).toBe(1);

    const updated = await userA
      .from('projects')
      .update({ name: 'Profilo A2' })
      .eq('id', projectA)
      .eq('revision', 1)
      .select('name, revision, user_id')
      .single();
    expect(updated.error, updated.error?.message).toBeNull();
    expect(updated.data.name).toBe('Profilo A2');
    expect(updated.data.revision).toBe(2);
    expect(updated.data.user_id).toBe(idA);

    const mine = await userA.from('projects').select('id').eq('id', projectA);
    expect(mine.data).toHaveLength(1);
  });

  it('impedisce a B e agli anonimi di leggere, modificare o cancellare il progetto di A', async () => {
    const seenByB = await userB.from('projects').select('id, name').eq('id', projectA);
    expect(seenByB.data ?? []).toEqual([]);
    const renamed = await userB
      .from('projects')
      .update({ name: 'Violazione' })
      .eq('id', projectA)
      .select('id');
    expect(renamed.data ?? []).toEqual([]);
    const removed = await userB.from('projects').delete().eq('id', projectA).select('id');
    expect(removed.data ?? []).toEqual([]);
    const still = await userA.from('projects').select('name').eq('id', projectA).single();
    expect(still.data.name).toBe('Profilo A2');

    const anonymous = await anon.from('projects').select('id');
    expect(anonymous.data ?? []).toEqual([]);

    const ownerChange = await userA.from('projects').update({ user_id: idB }).eq('id', projectA);
    expect(ownerChange.error).toBeTruthy();
    const owned = await userA.from('projects').select('user_id').eq('id', projectA).single();
    expect(owned.data.user_id).toBe(idA);

    const foreignInsert = await userA.from('projects').insert({ ...row('Altrui'), user_id: idB });
    expect(foreignInsert.error).toBeTruthy();
  });

  it('limita lo storage al prefisso del proprietario', async () => {
    const pathA = `${idA}/${projectA}/source.dxf`;
    const uploaded = await userA.storage
      .from('project-files')
      .upload(pathA, new Blob(['0\nEOF\n']), {
        contentType: 'application/dxf',
      });
    expect(uploaded.error, uploaded.error?.message).toBeNull();
    const downloaded = await userA.storage.from('project-files').download(pathA);
    expect(downloaded.error).toBeNull();
    expect(await downloaded.data.text()).toContain('EOF');

    const stolen = await userB.storage.from('project-files').download(pathA);
    expect(stolen.error).toBeTruthy();
    const overwritten = await userB.storage.from('project-files').upload(pathA, new Blob(['no']), {
      contentType: 'application/dxf',
      upsert: true,
    });
    expect(overwritten.error).toBeTruthy();
    const removed = await userB.storage.from('project-files').remove([pathA]);
    expect(
      removed.error || (await userA.storage.from('project-files').download(pathA)).data
    ).toBeTruthy();

    const orphan = await userA.storage
      .from('project-files')
      .upload(`${idA}/${crypto.randomUUID()}/source.dxf`, new Blob(['x']), {
        contentType: 'application/dxf',
      });
    expect(orphan.error).toBeTruthy();

    const deleted = await userA.storage.from('project-files').remove([pathA]);
    expect(deleted.error).toBeNull();
  });
});
