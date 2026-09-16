import sharp from 'sharp';

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const cl = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, cl)) * 255);
}

const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

function fLab(t: number): number {
  const eps = 216 / 24389;
  const kappa = 24389 / 27;
  return t > eps ? Math.cbrt(t) : (kappa * t + 16) / 116;
}

function finvLab(t: number): number {
  const eps = 6 / 29;
  return t > eps ? t ** 3 : 3 * eps ** 2 * (t - 4 / 29);
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl;

  const fx = fLab(x / Xn);
  const fy = fLab(y / Yn);
  const fz = fLab(z / Zn);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  const x = Xn * finvLab(fx);
  const y = Yn * finvLab(fy);
  const z = Zn * finvLab(fz);

  const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  return [linearToSrgb(rl), linearToSrgb(gl), linearToSrgb(bl)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

type Lab = [number, number, number];

function distSq(a: Lab, b: Lab): number {
  const dL = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return dL * dL + da * da + db * db;
}

function kmeansPlusPlusInit(samples: Lab[], k: number): Lab[] {
  const centers: Lab[] = [];
  centers.push(samples[Math.floor(Math.random() * samples.length)]);

  while (centers.length < k) {
    const distances = samples.map(s => {
      let minD = Infinity;
      for (const c of centers) {
        const d = distSq(s, c);
        if (d < minD) minD = d;
      }
      return minD;
    });

    const sum = distances.reduce((a, b) => a + b, 0);
    if (sum === 0) {
      centers.push(samples[Math.floor(Math.random() * samples.length)]);
      continue;
    }

    let r = Math.random() * sum;
    let idx = 0;
    for (; idx < distances.length; idx++) {
      r -= distances[idx];
      if (r <= 0) break;
    }
    centers.push(samples[Math.min(idx, samples.length - 1)]);
  }

  return centers;
}

function kmeans(
  samples: Lab[],
  k: number,
  maxIter = 25,
): {centers: Lab[]; sizes: number[]} {
  let centers = kmeansPlusPlusInit(samples, k);

  let assignments = new Array(samples.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    for (let i = 0; i < samples.length; i++) {
      let minD = Infinity;
      let best = 0;
      for (let c = 0; c < centers.length; c++) {
        const d = distSq(samples[i], centers[c]);
        if (d < minD) {
          minD = d;
          best = c;
        }
      }
      if (assignments[i] !== best) changed = true;
      assignments[i] = best;
    }

    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < samples.length; i++) {
      const c = assignments[i];
      sums[c][0] += samples[i][0];
      sums[c][1] += samples[i][1];
      sums[c][2] += samples[i][2];
      sums[c][3] += 1;
    }

    for (let c = 0; c < centers.length; c++) {
      if (sums[c][3] > 0) {
        centers[c] = [
          sums[c][0] / sums[c][3],
          sums[c][1] / sums[c][3],
          sums[c][2] / sums[c][3],
        ];
      }
    }

    if (!changed) break;
  }

  const sizes = new Array(centers.length).fill(0);
  for (const a of assignments) sizes[a]++;

  return {centers, sizes};
}

function samplePixels(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number,
  targetSamples = 3000,
  alphaThreshold = 10,
): Lab[] {
  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(totalPixels / targetSamples));

  const samples: Lab[] = [];
  const hasAlpha = channels === 4 || channels === 2;

  for (let p = 0; p < totalPixels; p += step) {
    const i = p * channels;
    const r = pixels[i];
    const g = channels >= 3 ? pixels[i + 1] : r;
    const b = channels >= 3 ? pixels[i + 2] : r;
    const a = hasAlpha ? pixels[i + channels - 1] : 255;

    if (a < alphaThreshold) continue;

    samples.push(rgbToLab(r, g, b));
  }

  return samples;
}

function findDominantColors(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number,
  count: number,
): string[] {
  const samples = samplePixels(pixels, width, height, channels);

  if (samples.length === 0) return Array(count).fill('#000000');

  const k = Math.min(count, samples.length);
  const {centers, sizes} = kmeans(samples, k);

  const results = centers
    .map((c, idx) => ({c, size: sizes[idx]}))
    .filter(r => r.size > 0)
    .sort((a, b) => b.size - a.size)
    .map(r => {
      const [r255, g255, b255] = labToRgb(r.c[0], r.c[1], r.c[2]);
      return rgbToHex(r255, g255, b255);
    });

  while (results.length < count) {
    results.push(results[results.length - 1] ?? '#000000');
  }

  return results.slice(0, count);
}

export async function extractColors(
  imageUrl: string,
  count = 5,
): Promise<string[]> {
  if (count <= 0) return [];

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return Array(count).fill('#cccccc');

    const buffer = Buffer.from(await response.arrayBuffer());

    const {data, info} = await sharp(buffer)
      .resize(300, 300, {fit: 'inside', withoutEnlargement: true})
      .ensureAlpha()
      .raw()
      .toBuffer({resolveWithObject: true});

    return findDominantColors(
      data,
      info.width,
      info.height,
      info.channels,
      count,
    );
  } catch {
    return Array(count).fill('#cccccc');
  }
}
