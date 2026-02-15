// Regenerate favicon using the same pipeline so we can rebuild anytime.
// Usage: node scripts/generate-favicon.mjs

import sharp from 'sharp';

const INPUT = 'public/characters/don-wink.png';
const OUTPUTS = [
  { path: 'public/favicon.png', size: 256 },
  { path: 'public/images/favicon.png', size: 48 },
];

// Representative fill color from the original asset.
// We map this color range toward white while keeping stroke coverage as darker gray.
const FILL = { r: 234, g: 80, b: 33 };

function toMonochrome(buf) {
  for (let i = 0; i < buf.length; i += 4) {
    const a = buf[i + 3];
    if (a === 0) continue;

    let r = buf[i];
    let g = buf[i + 1];
    let b = buf[i + 2];

    // Un-premultiply to avoid dark fringes if the source was exported against black.
    if (a < 255) {
      const scale = 255 / a;
      r = Math.min(255, Math.round(r * scale));
      g = Math.min(255, Math.round(g * scale));
      b = Math.min(255, Math.round(b * scale));
    }

    const nearWhite = r > 220 && g > 220 && b > 220;
    if (nearWhite) {
      buf[i] = 255;
      buf[i + 1] = 255;
      buf[i + 2] = 255;
      continue;
    }

    const nearBlack = r < 30 && g < 30 && b < 30;
    if (nearBlack) {
      buf[i] = 0;
      buf[i + 1] = 0;
      buf[i + 2] = 0;
      continue;
    }

    const sr = r / FILL.r;
    const sg = g / FILL.g;
    const sb = b / FILL.b;

    let s = Math.max(sr, sg, sb);
    if (!Number.isFinite(s)) s = 0;
    if (s < 0) s = 0;
    if (s > 1) s = 1;

    const v = Math.round(255 * s);
    buf[i] = v;
    buf[i + 1] = v;
    buf[i + 2] = v;
  }

  return buf;
}

for (const o of OUTPUTS) {
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .resize(o.size, o.size, { kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outBuf = toMonochrome(Buffer.from(data));

  await sharp(outBuf, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(o.path);

  console.log('updated', o.path);
}
