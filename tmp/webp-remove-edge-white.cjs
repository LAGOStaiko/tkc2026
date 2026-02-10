const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(process.cwd(), 'public', 'branding', 'v2', 'emojis', 'webp');
const files = fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.webp')).sort();

const whiteThreshold = 75;
const whiteThresholdSq = whiteThreshold * whiteThreshold;

function isNearWhite(data, offset) {
  const b = data[offset + 0];
  const g = data[offset + 1];
  const r = data[offset + 2];
  const a = data[offset + 3];

  if (a === 0) {
    return true;
  }

  const db = 255 - b;
  const dg = 255 - g;
  const dr = 255 - r;
  return (db * db) + (dg * dg) + (dr * dr) <= whiteThresholdSq;
}

async function processFile(fileName) {
  const inputPath = path.join(dir, fileName);
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const count = width * height;

  const visited = new Uint8Array(count);
  const mask = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0;
  let tail = 0;

  function enqueue(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }

    const idx = (y * width) + x;
    if (visited[idx]) {
      return;
    }

    visited[idx] = 1;
    queue[tail++] = idx;
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx - x) / width;
    const o = idx * channels;

    if (!isNearWhite(data, o)) {
      continue;
    }

    mask[idx] = 1;

    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  let removed = 0;
  for (let i = 0; i < count; i += 1) {
    if (!mask[i]) {
      continue;
    }

    const o = i * channels;
    if (data[o + 3] !== 0) {
      removed += 1;
    }

    data[o + 0] = 0;
    data[o + 1] = 0;
    data[o + 2] = 0;
    data[o + 3] = 0;
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels,
    },
  })
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(inputPath);

  console.log(`processed: ${fileName} | removed:${removed}`);
}

(async () => {
  for (const file of files) {
    await processFile(file);
  }
})();
