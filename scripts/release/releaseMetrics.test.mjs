import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bytesToKb,
  classifyAsset,
  createBuildMetricsReport,
  evaluateBuildBudgets,
  stableAssetFileName,
  summarizeAssets,
} from './releaseMetrics.mjs';

test('bytesToKb rounds to two decimals', () => {
  assert.equal(bytesToKb(1536), 1.5);
  assert.equal(bytesToKb(1024 * 343.137), 343.14);
});

test('classifyAsset recognizes known chunk groups', () => {
  assert.equal(classifyAsset('assets/vendor-3d-Abc.js'), 'vendor-3d');
  assert.equal(classifyAsset('assets/vendor-react-Abc.js'), 'vendor-react');
  assert.equal(classifyAsset('assets/index-Abc.js'), 'app');
  assert.equal(classifyAsset('assets/index-Abc.css'), 'css');
});

test('summarizeAssets groups max asset size per group', () => {
  const summary = summarizeAssets([
    { fileName: 'assets/vendor-3d-a.js', bytes: 800_000 },
    { fileName: 'assets/vendor-3d-b.js', bytes: 10_000 },
    { fileName: 'assets/index-a.js', bytes: 120_000 },
    { fileName: 'assets/index-a.css', bytes: 40_000 },
  ]);

  assert.equal(summary['vendor-3d'].maxKb, 781.25);
  assert.equal(summary.app.maxKb, 117.19);
  assert.equal(summary.css.maxKb, 39.06);
});

test('evaluateBuildBudgets fails only over-budget groups', () => {
  const result = evaluateBuildBudgets({
    'vendor-3d': { maxKb: 910 },
    'vendor-react': { maxKb: 250 },
    app: { maxKb: 180 },
    css: { maxKb: 40 },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.failures.map((failure) => failure.group), ['vendor-3d']);
});

test('stableAssetFileName strips Vite content hashes from JS and CSS names', () => {
  assert.equal(stableAssetFileName('assets/index-B1WrOter.js'), 'assets/index-[hash].js');
  assert.equal(stableAssetFileName('assets/MissionHistoryView-CmwM44RB.js'), 'assets/MissionHistoryView-[hash].js');
  assert.equal(stableAssetFileName('assets/index-BUC6J_gf.css'), 'assets/index-[hash].css');
  assert.equal(stableAssetFileName('assets/vendor-3d-BImYFzgv.js'), 'assets/vendor-3d-[hash].js');
  assert.equal(stableAssetFileName('assets/vendor-react-DdyseCAw.js'), 'assets/vendor-react-[hash].js');
});

test('stableAssetFileName keeps non-hashed names unchanged', () => {
  assert.equal(stableAssetFileName('assets/vendor-3d.js'), 'assets/vendor-3d.js');
  assert.equal(stableAssetFileName('assets/readme.txt'), 'assets/readme.txt');
});

test('createBuildMetricsReport is stable across hash-only filename changes', () => {
  const first = createBuildMetricsReport([
    { fileName: 'assets/index-AAAA1111.js', bytes: 150_000 },
    { fileName: 'assets/index-BBBB2222.css', bytes: 35_000 },
    { fileName: 'assets/vendor-3d-CCCC3333.js', bytes: 850_000 },
  ]);

  const second = createBuildMetricsReport([
    { fileName: 'assets/index-ZZZZ9999.js', bytes: 150_000 },
    { fileName: 'assets/index-YYYY8888.css', bytes: 35_000 },
    { fileName: 'assets/vendor-3d-XXXX7777.js', bytes: 850_000 },
  ]);

  assert.deepEqual(second, first);
});

test('createBuildMetricsReport omits wall-clock timestamps by default', () => {
  const report = createBuildMetricsReport([
    { fileName: 'assets/index-AAAA1111.js', bytes: 150_000 },
  ]);

  assert.equal(report.generatedAt, undefined);
  assert.equal(report.schemaVersion, 1);
});
