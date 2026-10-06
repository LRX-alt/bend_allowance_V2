import type { Part } from './types';

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) out[key] = sortValue(src[key]);
    return out;
  }
  return value;
}

export function serialize(part: Part): string {
  return JSON.stringify(sortValue(part));
}

export function deserialize(raw: string): Part {
  return JSON.parse(raw) as Part;
}
