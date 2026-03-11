// Color space conversions (replaces color-convert)

import { colorNames } from './color-names.js';

// --- RGB ↔ HSL ---

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, Math.round(l * 100)];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1: number, g1: number, b1: number;
  if (h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

// --- RGB ↔ HSV ---

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const v = max;

  if (max === 0) return [0, 0, 0];
  const s = d / max;
  if (d === 0) return [0, 0, Math.round(v * 100)];

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1: number, g1: number, b1: number;
  if (h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

// --- RGB ↔ HWB ---

function rgbToHwb(r: number, g: number, b: number): [number, number, number] {
  const [h] = rgbToHsl(r, g, b);
  const w = Math.min(r, g, b) / 255 * 100;
  const bl = (1 - Math.max(r, g, b) / 255) * 100;
  return [h, Math.round(w), Math.round(bl)];
}

function hwbToRgb(h: number, w: number, b: number): [number, number, number] {
  w = Math.max(0, Math.min(100, w)) / 100;
  b = Math.max(0, Math.min(100, b)) / 100;

  if (w + b >= 1) {
    const gray = Math.round((w / (w + b)) * 255);
    return [gray, gray, gray];
  }

  const [r, g, bl] = hslToRgb(h, 100, 50);
  return [
    Math.round(r / 255 * (1 - w - b) * 255 + w * 255),
    Math.round(g / 255 * (1 - w - b) * 255 + w * 255),
    Math.round(bl / 255 * (1 - w - b) * 255 + w * 255),
  ];
}

// --- RGB ↔ CMYK ---

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
}

function cmykToRgb(c: number, m: number, y: number, k: number): [number, number, number] {
  c /= 100;
  m /= 100;
  y /= 100;
  k /= 100;
  return [
    Math.round(255 * (1 - c) * (1 - k)),
    Math.round(255 * (1 - m) * (1 - k)),
    Math.round(255 * (1 - y) * (1 - k)),
  ];
}

// --- RGB ↔ Hex ---

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// --- RGB ↔ ANSI 256 ---

function rgbToAnsi256(r: number, g: number, b: number): number {
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }
  return 16 + 36 * Math.round((r / 255) * 5) + 6 * Math.round((g / 255) * 5) + Math.round((b / 255) * 5);
}

function ansi256ToRgb(n: number): [number, number, number] {
  if (n < 16) {
    // Standard 16 colors
    const table: [number, number, number][] = [
      [0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0],
      [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192],
      [128, 128, 128], [255, 0, 0], [0, 255, 0], [255, 255, 0],
      [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255],
    ];
    return table[n];
  }
  if (n >= 232) {
    // Grayscale ramp
    const v = (n - 232) * 10 + 8;
    return [v, v, v];
  }
  // 6x6x6 color cube (indices 16-231)
  const idx = n - 16;
  const r = Math.floor(idx / 36);
  const g = Math.floor((idx % 36) / 6);
  const b = idx % 6;
  return [
    r ? r * 40 + 55 : 0,
    g ? g * 40 + 55 : 0,
    b ? b * 40 + 55 : 0,
  ];
}

// --- RGB ↔ ANSI 16 ---

function rgbToAnsi16(r: number, g: number, b: number): number {
  const value = Math.max(r, g, b);
  if (value === Math.min(r, g, b)) {
    return value < 128 ? 30 : 97;
  }
  let ansi = 30 + ((Math.round(b / 255) << 2) | (Math.round(g / 255) << 1) | Math.round(r / 255));
  if (value >= 128) ansi += 60;
  return ansi;
}

function ansi16ToRgb(code: number): [number, number, number] {
  // Normalize to 0-based index: 30-37 → 0-7, 90-97 → 8-15
  let idx: number;
  if (code >= 90 && code <= 97) {
    idx = code - 90 + 8;
  } else if (code >= 30 && code <= 37) {
    idx = code - 30;
  } else {
    throw new Error(`Invalid ANSI 16 code: ${code}`);
  }
  return ansi256ToRgb(idx);
}

// --- Keyword → RGB ---

function keywordToRgb(keyword: string): [number, number, number] {
  const rgb = colorNames[keyword.toLowerCase()];
  if (!rgb) {
    throw new Error(`Unknown color keyword: "${keyword}"`);
  }
  return rgb;
}

// --- Structured convert API ---

interface RgbConverter {
  hsl(r: number, g: number, b: number): [number, number, number];
  hsv(r: number, g: number, b: number): [number, number, number];
  hwb(r: number, g: number, b: number): [number, number, number];
  cmyk(r: number, g: number, b: number): [number, number, number, number];
  hex(r: number, g: number, b: number): string;
  ansi256(r: number, g: number, b: number): number;
  ansi16(r: number, g: number, b: number): number;
}

interface HslConverter {
  rgb(h: number, s: number, l: number): [number, number, number];
}

interface HsvConverter {
  rgb(h: number, s: number, v: number): [number, number, number];
}

interface HwbConverter {
  rgb(h: number, w: number, b: number): [number, number, number];
}

interface CmykConverter {
  rgb(c: number, m: number, y: number, k: number): [number, number, number];
}

interface HexConverter {
  rgb(hex: string): [number, number, number];
}

interface Ansi256Converter {
  rgb(n: number): [number, number, number];
}

interface Ansi16Converter {
  rgb(code: number): [number, number, number];
}

interface KeywordConverter {
  rgb(keyword: string): [number, number, number];
}

interface Convert {
  rgb: RgbConverter;
  hsl: HslConverter;
  hsv: HsvConverter;
  hwb: HwbConverter;
  cmyk: CmykConverter;
  hex: HexConverter;
  ansi256: Ansi256Converter;
  ansi16: Ansi16Converter;
  keyword: KeywordConverter;
}

export const convert: Convert = {
  rgb: {
    hsl: rgbToHsl,
    hsv: rgbToHsv,
    hwb: rgbToHwb,
    cmyk: rgbToCmyk,
    hex: rgbToHex,
    ansi256: rgbToAnsi256,
    ansi16: rgbToAnsi16,
  },
  hsl: { rgb: hslToRgb },
  hsv: { rgb: hsvToRgb },
  hwb: { rgb: hwbToRgb },
  cmyk: { rgb: cmykToRgb },
  hex: { rgb: hexToRgb },
  ansi256: { rgb: ansi256ToRgb },
  ansi16: { rgb: ansi16ToRgb },
  keyword: { rgb: keywordToRgb },
};

// Also export individual functions for direct use
export {
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToHwb,
  hwbToRgb,
  rgbToCmyk,
  cmykToRgb,
  rgbToHex,
  hexToRgb,
  rgbToAnsi256,
  ansi256ToRgb,
  rgbToAnsi16,
  ansi16ToRgb,
  keywordToRgb,
};
