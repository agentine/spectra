// Main chalk-compatible styling API
//
// Performance: uses a shared prototype with lazy, self-caching getters
// (defined ONCE) and a linked-list styler chain. createBuilder() is
// lightweight: create function, setPrototypeOf, set 1 symbol.

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

// Linked-list styler — avoids array spreading on every chain step
interface Styler {
  open: string;
  close: string;
  openAll: string;
  closeAll: string;
  parent: Styler | undefined;
}

const STYLER = Symbol('STYLER');

function createStyler(open: string, close: string, parent?: Styler): Styler {
  if (parent === undefined) {
    return { open, close, openAll: open, closeAll: close, parent };
  }
  return {
    open,
    close,
    openAll: parent.openAll + open,
    closeAll: close + parent.closeAll,
    parent,
  };
}

// Downgrade an RGB color based on the current color level
function downgradeFg(r: number, g: number, b: number, level: 0 | 1 | 2 | 3): CodePair | null {
  if (level === 0) return null;
  if (level >= 3) return rgbCode(r, g, b);
  if (level === 2) return ansi256Code(rgbToAnsi256(r, g, b));
  const ansiCode = rgbToAnsi16(r, g, b);
  return { open: `\x1b[${ansiCode}m`, close: '\x1b[39m' };
}

function downgradeBg(r: number, g: number, b: number, level: 0 | 1 | 2 | 3): CodePair | null {
  if (level === 0) return null;
  if (level >= 3) return bgRgbCode(r, g, b);
  if (level === 2) return bgAnsi256Code(rgbToAnsi256(r, g, b));
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

// Apply styles using the linked-list styler
function applyStyle(self: any, text: string): string {
  const level = getLevel();
  if (level === 0 || !text) return text;

  let styler: Styler | undefined = self[STYLER];
  if (styler === undefined) return text;

  const { openAll, closeAll } = styler;

  // Handle nesting: replace inner close codes with re-opener
  if (text.includes('\x1b')) {
    let s: Styler | undefined = styler;
    while (s !== undefined) {
      text = text.replaceAll(s.close, s.open);
      s = s.parent;
    }
  }

  return openAll + text + closeAll;
}

// Helper to create a dynamic fg color method
function makeFgDynamic(
  toRgb: (...args: any[]) => [number, number, number],
) {
  return {
    get(this: any) {
      const parentStyler: Styler | undefined = this[STYLER];
      return (...args: any[]) => {
        const [r, g, b] = toRgb(...args);
        const pair = downgradeFg(r, g, b, getLevel());
        if (!pair) return createBuilder(parentStyler);
        return createBuilder(createStyler(pair.open, pair.close, parentStyler));
      };
    },
    configurable: true,
    enumerable: true,
  };
}

function makeBgDynamic(
  toRgb: (...args: any[]) => [number, number, number],
) {
  return {
    get(this: any) {
      const parentStyler: Styler | undefined = this[STYLER];
      return (...args: any[]) => {
        const [r, g, b] = toRgb(...args);
        const pair = downgradeBg(r, g, b, getLevel());
        if (!pair) return createBuilder(parentStyler);
        return createBuilder(createStyler(pair.open, pair.close, parentStyler));
      };
    },
    configurable: true,
    enumerable: true,
  };
}

// ── Build shared prototype (ONCE) ──────────────────────────────────

const styleDescriptors: PropertyDescriptorMap = {};

// Static styles: lazy getters that cache on first access
for (const [name, pair] of Object.entries(allStaticStyles)) {
  styleDescriptors[name] = {
    get(this: any) {
      const builder = createBuilder(
        createStyler(pair.open, pair.close, this[STYLER]),
      );
      // Cache: replace getter with direct value on this instance
      Object.defineProperty(this, name, { value: builder });
      return builder;
    },
    configurable: true,
    enumerable: true,
  };
}

// Dynamic fg color methods
styleDescriptors.hex = makeFgDynamic((color: string) => hexToRgb(color));
styleDescriptors.rgb = makeFgDynamic((r: number, g: number, b: number) => [r, g, b]);
styleDescriptors.hsl = makeFgDynamic((h: number, s: number, l: number) => hslToRgb(h, s, l));
styleDescriptors.hsv = makeFgDynamic((h: number, s: number, v: number) => hsvToRgb(h, s, v));
styleDescriptors.hwb = makeFgDynamic((h: number, w: number, b: number) => hwbToRgb(h, w, b));
styleDescriptors.ansi256 = {
  get(this: any) {
    const parentStyler: Styler | undefined = this[STYLER];
    return (n: number) => {
      const pair = ansi256Code(n);
      return createBuilder(createStyler(pair.open, pair.close, parentStyler));
    };
  },
  configurable: true,
  enumerable: true,
};

// Dynamic bg color methods
styleDescriptors.bgHex = makeBgDynamic((color: string) => hexToRgb(color));
styleDescriptors.bgRgb = makeBgDynamic((r: number, g: number, b: number) => [r, g, b]);
styleDescriptors.bgHsl = makeBgDynamic((h: number, s: number, l: number) => hslToRgb(h, s, l));
styleDescriptors.bgHsv = makeBgDynamic((h: number, s: number, v: number) => hsvToRgb(h, s, v));
styleDescriptors.bgHwb = makeBgDynamic((h: number, w: number, b: number) => hwbToRgb(h, w, b));
styleDescriptors.bgAnsi256 = {
  get(this: any) {
    const parentStyler: Styler | undefined = this[STYLER];
    return (n: number) => {
      const pair = bgAnsi256Code(n);
      return createBuilder(createStyler(pair.open, pair.close, parentStyler));
    };
  },
  configurable: true,
  enumerable: true,
};

// Template literal support
styleDescriptors.template = {
  get() {
    return (str: string): string => {
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
  },
  configurable: true,
  enumerable: true,
};

// Level property
styleDescriptors.level = {
  get() { return getLevel(); },
  set(_v: number) { setLevel(_v as 0 | 1 | 2 | 3); },
  enumerable: true,
};

// Create the shared prototype ONCE
const proto = Object.defineProperties(() => {}, styleDescriptors);
Object.setPrototypeOf(proto, Function.prototype);

// ── Builder factory ────────────────────────────────────────────────

function createBuilder(styler?: Styler): SpectraInstance {
  // Hot path: single argument uses implicit coercion (faster than String())
  const builder = (...text: unknown[]): string => {
    const str = (text.length === 1) ? '' + text[0] : text.map(t => String(t)).join(' ');
    return applyStyle(builder, str);
  };

  Object.setPrototypeOf(builder, proto);
  (builder as any)[STYLER] = styler;

  return builder as SpectraInstance;
}

const spectra: SpectraInstance = createBuilder();

export default spectra;
export { spectra };
export type { SpectraInstance };
