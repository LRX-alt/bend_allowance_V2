import { del, get, set } from 'idb-keyval';

const memory = new Map();

function keyFor(kind) {
  return `sl-draft-${kind}`;
}

function canUseIdb() {
  return typeof indexedDB !== 'undefined' && !import.meta.env.SSR;
}

export async function writeDraft(draft) {
  const key = keyFor(draft.kind);
  if (!canUseIdb()) {
    memory.set(key, draft);
    return;
  }
  await set(key, draft);
}

export async function readDraft(kind) {
  const key = keyFor(kind);
  if (!canUseIdb()) return memory.get(key) || null;
  return (await get(key)) || null;
}

export async function clearDraft(kind) {
  const key = keyFor(kind);
  memory.delete(key);
  if (!canUseIdb()) return;
  await del(key);
}
