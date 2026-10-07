import {
  getProject,
  createProject,
  deleteProject,
  updateProject,
} from '@/services/supabase/projects.js';
import { downloadSource, removeSource, uploadSource } from '@/services/supabase/storage.js';
import { clampName } from '@/persistence/envelope.js';
import logger from '@/utils/logger.js';

export async function removeOwnedProject(row) {
  if (row?.source_path) {
    try {
      await removeSource(row.source_path);
    } catch (error) {
      logger.warn('DXF non rimosso', row.source_path, error);
    }
  }
  await deleteProject(row.id);
}

export async function duplicateOwnedProject(row, userId) {
  const full = await getProject(row.id);
  if (!full) {
    const error = new Error('Progetto non trovato');
    error.code = 'not_found';
    throw error;
  }
  const created = await createProject({
    kind: full.kind,
    name: clampName(`Copia di ${full.name}`, 'Copia'),
    description: full.description,
    schema_version: full.schema_version,
    data: full.data,
    units: full.units,
    material_id: full.material_id,
    thickness: full.thickness,
    width: full.width,
    height: full.height,
    bend_count: full.bend_count,
    part_status: full.part_status,
    source_file_name: full.source_file_name,
    source_path: null,
  });
  if (!full.source_path || !userId) return created;
  try {
    const text = await downloadSource(full.source_path);
    const path = await uploadSource(userId, created.id, text);
    return await updateProject(created.id, created.revision, { source_path: path });
  } catch (error) {
    logger.warn('Copia del DXF non riuscita', error);
    return created;
  }
}
