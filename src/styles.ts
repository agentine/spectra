// ANSI escape code generation (replaces ansi-styles)

export interface CodePair {
  open: string;
  close: string;
}

function code(open: number, close: number): CodePair {
  return {
    open: `\x1b[${open}m`,
    close: `\x1b[${close}m`,
  };
}

// Modifiers
export const modifiers = {
  reset: code(0, 0),
  bold: code(1, 22),
  dim: code(2, 22),
  italic: code(3, 23),
  underline: code(4, 24),
  inverse: code(7, 27),
  hidden: code(8, 28),
  strikethrough: code(9, 29),
  overline: code(53, 55),
} as const;

// Foreground colors
export const fgColors = {
  black: code(30, 39),
  red: code(31, 39),
  green: code(32, 39),
  yellow: code(33, 39),
  blue: code(34, 39),
  magenta: code(35, 39),
  cyan: code(36, 39),
  white: code(37, 39),
  blackBright: code(90, 39),
  gray: code(90, 39),
  grey: code(90, 39),
  redBright: code(91, 39),
  greenBright: code(92, 39),
  yellowBright: code(93, 39),
  blueBright: code(94, 39),
  magentaBright: code(95, 39),
  cyanBright: code(96, 39),
  whiteBright: code(97, 39),
} as const;

// Background colors
export const bgColors = {
  bgBlack: code(40, 49),
  bgRed: code(41, 49),
  bgGreen: code(42, 49),
  bgYellow: code(43, 49),
  bgBlue: code(44, 49),
  bgMagenta: code(45, 49),
  bgCyan: code(46, 49),
  bgWhite: code(47, 49),
  bgBlackBright: code(100, 49),
  bgGray: code(100, 49),
  bgGrey: code(100, 49),
  bgRedBright: code(101, 49),
  bgGreenBright: code(102, 49),
  bgYellowBright: code(103, 49),
  bgBlueBright: code(104, 49),
  bgMagentaBright: code(105, 49),
  bgCyanBright: code(106, 49),
  bgWhiteBright: code(107, 49),
} as const;

// 256-color support
export function ansi256(n: number): CodePair {
  return {
    open: `\x1b[38;5;${n}m`,
    close: '\x1b[39m',
  };
}

export function bgAnsi256(n: number): CodePair {
  return {
    open: `\x1b[48;5;${n}m`,
    close: '\x1b[49m',
  };
}

// Truecolor RGB support
export function rgb(r: number, g: number, b: number): CodePair {
  return {
    open: `\x1b[38;2;${r};${g};${b}m`,
    close: '\x1b[39m',
  };
}

export function bgRgb(r: number, g: number, b: number): CodePair {
  return {
    open: `\x1b[48;2;${r};${g};${b}m`,
    close: '\x1b[49m',
  };
}

// Helper: convert RGB to ANSI 256-color index
export function rgbToAnsi256(r: number, g: number, b: number): number {
  // Grayscale check
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }

  return (
    16 +
    36 * Math.round((r / 255) * 5) +
    6 * Math.round((g / 255) * 5) +
    Math.round((b / 255) * 5)
  );
}

// Helper: convert RGB to basic ANSI 16-color code (fg: 30-37, 90-97)
export function rgbToAnsi16(r: number, g: number, b: number): number {
  const value = Math.max(r, g, b);
  // Grayscale
  if (value === Math.min(r, g, b)) {
    return value < 128 ? 30 : 97; // black or white bright
  }
  let ansi = 30 + ((Math.round(b / 255) << 2) | (Math.round(g / 255) << 1) | Math.round(r / 255));
  if (value >= 128) ansi += 60;
  return ansi;
}

// Helper: convert hex string to RGB
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, '');

  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  let r: number, g: number, b: number;

  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }

  return [r, g, b];
}

// Combined styles object
export const styles = {
  ...modifiers,
  ...fgColors,
  ...bgColors,
  ansi256,
  bgAnsi256,
  rgb,
  bgRgb,
} as const;

export default styles;
