#!/usr/bin/env node
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildReleaseManifest, shouldIncludeReleasePath } from './releaseManifest.mjs';

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const releaseRoot = path.join(root, '.release', `3d-cyber-office-local-${stamp}`);
const dryRun = process.argv.includes('--dry-run');

async function walk(dir, base = '', excluded = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = base ? `${base}/${entry.name}` : entry.name;
    const absolute = path.join(dir, entry.name);
    if (!shouldIncludeReleasePath(relative)) {
      excluded.push(relative);
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...await walk(absolute, relative, excluded));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}

const excluded = [];
const files = await walk(root, '', excluded);
const manifest = buildReleaseManifest([...files, ...excluded]);

if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, releaseRoot, ...manifest }, null, 2));
  process.exit(0);
}

await rm(releaseRoot, { recursive: true, force: true });
await mkdir(releaseRoot, { recursive: true });

for (const file of manifest.files) {
  const from = path.join(root, file);
  const to = path.join(releaseRoot, file);
  const info = await stat(from);
  if (!info.isFile()) continue;
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to);
}

await writeFile(
  path.join(releaseRoot, 'RELEASE-MANIFEST.json'),
  `${JSON.stringify({ releaseRoot, ...manifest }, null, 2)}\n`,
  'utf8',
);

console.log(`Release package created: ${releaseRoot}`);
console.log(`Files copied: ${manifest.fileCount}`);
console.log(`Excluded entries: ${manifest.excludedCount}`);
