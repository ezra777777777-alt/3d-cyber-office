import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function slug(value) {
  return (
    String(value || 'artifact')
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'artifact'
  );
}

export function createArtifactStore(workspaceRoot = process.cwd()) {
  const root = path.resolve(workspaceRoot);
  const artifactDir = path.join(root, '.local-runtime', 'artifacts');

  async function writeArtifact(input) {
    await mkdir(artifactDir, { recursive: true });
    const fileName = `${Date.now()}-${slug(input.title)}.md`;
    const absolutePath = path.join(artifactDir, fileName);
    await writeFile(absolutePath, input.content, 'utf8');
    const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, '/');

    return {
      artifactId: `artifact-${Date.now()}-${slug(input.taskId)}`,
      title: input.title,
      kind: input.kind || 'notes',
      path: relativePath,
      summary: input.summary || input.title,
      missionId: input.missionId,
      missionTaskId: input.taskId,
      createdByWorkerId: input.createdByWorkerId,
      previewable: true,
      workspaceBacked: true,
    };
  }

  return { writeArtifact };
}
