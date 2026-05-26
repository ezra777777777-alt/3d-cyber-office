#!/usr/bin/env node
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createBuildMetricsReport } from './releaseMetrics.mjs';

const root = process.cwd();
const assetsDir = path.join(root, 'dist', 'assets');
const outputPath = path.join(root, 'docs', 'qa', 'build-metrics.json');

async function listDistAssets() {
  const names = await readdir(assetsDir);
  const assets = [];
  for (const name of names) {
    const absolute = path.join(assetsDir, name);
    const info = await stat(absolute);
    if (info.isFile()) assets.push({ fileName: `assets/${name}`, bytes: info.size });
  }
  return assets;
}

const assets = await listDistAssets();
const report = createBuildMetricsReport(assets, {
  includeTimestamp: process.argv.includes('--with-timestamp'),
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('Build metrics written to docs/qa/build-metrics.json');
for (const item of Object.values(report.summary)) {
  console.log(`${item.group}: max ${item.maxKb} KB, total ${item.totalKb} KB`);
}

if (!report.ok) {
  console.error('Build budget failures:');
  for (const failure of report.failures) {
    console.error(`- ${failure.group}: ${failure.maxKb} KB > ${failure.budgetKb} KB`);
  }
  process.exitCode = 1;
}
