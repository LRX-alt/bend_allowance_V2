export function addSegment(segments) {
  const list = Array.isArray(segments) ? segments : [];
  return [...list, { length: 20, angle: list.length ? 90 : 0 }];
}

export function removeSegment(segments, index) {
  const list = Array.isArray(segments) ? segments : [];
  if (list.length <= 1) return list;
  return list.filter((_, itemIndex) => itemIndex !== index);
}
