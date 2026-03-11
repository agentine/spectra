import { describe, it, expect } from 'vitest';
import {
  modifiers,
  fgColors,
  bgColors,
  ansi256,
  bgAnsi256,
  rgb,
  bgRgb,
  rgbToAnsi256,
  hexToRgb,
  styles,
} from '../src/styles.js';

describe('styles', () => {
  describe('modifiers', () => {
    it('bold produces correct open/close', () => {
      expect(modifiers.bold.open).toBe('\x1b[1m');
      expect(modifiers.bold.close).toBe('\x1b[22m');
    });

    it('dim produces correct codes', () => {
      expect(modifiers.dim.open).toBe('\x1b[2m');
      expect(modifiers.dim.close).toBe('\x1b[22m');
    });

    it('italic produces correct codes', () => {
      expect(modifiers.italic.open).toBe('\x1b[3m');
      expect(modifiers.italic.close).toBe('\x1b[23m');
    });

    it('underline produces correct codes', () => {
      expect(modifiers.underline.open).toBe('\x1b[4m');
      expect(modifiers.underline.close).toBe('\x1b[24m');
    });

    it('inverse produces correct codes', () => {
      expect(modifiers.inverse.open).toBe('\x1b[7m');
      expect(modifiers.inverse.close).toBe('\x1b[27m');
    });

    it('hidden produces correct codes', () => {
      expect(modifiers.hidden.open).toBe('\x1b[8m');
      expect(modifiers.hidden.close).toBe('\x1b[28m');
    });

    it('strikethrough produces correct codes', () => {
      expect(modifiers.strikethrough.open).toBe('\x1b[9m');
      expect(modifiers.strikethrough.close).toBe('\x1b[29m');
    });

    it('overline produces correct codes', () => {
      expect(modifiers.overline.open).toBe('\x1b[53m');
      expect(modifiers.overline.close).toBe('\x1b[55m');
    });

    it('reset produces correct codes', () => {
      expect(modifiers.reset.open).toBe('\x1b[0m');
      expect(modifiers.reset.close).toBe('\x1b[0m');
    });
  });

  describe('foreground colors', () => {
    it('red uses code 31', () => {
      expect(fgColors.red.open).toBe('\x1b[31m');
      expect(fgColors.red.close).toBe('\x1b[39m');
    });

    it('green uses code 32', () => {
      expect(fgColors.green.open).toBe('\x1b[32m');
    });

    it('all standard fg colors produce valid codes', () => {
      const expected: Record<string, number> = {
        black: 30, red: 31, green: 32, yellow: 33,
        blue: 34, magenta: 35, cyan: 36, white: 37,
      };
      for (const [name, code] of Object.entries(expected)) {
        expect((fgColors as Record<string, { open: string }>)[name].open).toBe(`\x1b[${code}m`);
      }
    });

    it('bright colors use 90-97 range', () => {
      expect(fgColors.redBright.open).toBe('\x1b[91m');
      expect(fgColors.whiteBright.open).toBe('\x1b[97m');
    });

    it('gray/grey are aliases for blackBright', () => {
      expect(fgColors.gray.open).toBe(fgColors.blackBright.open);
      expect(fgColors.grey.open).toBe(fgColors.blackBright.open);
    });

    it('all fg colors close with 39', () => {
      for (const pair of Object.values(fgColors)) {
        expect(pair.close).toBe('\x1b[39m');
      }
    });
  });

  describe('background colors', () => {
    it('bgRed uses code 41', () => {
      expect(bgColors.bgRed.open).toBe('\x1b[41m');
      expect(bgColors.bgRed.close).toBe('\x1b[49m');
    });

    it('all bg colors close with 49', () => {
      for (const pair of Object.values(bgColors)) {
        expect(pair.close).toBe('\x1b[49m');
      }
    });

    it('bright bg colors use 100-107 range', () => {
      expect(bgColors.bgRedBright.open).toBe('\x1b[101m');
      expect(bgColors.bgWhiteBright.open).toBe('\x1b[107m');
    });
  });

  describe('256-color', () => {
    it('ansi256 generates correct escape', () => {
      expect(ansi256(196).open).toBe('\x1b[38;5;196m');
      expect(ansi256(196).close).toBe('\x1b[39m');
    });

    it('bgAnsi256 generates correct escape', () => {
      expect(bgAnsi256(21).open).toBe('\x1b[48;5;21m');
      expect(bgAnsi256(21).close).toBe('\x1b[49m');
    });
  });

  describe('truecolor RGB', () => {
    it('rgb generates correct escape', () => {
      expect(rgb(255, 136, 0).open).toBe('\x1b[38;2;255;136;0m');
      expect(rgb(255, 136, 0).close).toBe('\x1b[39m');
    });

    it('bgRgb generates correct escape', () => {
      expect(bgRgb(0, 128, 255).open).toBe('\x1b[48;2;0;128;255m');
      expect(bgRgb(0, 128, 255).close).toBe('\x1b[49m');
    });
  });

  describe('rgbToAnsi256', () => {
    it('maps pure black to 16', () => {
      expect(rgbToAnsi256(0, 0, 0)).toBe(16);
    });

    it('maps pure white to 231', () => {
      expect(rgbToAnsi256(255, 255, 255)).toBe(231);
    });

    it('maps mid-gray to grayscale range', () => {
      const result = rgbToAnsi256(128, 128, 128);
      expect(result).toBeGreaterThanOrEqual(232);
      expect(result).toBeLessThanOrEqual(255);
    });

    it('maps pure red to color cube', () => {
      const result = rgbToAnsi256(255, 0, 0);
      expect(result).toBe(196); // 16 + 36*5 + 6*0 + 0
    });
  });

  describe('hexToRgb', () => {
    it('parses 6-digit hex', () => {
      expect(hexToRgb('#ff8800')).toEqual([255, 136, 0]);
    });

    it('parses without #', () => {
      expect(hexToRgb('ff8800')).toEqual([255, 136, 0]);
    });

    it('parses 3-digit hex', () => {
      expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
    });

    it('parses 3-digit hex without #', () => {
      expect(hexToRgb('f80')).toEqual([255, 136, 0]);
    });
  });

  describe('combined styles object', () => {
    it('includes modifiers', () => {
      expect(styles.bold).toBe(modifiers.bold);
    });

    it('includes fg colors', () => {
      expect(styles.red).toBe(fgColors.red);
    });

    it('includes bg colors', () => {
      expect(styles.bgRed).toBe(bgColors.bgRed);
    });

    it('includes dynamic functions', () => {
      expect(typeof styles.ansi256).toBe('function');
      expect(typeof styles.rgb).toBe('function');
      expect(typeof styles.bgRgb).toBe('function');
    });
  });
});
