// Main chalk-compatible styling API

import {
  type CodePair,
  modifiers,
  fgColors,
  bgColors,
  ansi256 as ansi256Code,
  bgAnsi256 as bgAnsi256Code,
  rgb as rgbCode,
  bgRgb as bgRgbCode,
  hexToRgb,
  rgbToAnsi256,
  rgbToAnsi16,
} from './styles.js';
import { colorLevel } from './detect.js';
import { hslToRgb, hsvToRgb, hwbToRgb } from './convert.js';

// Color level for the current process
let currentLevel: 0 | 1 | 2 | 3 | undefined;

function getLevel(): 0 | 1 | 2 | 3 {
  if (currentLevel === undefined) {
    currentLevel = colorLevel(process.stdout);
  }
  return currentLevel;
}

function setLevel(level: 0 | 1 | 2 | 3): void {
  currentLevel = level;
}

const allStaticStyles: Record<string, CodePair> = {
  ...modifiers,
  ...fgColors,
  ...bgColors,
};

// Apply a code pair to a string, handling nesting by replacing close codes in the content
function applyStyle(text: string, pair: CodePair, level: number): string {
  if (level === 0) return text;
  const { open, close } = pair;
  // Handle nesting: replace any inner close with close+open to resume the style
  let result = text;
  if (result.includes(close)) {
    result = result.replaceAll(close, close + open);
  }
  return open + result + close;
}

// Downgrade an RGB code pair based on the current color level
function downgradeFg(r: number, g: number, b: number, level: 0 | 1 | 2 | 3): CodePair | null {
  if (level === 0) return null;
  if (level >= 3) return rgbCode(r, g, b);
  if (level === 2) return ansi256Code(rgbToAnsi256(r, g, b));
  // level 1: map to nearest basic ANSI color (codes 30-37, 90-97)
  const ansiCode = rgbToAnsi16(r, g, b);
  return { open: `\x1b[${ansiCode}m`, close: '\x1b[39m' };
}

function downgradeBg(r: number, g: number, b: number, level: 0 | 1 | 2 | 3): CodePair | null {
  if (level === 0) return null;
  if (level >= 3) return bgRgbCode(r, g, b);
  if (level === 2) return bgAnsi256Code(rgbToAnsi256(r, g, b));
  // level 1: map to nearest basic ANSI bg color (codes 40-47, 100-107)
  const ansiCode = rgbToAnsi16(r, g, b) + 10;
  return { open: `\x1b[${ansiCode}m`, close: '\x1b[49m' };
}

// The builder that accumulates style chains
interface SpectraInstance {
  (...text: unknown[]): string;

  // Level
  level: 0 | 1 | 2 | 3;

  // Modifiers
  readonly reset: SpectraInstance;
  readonly bold: SpectraInstance;
  readonly dim: SpectraInstance;
  readonly italic: SpectraInstance;
  readonly underline: SpectraInstance;
  readonly inverse: SpectraInstance;
  readonly hidden: SpectraInstance;
  readonly strikethrough: SpectraInstance;
  readonly overline: SpectraInstance;

  // Foreground colors
  readonly black: SpectraInstance;
  readonly red: SpectraInstance;
  readonly green: SpectraInstance;
  readonly yellow: SpectraInstance;
  readonly blue: SpectraInstance;
  readonly magenta: SpectraInstance;
  readonly cyan: SpectraInstance;
  readonly white: SpectraInstance;
  readonly blackBright: SpectraInstance;
  readonly gray: SpectraInstance;
  readonly grey: SpectraInstance;
  readonly redBright: SpectraInstance;
  readonly greenBright: SpectraInstance;
  readonly yellowBright: SpectraInstance;
  readonly blueBright: SpectraInstance;
  readonly magentaBright: SpectraInstance;
  readonly cyanBright: SpectraInstance;
  readonly whiteBright: SpectraInstance;

  // Background colors
  readonly bgBlack: SpectraInstance;
  readonly bgRed: SpectraInstance;
  readonly bgGreen: SpectraInstance;
  readonly bgYellow: SpectraInstance;
  readonly bgBlue: SpectraInstance;
  readonly bgMagenta: SpectraInstance;
  readonly bgCyan: SpectraInstance;
  readonly bgWhite: SpectraInstance;
  readonly bgBlackBright: SpectraInstance;
  readonly bgGray: SpectraInstance;
  readonly bgGrey: SpectraInstance;
  readonly bgRedBright: SpectraInstance;
  readonly bgGreenBright: SpectraInstance;
  readonly bgYellowBright: SpectraInstance;
  readonly bgBlueBright: SpectraInstance;
  readonly bgMagentaBright: SpectraInstance;
  readonly bgCyanBright: SpectraInstance;
  readonly bgWhiteBright: SpectraInstance;

  // Dynamic color methods
  hex(color: string): SpectraInstance;
  rgb(r: number, g: number, b: number): SpectraInstance;
  hsl(h: number, s: number, l: number): SpectraInstance;
  hsv(h: number, s: number, v: number): SpectraInstance;
  hwb(h: number, w: number, b: number): SpectraInstance;
  ansi256(n: number): SpectraInstance;
  bgHex(color: string): SpectraInstance;
  bgRgb(r: number, g: number, b: number): SpectraInstance;
  bgHsl(h: number, s: number, l: number): SpectraInstance;
  bgHsv(h: number, s: number, v: number): SpectraInstance;
  bgHwb(h: number, w: number, b: number): SpectraInstance;
  bgAnsi256(n: number): SpectraInstance;

  // Template
  template(str: string): string;
}

function createBuilder(pairs: CodePair[]): SpectraInstance {
  // The callable function that applies all accumulated styles
  const builder = function (...text: unknown[]): string {
    const str = text.map(t => String(t)).join(' ');
    const level = getLevel();
    if (level === 0) return str;
    let result = str;
    // Apply styles in order (outermost first means we apply from last to first)
    for (let i = pairs.length - 1; i >= 0; i--) {
      result = applyStyle(result, pairs[i], level);
    }
    return result;
  } as SpectraInstance;

  // Level accessor
  Object.defineProperty(builder, 'level', {
    get: getLevel,
    set: setLevel,
    enumerable: true,
  });

  // Static style properties (lazy, cached)
  const styleNames = Object.keys(allStaticStyles);
  for (const name of styleNames) {
    Object.defineProperty(builder, name, {
      get() {
        return createBuilder([...pairs, allStaticStyles[name]]);
      },
      enumerable: true,
      configurable: true,
    });
  }

  // Dynamic fg color methods
  builder.hex = (color: string) => {
    const [r, g, b] = hexToRgb(color);
    const level = getLevel();
    const pair = downgradeFg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.rgb = (r: number, g: number, b: number) => {
    const level = getLevel();
    const pair = downgradeFg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.hsl = (h: number, s: number, l: number) => {
    const [r, g, b] = hslToRgb(h, s, l);
    const level = getLevel();
    const pair = downgradeFg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.hsv = (h: number, s: number, v: number) => {
    const [r, g, b] = hsvToRgb(h, s, v);
    const level = getLevel();
    const pair = downgradeFg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.hwb = (h: number, w: number, b: number) => {
    const [r, g, bl] = hwbToRgb(h, w, b);
    const level = getLevel();
    const pair = downgradeFg(r, g, bl, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.ansi256 = (n: number) => {
    return createBuilder([...pairs, ansi256Code(n)]);
  };

  // Dynamic bg color methods
  builder.bgHex = (color: string) => {
    const [r, g, b] = hexToRgb(color);
    const level = getLevel();
    const pair = downgradeBg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.bgRgb = (r: number, g: number, b: number) => {
    const level = getLevel();
    const pair = downgradeBg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.bgHsl = (h: number, s: number, l: number) => {
    const [r, g, b] = hslToRgb(h, s, l);
    const level = getLevel();
    const pair = downgradeBg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.bgHsv = (h: number, s: number, v: number) => {
    const [r, g, b] = hsvToRgb(h, s, v);
    const level = getLevel();
    const pair = downgradeBg(r, g, b, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.bgHwb = (h: number, w: number, b: number) => {
    const [r, g, bl] = hwbToRgb(h, w, b);
    const level = getLevel();
    const pair = downgradeBg(r, g, bl, level);
    return pair ? createBuilder([...pairs, pair]) : createBuilder([...pairs]);
  };
  builder.bgAnsi256 = (n: number) => {
    return createBuilder([...pairs, bgAnsi256Code(n)]);
  };

  // Template literal support: spectra.template('{red text} {bold.yellow warning}')
  builder.template = (str: string): string => {
    return str.replace(/\{([^\s}]+)\s+([^}]*)\}/g, (_match, styleStr: string, content: string) => {
      const styleChain = styleStr.split('.');
      let instance: SpectraInstance = spectra;
      for (const s of styleChain) {
        if (Object.hasOwn(allStaticStyles, s)) {
          instance = (instance as unknown as Record<string, SpectraInstance>)[s];
        }
      }
      return instance(content);
    });
  };

  return builder;
}

const spectra: SpectraInstance = createBuilder([]);

export default spectra;
export { spectra };
export type { SpectraInstance };
