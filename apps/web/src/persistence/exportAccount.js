import { listAllProjects } from '@/services/supabase/projects.js';
import { downloadSource } from '@/services/supabase/storage.js';

export async function buildAccountExport({ email, profile }) {
  const projects = await listAllProjects();
  const sourceFiles = [];
  for (const project of projects) {
    if (!project.source_path) continue;
    try {
      sourceFiles.push({
        projectId: project.id,
        path: project.source_path,
        dxf: await downloadSource(project.source_path),
      });
    } catch {
      sourceFiles.push({ projectId: project.id, path: project.source_path, missing: true });
    }
  }
  return {
    exportedAt: new Date().toISOString(),
    account: {
      email,
      displayName: profile?.display_name || '',
      createdAt: profile?.created_at || null,
    },
    projects,
    sourceFiles,
  };
}
