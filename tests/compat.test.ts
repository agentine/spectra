/**
 * Chalk compatibility test suite.
 *
 * Verifies that spectra produces identical ANSI output to chalk for all
 * documented behaviors.  Goal: s/chalk/spectra/g should work for real-world
 * chalk usage.
 *
 * Expected values are the exact ANSI sequences chalk 5.x emits (level 3).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import spectra from '../src/index.js';

// Shorthand helpers for building expected ANSI strings
const ESC = '\x1b[';
const m = 'm';
const open = (n: number) => `${ESC}${n}${m}`;
const close = (n: number) => `${ESC}${n}${m}`;

// Chalk ANSI code map — identical to chalk 5.x output at level 3
const CODES: Record<string, [number, number]> = {
  // Modifiers
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],
  overline: [53, 55],

  // Foreground colors
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  blackBright: [90, 39],
  gray: [90, 39],
  grey: [90, 39],
  redBright: [91, 39],
  greenBright: [92, 39],
  yellowBright: [93, 39],
  blueBright: [94, 39],
  magentaBright: [95, 39],
  cyanBright: [96, 39],
  whiteBright: [97, 39],

  // Background colors
  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],
  bgBlackBright: [100, 49],
  bgGray: [100, 49],
  bgGrey: [100, 49],
  bgRedBright: [101, 49],
  bgGreenBright: [102, 49],
  bgYellowBright: [103, 49],
  bgBlueBright: [104, 49],
  bgMagentaBright: [105, 49],
  bgCyanBright: [106, 49],
  bgWhiteBright: [107, 49],
};

describe('chalk compatibility', () => {
  beforeEach(() => {
    spectra.level = 3;
  });

  // ──────────────────────────────────────────────
  // 1. All chalk style names produce identical ANSI
  // ──────────────────────────────────────────────
  describe('all style names produce identical ANSI codes to chalk', () => {
    for (const [name, [o, c]] of Object.entries(CODES)) {
      it(`spectra.${name}("text") === chalk.${name}("text")`, () => {
        const s = spectra as unknown as Record<string, (t: string) => string>;
        const result = s[name]('text');
        expect(result).toBe(`${open(o)}text${close(c)}`);
      });
    }
  });

  // ──────────────────────────────────────────────
  // 2. Chaining order matches chalk
  // ──────────────────────────────────────────────
  describe('chaining order', () => {
    it('spectra.red.bold === chalk.red.bold — outer red wraps inner bold', () => {
      const result = spectra.red.bold('text');
      // chalk applies outer first: red(bold(text))
      expect(result).toBe(
        `${open(31)}${open(1)}text${close(22)}${close(39)}`
      );
    });

    it('spectra.bold.red === chalk.bold.red — outer bold wraps inner red', () => {
      const result = spectra.bold.red('text');
      expect(result).toBe(
        `${open(1)}${open(31)}text${close(39)}${close(22)}`
      );
    });

    it('three-way chain: spectra.bold.underline.blue', () => {
      const result = spectra.bold.underline.blue('text');
      expect(result).toBe(
        `${open(1)}${open(4)}${open(34)}text${close(39)}${close(24)}${close(22)}`
      );
    });

    it('modifier + fg + bg chain', () => {
      const result = spectra.italic.red.bgWhite('text');
      expect(result).toBe(
        `${open(3)}${open(31)}${open(47)}text${close(49)}${close(39)}${close(23)}`
      );
    });

    it('chaining is immutable — does not mutate the base instance', () => {
      const red = spectra.red;
      const redBold = red.bold;
      // red instance should still work independently
      expect(red('a')).toBe(`${open(31)}a${close(39)}`);
      expect(redBold('b')).toBe(`${open(31)}${open(1)}b${close(22)}${close(39)}`);
    });
  });

  // ──────────────────────────────────────────────
  // 3. Nesting behavior
  // ──────────────────────────────────────────────
  describe('nesting', () => {
    it('nested fg color: red wrapping blue — blue close re-opens red', () => {
      const result = spectra.red('a ' + spectra.blue('b') + ' c');
      // chalk output: red opens, then blue opens for "b", blue closes (fg reset),
      // red re-opens for " c", then red closes
      expect(result).toBe(
        `${open(31)}a ${open(34)}b${close(39)}${open(31)} c${close(39)}`
      );
    });

    it('nested modifier: bold wrapping dim', () => {
      const result = spectra.bold('a ' + spectra.dim('b') + ' c');
      // dim close (22) is same as bold close — chalk re-opens bold after dim closes
      expect(result).toBe(
        `${open(1)}a ${open(2)}b${close(22)}${open(1)} c${close(22)}`
      );
    });

    it('nested bg color: bgRed wrapping bgBlue', () => {
      const result = spectra.bgRed('a ' + spectra.bgBlue('b') + ' c');
      expect(result).toBe(
        `${open(41)}a ${open(44)}b${close(49)}${open(41)} c${close(49)}`
      );
    });

    it('deeply nested: red(bold(underline("x")))', () => {
      const result = spectra.red('a ' + spectra.bold('b ' + spectra.underline('c') + ' d') + ' e');
      // Underline closes with 24, bold close (22) re-opens after underline section
      const inner = `${open(4)}c${close(24)}`;
      const mid = `${open(1)}b ${inner} d${close(22)}`;
      // bold close (22) doesn't conflict with red close (39), no re-open needed for red around bold
      expect(result).toBe(`${open(31)}a ${mid} e${close(39)}`);
    });

    it('same-close nesting: bold inside dim (both close with 22)', () => {
      // When inner close === outer close, outer must re-open
      const result = spectra.dim('before ' + spectra.bold('inside') + ' after');
      expect(result).toBe(
        `${open(2)}before ${open(1)}inside${close(22)}${open(2)} after${close(22)}`
      );
    });
  });

  // ──────────────────────────────────────────────
  // 4. Template literal parsing
  // ──────────────────────────────────────────────
  describe('template', () => {
    it('single style', () => {
      expect(spectra.template('{red hello}')).toBe(
        `${open(31)}hello${close(39)}`
      );
    });

    it('chained styles in template', () => {
      const result = spectra.template('{bold.red Error}');
      // bold wrapping red
      expect(result).toBe(
        `${open(1)}${open(31)}Error${close(39)}${close(22)}`
      );
    });

    it('multiple expressions', () => {
      const result = spectra.template('{red Error:} {yellow warning}');
      expect(result).toBe(
        `${open(31)}Error:${close(39)} ${open(33)}warning${close(39)}`
      );
    });

    it('multi-word content: {red hello world}', () => {
      expect(spectra.template('{red hello world}')).toBe(
        `${open(31)}hello world${close(39)}`
      );
    });

    it('plain text passes through unchanged', () => {
      expect(spectra.template('no styles here')).toBe('no styles here');
    });

    it('mixed plain text and styled', () => {
      const result = spectra.template('prefix {green ok} suffix');
      expect(result).toBe(`prefix ${open(32)}ok${close(39)} suffix`);
    });

    it('unknown style names produce unstyled content', () => {
      expect(spectra.template('{potato hello}')).toBe('hello');
    });

    it('background styles in template', () => {
      expect(spectra.template('{bgRed alert}')).toBe(
        `${open(41)}alert${close(49)}`
      );
    });

    it('modifier in template', () => {
      expect(spectra.template('{underline link}')).toBe(
        `${open(4)}link${close(24)}`
      );
    });
  });

  // ──────────────────────────────────────────────
  // 5. Level property (0-3)
  // ──────────────────────────────────────────────
  describe('level property', () => {
    it('level=0 returns unstyled text for all styles', () => {
      spectra.level = 0;

      expect(spectra.red('text')).toBe('text');
      expect(spectra.bold('text')).toBe('text');
      expect(spectra.bgBlue('text')).toBe('text');
      expect(spectra.red.bold.bgYellow('text')).toBe('text');
      expect(spectra.hex('#ff0000')('text')).toBe('text');
      expect(spectra.rgb(255, 0, 0)('text')).toBe('text');
      expect(spectra.ansi256(196)('text')).toBe('text');
    });

    it('level=1 uses basic 16-color codes for rgb/hex', () => {
      spectra.level = 1;

      // Standard named colors still work at level 1
      expect(spectra.red('text')).toBe(`${open(31)}text${close(39)}`);

      // RGB/hex downgrades to basic ANSI (no 256-color or truecolor)
      const rgbResult = spectra.rgb(255, 0, 0)('text');
      expect(rgbResult).not.toContain('38;5;');
      expect(rgbResult).not.toContain('38;2;');
      expect(rgbResult).toMatch(/\x1b\[(3[0-7]|9[0-7])m/);
    });

    it('level=2 uses 256-color codes for rgb/hex', () => {
      spectra.level = 2;

      expect(spectra.red('text')).toBe(`${open(31)}text${close(39)}`);

      const rgbResult = spectra.rgb(255, 136, 0)('text');
      expect(rgbResult).toContain('38;5;');
      expect(rgbResult).not.toContain('38;2;');
    });

    it('level=3 uses truecolor codes for rgb/hex', () => {
      spectra.level = 3;

      const rgbResult = spectra.rgb(255, 136, 0)('text');
      expect(rgbResult).toContain('\x1b[38;2;255;136;0m');
    });

    it('level can be read back', () => {
      spectra.level = 2;
      expect(spectra.level).toBe(2);
      spectra.level = 0;
      expect(spectra.level).toBe(0);
    });

    it('level propagates to chained instances', () => {
      spectra.level = 0;
      expect(spectra.red.bold('text')).toBe('text');
    });
  });

  // ──────────────────────────────────────────────
  // 6. Dynamic color methods produce same codes as chalk
  // ──────────────────────────────────────────────
  describe('dynamic color methods', () => {
    it('hex("#ff6600") produces truecolor', () => {
      expect(spectra.hex('#ff6600')('text')).toBe(
        `\x1b[38;2;255;102;0mtext${close(39)}`
      );
    });

    it('hex without # prefix works', () => {
      expect(spectra.hex('ff6600')('text')).toBe(
        `\x1b[38;2;255;102;0mtext${close(39)}`
      );
    });

    it('hex shorthand (3-char)', () => {
      // #f60 expands to #ff6600
      expect(spectra.hex('#f60')('text')).toBe(
        `\x1b[38;2;255;102;0mtext${close(39)}`
      );
    });

    it('rgb(r, g, b) produces truecolor', () => {
      expect(spectra.rgb(100, 200, 50)('text')).toBe(
        `\x1b[38;2;100;200;50mtext${close(39)}`
      );
    });

    it('hsl(h, s, l) converts correctly', () => {
      // HSL(120, 100, 50) = pure green = RGB(0, 255, 0)
      expect(spectra.hsl(120, 100, 50)('text')).toBe(
        `\x1b[38;2;0;255;0mtext${close(39)}`
      );
    });

    it('ansi256(n) produces 256-color code', () => {
      expect(spectra.ansi256(196)('text')).toBe(
        `\x1b[38;5;196mtext${close(39)}`
      );
    });

    it('bgHex produces background truecolor', () => {
      expect(spectra.bgHex('#0000ff')('text')).toBe(
        `\x1b[48;2;0;0;255mtext${close(49)}`
      );
    });

    it('bgRgb produces background truecolor', () => {
      expect(spectra.bgRgb(100, 200, 50)('text')).toBe(
        `\x1b[48;2;100;200;50mtext${close(49)}`
      );
    });

    it('bgAnsi256 produces background 256-color', () => {
      expect(spectra.bgAnsi256(21)('text')).toBe(
        `\x1b[48;5;21mtext${close(49)}`
      );
    });

    it('dynamic color methods chain with static styles', () => {
      const result = spectra.bold.hex('#ff0000')('text');
      expect(result).toBe(
        `${open(1)}\x1b[38;2;255;0;0mtext${close(39)}${close(22)}`
      );
    });

    it('dynamic bg chains with fg and modifiers', () => {
      const result = spectra.italic.red.bgHex('#00ff00')('text');
      expect(result).toBe(
        `${open(3)}${open(31)}\x1b[48;2;0;255;0mtext${close(49)}${close(39)}${close(23)}`
      );
    });
  });

  // ──────────────────────────────────────────────
  // 7. Edge cases
  // ──────────────────────────────────────────────
  describe('edge cases', () => {
    it('empty string returns styled empty string', () => {
      // chalk.red("") returns "\x1b[31m\x1b[39m"
      expect(spectra.red('')).toBe(`${open(31)}${close(39)}`);
    });

    it('undefined is coerced to "undefined"', () => {
      expect(spectra.red(undefined)).toBe(`${open(31)}undefined${close(39)}`);
    });

    it('null is coerced to "null"', () => {
      expect(spectra.red(null)).toBe(`${open(31)}null${close(39)}`);
    });

    it('number is coerced to string', () => {
      expect(spectra.red(42)).toBe(`${open(31)}42${close(39)}`);
    });

    it('boolean is coerced to string', () => {
      expect(spectra.red(true)).toBe(`${open(31)}true${close(39)}`);
    });

    it('no arguments returns empty styled string', () => {
      // chalk.red() with no args returns "\x1b[31m\x1b[39m"
      expect(spectra.red()).toBe(`${open(31)}${close(39)}`);
    });

    it('multiple arguments are space-joined', () => {
      expect(spectra.red('hello', 'world')).toBe(
        `${open(31)}hello world${close(39)}`
      );
    });

    it('object is coerced via String()', () => {
      const result = spectra.red({});
      expect(result).toBe(`${open(31)}[object Object]${close(39)}`);
    });

    it('hex throws on invalid color', () => {
      expect(() => spectra.hex('xyz')).toThrow();
    });

    it('newlines in text are preserved', () => {
      expect(spectra.red('line1\nline2')).toBe(
        `${open(31)}line1\nline2${close(39)}`
      );
    });

    it('ANSI codes in input are preserved (not double-escaped)', () => {
      const inner = `${open(34)}blue${close(39)}`;
      const result = spectra.red(inner);
      // red should wrap the whole thing, and inner blue close should trigger red re-open
      expect(result).toContain(open(31));
      expect(result).toContain(open(34));
      expect(result).toContain('blue');
    });
  });

  // ──────────────────────────────────────────────
  // 8. gray/grey aliases match chalk
  // ──────────────────────────────────────────────
  describe('gray/grey aliases', () => {
    it('gray === blackBright (code 90)', () => {
      expect(spectra.gray('text')).toBe(`${open(90)}text${close(39)}`);
    });

    it('grey === gray', () => {
      expect(spectra.grey('text')).toBe(spectra.gray('text'));
    });

    it('bgGray === bgBlackBright (code 100)', () => {
      expect(spectra.bgGray('text')).toBe(`${open(100)}text${close(49)}`);
    });

    it('bgGrey === bgGray', () => {
      expect(spectra.bgGrey('text')).toBe(spectra.bgGray('text'));
    });
  });

  // ──────────────────────────────────────────────
  // 9. Real-world chalk usage patterns
  // ──────────────────────────────────────────────
  describe('real-world chalk usage patterns', () => {
    it('error message pattern: red + bold', () => {
      const msg = spectra.red.bold('Error:') + ' ' + spectra.dim('something went wrong');
      expect(msg).toContain(open(31));
      expect(msg).toContain(open(1));
      expect(msg).toContain('Error:');
      expect(msg).toContain(open(2));
      expect(msg).toContain('something went wrong');
    });

    it('log level colorization pattern', () => {
      const levels: Record<string, (s: string) => string> = {
        error: spectra.red,
        warn: spectra.yellow,
        info: spectra.blue,
        debug: spectra.gray,
      };
      expect(levels.error('ERROR')).toBe(`${open(31)}ERROR${close(39)}`);
      expect(levels.warn('WARN')).toBe(`${open(33)}WARN${close(39)}`);
      expect(levels.info('INFO')).toBe(`${open(34)}INFO${close(39)}`);
      expect(levels.debug('DEBUG')).toBe(`${open(90)}DEBUG${close(39)}`);
    });

    it('table header pattern: bold + underline', () => {
      const header = spectra.bold.underline;
      expect(header('Name')).toBe(
        `${open(1)}${open(4)}Name${close(24)}${close(22)}`
      );
    });

    it('success/failure pattern', () => {
      const pass = spectra.green('✓');
      const fail = spectra.red('✗');
      expect(pass).toBe(`${open(32)}✓${close(39)}`);
      expect(fail).toBe(`${open(31)}✗${close(39)}`);
    });

    it('hex brand color pattern', () => {
      const brand = spectra.hex('#1da1f2'); // Twitter blue
      const result = brand('Follow us');
      expect(result).toContain('\x1b[38;2;29;161;242m');
      expect(result).toContain('Follow us');
    });

    it('conditional coloring based on value', () => {
      const colorize = (n: number) =>
        n > 0 ? spectra.green(`+${n}`) : n < 0 ? spectra.red(`${n}`) : spectra.gray(`${n}`);

      expect(colorize(5)).toBe(`${open(32)}+5${close(39)}`);
      expect(colorize(-3)).toBe(`${open(31)}-3${close(39)}`);
      expect(colorize(0)).toBe(`${open(90)}0${close(39)}`);
    });

    it('complex nesting: colored diff output', () => {
      const added = spectra.green('+  const x = 1;');
      const removed = spectra.red('-  const x = 0;');
      const context = spectra.gray('   const y = 2;');

      expect(added).toBe(`${open(32)}+  const x = 1;${close(39)}`);
      expect(removed).toBe(`${open(31)}-  const x = 0;${close(39)}`);
      expect(context).toBe(`${open(90)}   const y = 2;${close(39)}`);
    });

    it('reusable style instance pattern', () => {
      const error = spectra.bold.red;
      const warning = spectra.bold.yellow;
      const info = spectra.bold.cyan;

      // Instances are reusable — this is a common chalk pattern
      expect(error('fail 1')).toBe(
        `${open(1)}${open(31)}fail 1${close(39)}${close(22)}`
      );
      expect(error('fail 2')).toBe(
        `${open(1)}${open(31)}fail 2${close(39)}${close(22)}`
      );
      expect(warning('caution')).toBe(
        `${open(1)}${open(33)}caution${close(39)}${close(22)}`
      );
      expect(info('note')).toBe(
        `${open(1)}${open(36)}note${close(39)}${close(22)}`
      );
    });
  });
});
