export function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export async function runSave({
  online = isOnline,
  repo,
  projectId,
  revision,
  row,
  sourceText,
  userId,
  copyFromPath,
}) {
  if (!online()) return { status: 'offline' };
  try {
    if (!projectId) {
      const created = await repo.create(row);
      return attachSource({ repo, row: created, sourceText, userId, copyFromPath });
    }
    const updated = await repo.update(projectId, revision, row);
    if (updated?.conflict) return { status: 'conflict', remoteRevision: updated.remoteRevision };
    return { status: 'saved', row: updated, fileWarning: false };
  } catch (error) {
    if (
      error?.code === 'offline' ||
      (typeof navigator !== 'undefined' && navigator.onLine === false)
    ) {
      return { status: 'offline', error };
    }
    return { status: 'error', error };
  }
}

async function attachSource({ repo, row, sourceText, userId, copyFromPath }) {
  let text = sourceText;
  if (!text && copyFromPath && repo.download) {
    try {
      text = await repo.download(copyFromPath);
    } catch (error) {
      return { status: 'saved', row, fileWarning: true, error };
    }
  }
  if (!text) return { status: 'saved', row, fileWarning: false };
  try {
    const path = await repo.upload(userId, row.id, text);
    const linked = await repo.update(row.id, row.revision, { source_path: path });
    if (linked?.conflict) return { status: 'saved', row, fileWarning: true };
    return { status: 'saved', row: linked, fileWarning: false };
  } catch (error) {
    return { status: 'saved', row, fileWarning: true, error };
  }
}
