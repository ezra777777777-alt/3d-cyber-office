import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);

function readArg(name, fallback = '') {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) return fallback;
  return args[index + 1];
}

const videoPath = readArg('--video');
const outDir = resolve(readArg('--out', '.video-reference-frames'));
const chromePath =
  readArg('--chrome') ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const times = readArg('--times', '1,3,5,8,12,16,20')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value >= 0);

if (!videoPath) {
  console.error('Usage: node scripts/visual-qa/capture-reference-video-frames.mjs --video <mp4> [--out <dir>] [--times 1,3,5]');
  process.exit(2);
}

if (!existsSync(videoPath)) {
  console.error(`Video not found: ${videoPath}`);
  process.exit(2);
}

if (!existsSync(chromePath)) {
  console.error(`Chrome not found: ${chromePath}`);
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });

const videoUrl = pathToFileURL(resolve(videoPath)).href;

for (const time of times) {
  const id = String(time).replace(/\./g, '_').padStart(4, '0');
  const htmlPath = resolve(outDir, `frame-${id}.html`);
  const pngPath = resolve(outDir, `frame-${id}.png`);
  const profileDir = resolve(outDir, `chrome-profile-${id}`);

  writeFileSync(
    htmlPath,
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #0b1020;
      }
      #stage {
        width: 100vw;
        height: 100vh;
        display: grid;
        place-items: center;
        background: #0b1020;
      }
      canvas {
        width: 100vw;
        height: 100vh;
        object-fit: contain;
        background: #0b1020;
      }
      .badge {
        position: fixed;
        left: 14px;
        bottom: 12px;
        color: white;
        font: 13px/1.4 ui-monospace, Consolas, monospace;
        background: rgb(0 0 0 / 0.48);
        border: 1px solid rgb(255 255 255 / 0.22);
        border-radius: 6px;
        padding: 6px 8px;
      }
    </style>
  </head>
  <body>
    <div id="stage">
      <canvas id="canvas" width="1280" height="720"></canvas>
    </div>
    <div class="badge">${basename(videoPath)} @ ${time}s</div>
    <video id="video" muted playsinline preload="auto" crossorigin="anonymous" src="${videoUrl}" style="display:none"></video>
    <script>
      const targetTime = ${JSON.stringify(time)};
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');

      function drawFrame() {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const scale = Math.min(canvas.width / vw, canvas.height / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, dx, dy, dw, dh);
        document.title = 'ready';
      }

      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(targetTime, Math.max(0, video.duration - 0.1));
      }, { once: true });

      video.addEventListener('seeked', () => {
        drawFrame();
      }, { once: true });

      video.addEventListener('error', () => {
        document.body.insertAdjacentHTML('beforeend', '<pre style="color:red;position:fixed;top:20px;left:20px">video error</pre>');
        document.title = 'error';
      });
    </script>
  </body>
</html>
`,
    'utf8',
  );

  const result = spawnSync(
    chromePath,
    [
      '--headless',
      '--disable-gpu',
      '--disable-gpu-compositing',
      '--disable-dev-shm-usage',
      '--disable-crash-reporter',
      '--allow-file-access-from-files',
      '--autoplay-policy=no-user-gesture-required',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profileDir}`,
      '--window-size=1280,720',
      '--virtual-time-budget=8000',
      `--screenshot=${pngPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }

  console.log(pngPath);
}
