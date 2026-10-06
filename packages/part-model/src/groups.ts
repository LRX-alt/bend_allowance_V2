import type { Feature, GroupProposal, Part } from './types';

function holes(part: Part): Extract<Feature, { kind: 'hole' }>[] {
  return part.features.filter((f): f is Extract<Feature, { kind: 'hole' }> => f.kind === 'hole');
}

export function proposeGroups(part: Part): GroupProposal[] {
  const proposals: GroupProposal[] = [];
  const list = holes(part);
  const used = new Set<string>();
  const axes = ['x', 'y'] as const;
  for (const axis of axes) {
    const other = axis === 'x' ? 'y' : 'x';
    const sorted = [...list].sort((a, b) => a.center[axis] - b.center[axis]);
    for (let i = 0; i < sorted.length; i++) {
      const seed = sorted[i];
      if (!seed || used.has(seed.id)) continue;
      const row = sorted.filter(h => !used.has(h.id) && Math.abs(h.center[other] - seed.center[other]) <= part.tolerances.point);
      if (row.length < 3) continue;
      const ordered = [...row].sort((a, b) => a.center[axis] - b.center[axis]);
      const pitches: number[] = [];
      for (let k = 1; k < ordered.length; k++) {
        const prev = ordered[k - 1];
        const cur = ordered[k];
        if (!prev || !cur) continue;
        pitches.push(cur.center[axis] - prev.center[axis]);
      }
      const pitch = pitches[0];
      if (pitch === undefined || pitch <= part.tolerances.point) continue;
      if (pitches.some(p => Math.abs(p - pitch) > part.tolerances.point)) continue;
      for (const h of ordered) used.add(h.id);
      proposals.push({ featureIds: ordered.map(h => h.id), axis, pitch, confidence: 1 });
    }
  }
  return proposals;
}

export function confirmGroup(part: Part, featureIds: string[], groupId: string): Part {
  const wanted = new Set(featureIds);
  return {
    ...part,
    features: part.features.map(feature => (wanted.has(feature.id) ? { ...feature, groupId } : feature)),
  };
}
