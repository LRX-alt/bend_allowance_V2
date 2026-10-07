import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { importDxf } from '@sviluppolamiera/dxf';
import { nextId, serialize } from '@sviluppolamiera/part-model';
import { migrate } from './envelope.js';
import { collectIds, partRow, restorePart, summaryOf } from './partAdapter.js';
import { profileFingerprint, profileFromLocal, profileRow } from './profileAdapter.js';
import { runSave } from './saveDocument.js';

const corpus = resolve(fileURLToPath(new URL('../../../../corpus', import.meta.url)));

describe('persistenza del pezzo', () => {
  it('serializza e ripristina i DXF del corpus senza cambiare il pezzo', () => {
    const files = readdirSync(corpus).filter(name => name.endsWith('.dxf'));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const imported = importDxf(readFileSync(resolve(corpus, name), 'utf8'), {
        confirmUnits: 'mm',
      });
      if (!imported.part) continue;
      const row = partRow(imported.part, name);
      const migrated = migrate(row.kind, row.schema_version, row.data);
      expect(migrated.status).toBe('ok');
      const restored = restorePart(migrated.data);
      expect(serialize(restored)).toBe(serialize(imported.part));
      const fresh = nextId('cv');
      expect(collectIds(restored)).not.toContain(fresh);
      expect(summaryOf(restored).bend_count).toBe(imported.part.bendLines.length);
    }
  });

  it('rifiuta un pezzo senza contorno e una versione futura', () => {
    expect(() => restorePart({ part: { name: 'x' } })).toThrow();
    expect(migrate('part', 2, { part: {} }).status).toBe('too-new');
    expect(migrate('part', 9, { part: {} }, { part: {}, profile: {} }).status).toBe('too-new');
  });

  it('applica una migrazione registrata', () => {
    const result = migrate(
      'profile',
      1,
      { profile: { spessore: 1 } },
      { profile: { 1: data => ({ profile: { ...data.profile, spessore: 2 } }) } },
      2
    );
    expect(result).toEqual({
      status: 'ok',
      schemaVersion: 2,
      data: { profile: { spessore: 2 } },
    });
  });
});

describe('persistenza del profilo', () => {
  it('porta un progetto locale nel modello cloud', () => {
    const row = profileRow(
      profileFromLocal({
        nome: 'Staffa',
        spessore: 2,
        raggioPiega: 1,
        fattoreK: 0.33,
        materialeSelezionato: 'steel_mild',
        modo: 'esterne',
        angolo: 90,
        latoA: 40,
        latoB: 20,
        larghezza: 100,
        segments: [{ length: 40, angle: 0 }],
      }),
      'Staffa'
    );
    expect(row.kind).toBe('profile');
    expect(row.name).toBe('Staffa');
    expect(row.bend_count).toBe(1);
    expect(row.material_id).toBe('steel_mild');
    expect(profileFingerprint(row.data.profile)).toBe(profileFingerprint(row.data.profile));
  });
});

describe('salvataggio', () => {
  it('crea, aggiorna, segnala conflitto e resta in coda se offline', async () => {
    const created = { id: 'p1', revision: 1, updated_at: '2026-01-01T00:00:00.000Z' };
    const repo = {
      create: async row => ({ ...created, ...row }),
      update: async (id, revision, patch) => {
        if (revision !== 1) return { conflict: true, remoteRevision: 4 };
        return { ...created, ...patch, id, revision: 2 };
      },
      upload: async (userId, projectId) => `${userId}/${projectId}/source.dxf`,
    };
    const offline = await runSave({
      online: () => false,
      repo,
      projectId: '',
      revision: null,
      row: { name: 'A' },
      sourceText: null,
      userId: 'u',
    });
    expect(offline.status).toBe('offline');

    const saved = await runSave({
      online: () => true,
      repo,
      projectId: '',
      revision: null,
      row: { name: 'A' },
      sourceText: '0\nEOF\n',
      userId: 'user',
    });
    expect(saved.status).toBe('saved');
    expect(saved.row.source_path).toBe('user/p1/source.dxf');
    expect(saved.row.revision).toBe(2);

    const conflict = await runSave({
      online: () => true,
      repo,
      projectId: 'p1',
      revision: 3,
      row: { name: 'B' },
      sourceText: null,
      userId: 'user',
    });
    expect(conflict.status).toBe('conflict');
  });

  it('tiene il progetto se il DXF originale non si carica', async () => {
    const result = await runSave({
      online: () => true,
      repo: {
        create: async () => ({ id: 'p2', revision: 1 }),
        update: async () => ({ conflict: true }),
        upload: async () => {
          throw new Error('storage');
        },
      },
      projectId: '',
      revision: null,
      row: { name: 'A' },
      sourceText: 'dxf',
      userId: 'user',
    });
    expect(result.status).toBe('saved');
    expect(result.fileWarning).toBe(true);
    expect(result.row.id).toBe('p2');
  });
});
