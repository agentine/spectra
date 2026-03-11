import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import spectra from '../src/index.js';

describe('spectra', () => {
  beforeEach(() => {
    // Force level 3 for consistent test output
    spectra.level = 3;
  });

  describe('basic styling', () => {
    it('red wraps text with red ANSI codes', () => {
      const result = spectra.red('hello');
      expect(result).toBe('\x1b[31mhello\x1b[39m');
    });

    it('bold wraps text with bold ANSI codes', () => {
      const result = spectra.bold('hello');
      expect(result).toBe('\x1b[1mhello\x1b[22m');
    });

    it('green wraps text correctly', () => {
      const result = spectra.green('ok');
      expect(result).toBe('\x1b[32mok\x1b[39m');
    });

    it('bgRed wraps text with background color', () => {
      const result = spectra.bgRed('alert');
      expect(result).toBe('\x1b[41malert\x1b[49m');
    });
  });

  describe('chaining', () => {
    it('red.bold chains styles', () => {
      const result = spectra.red.bold('Error');
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('\x1b[1m');
      expect(result).toContain('Error');
    });

    it('bold.underline.blue chains three styles', () => {
      const result = spectra.bold.underline.blue('styled');
      expect(result).toContain('\x1b[1m');
      expect(result).toContain('\x1b[4m');
      expect(result).toContain('\x1b[34m');
      expect(result).toContain('styled');
    });
  });

  describe('nesting', () => {
    it('handles nested styles', () => {
      const result = spectra.red(`a ${spectra.bold('b')} c`);
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('\x1b[1m');
      expect(result).toContain('b');
      // After bold closes, red should resume
      expect(result).toContain('\x1b[22m');
    });

    it('close+reopen: outer fg color resumes after nested fg color closes', () => {
      const result = spectra.red(`a ${spectra.blue('b')} c`);
      // Inner blue close (\x1b[39m) should be replaced with close+reopen (\x1b[39m\x1b[31m)
      // so outer red resumes after the inner blue section
      expect(result).toBe('\x1b[31ma \x1b[34mb\x1b[39m\x1b[31m c\x1b[39m');
    });
  });

  describe('hex colors', () => {
    it('hex applies truecolor', () => {
      const result = spectra.hex('#ff6600')('orange');
      expect(result).toContain('\x1b[38;2;255;102;0m');
      expect(result).toContain('orange');
    });

    it('bgHex applies background truecolor', () => {
      const result = spectra.bgHex('#0000ff')('on blue');
      expect(result).toContain('\x1b[48;2;0;0;255m');
    });
  });

  describe('rgb colors', () => {
    it('rgb applies truecolor', () => {
      const result = spectra.rgb(255, 136, 0)('warm');
      expect(result).toContain('\x1b[38;2;255;136;0m');
    });

    it('bgRgb applies background truecolor', () => {
      const result = spectra.bgRgb(0, 128, 255)('cool');
      expect(result).toContain('\x1b[48;2;0;128;255m');
    });
  });

  describe('hsl colors', () => {
    it('hsl converts and applies', () => {
      const result = spectra.hsl(0, 100, 50)('red-ish');
      // HSL(0, 100, 50) should be pure red (255, 0, 0)
      expect(result).toContain('\x1b[38;2;255;0;0m');
    });
  });

  describe('hsv colors', () => {
    it('hsv converts and applies', () => {
      const result = spectra.hsv(0, 100, 100)('red-ish');
      // HSV(0, 100, 100) should be pure red (255, 0, 0)
      expect(result).toContain('\x1b[38;2;255;0;0m');
    });

    it('bgHsv applies background color', () => {
      const result = spectra.bgHsv(120, 100, 100)('on green');
      // HSV(120, 100, 100) should be pure green (0, 255, 0)
      expect(result).toContain('\x1b[48;2;0;255;0m');
    });
  });

  describe('hwb colors', () => {
    it('hwb converts and applies', () => {
      const result = spectra.hwb(0, 0, 0)('red-ish');
      // HWB(0, 0, 0) should be pure red (255, 0, 0)
      expect(result).toContain('\x1b[38;2;255;0;0m');
    });

    it('bgHwb applies background color', () => {
      const result = spectra.bgHwb(240, 0, 0)('on blue');
      // HWB(240, 0, 0) should be pure blue (0, 0, 255)
      expect(result).toContain('\x1b[48;2;0;0;255m');
    });
  });

  describe('ansi256', () => {
    it('ansi256 applies 256-color code', () => {
      const result = spectra.ansi256(196)('bright red');
      expect(result).toContain('\x1b[38;5;196m');
    });

    it('bgAnsi256 applies background 256-color', () => {
      const result = spectra.bgAnsi256(21)('on blue');
      expect(result).toContain('\x1b[48;5;21m');
    });
  });

  describe('level property', () => {
    it('level 0 produces no ANSI codes', () => {
      spectra.level = 0;
      const result = spectra.red('no color');
      expect(result).toBe('no color');
    });

    it('level can be set and read back', () => {
      spectra.level = 2;
      expect(spectra.level).toBe(2);
    });
  });

  describe('level downgrading', () => {
    it('level 1 downgrades rgb to basic 16-color fg code', () => {
      spectra.level = 1;
      const result = spectra.rgb(255, 0, 0)('red');
      // Should emit a basic ANSI code (30-37 or 90-97), not 256-color
      expect(result).not.toContain('\x1b[38;5;');
      expect(result).not.toContain('\x1b[38;2;');
      expect(result).toMatch(/\x1b\[(3[0-7]|9[0-7])m/);
      expect(result).toContain('red');
    });

    it('level 1 downgrades hex to basic 16-color fg code', () => {
      spectra.level = 1;
      const result = spectra.hex('#00ff00')('green');
      expect(result).not.toContain('\x1b[38;5;');
      expect(result).not.toContain('\x1b[38;2;');
      expect(result).toMatch(/\x1b\[(3[0-7]|9[0-7])m/);
    });

    it('level 1 downgrades rgb to basic 16-color bg code', () => {
      spectra.level = 1;
      const result = spectra.bgRgb(255, 0, 0)('red bg');
      expect(result).not.toContain('\x1b[48;5;');
      expect(result).not.toContain('\x1b[48;2;');
      expect(result).toMatch(/\x1b\[(4[0-7]|10[0-7])m/);
    });

    it('level 2 downgrades rgb to 256-color code', () => {
      spectra.level = 2;
      const result = spectra.rgb(255, 136, 0)('orange');
      expect(result).toContain('\x1b[38;5;');
      expect(result).not.toContain('\x1b[38;2;');
    });

    it('level 2 downgrades hex to 256-color code', () => {
      spectra.level = 2;
      const result = spectra.hex('#ff8800')('orange');
      expect(result).toContain('\x1b[38;5;');
      expect(result).not.toContain('\x1b[38;2;');
    });
  });

  describe('template', () => {
    it('parses simple template', () => {
      const result = spectra.template('{red hello}');
      expect(result).toBe('\x1b[31mhello\x1b[39m');
    });

    it('parses chained styles in template', () => {
      const result = spectra.template('{bold.red Error}');
      expect(result).toContain('\x1b[1m');
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('Error');
    });

    it('handles multiple template expressions', () => {
      const result = spectra.template('{red Error:} {yellow warning}');
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('\x1b[33m');
    });

    it('passes through non-template text', () => {
      const result = spectra.template('plain text');
      expect(result).toBe('plain text');
    });

    it('unknown style names apply no styling', () => {
      const result = spectra.template('{nonexistent hello}');
      expect(result).toBe('hello');
    });

    it('prototype chain names do not match as styles', () => {
      const result1 = spectra.template('{constructor text}');
      expect(result1).toBe('text');
      const result2 = spectra.template('{hasOwnProperty text}');
      expect(result2).toBe('text');
      const result3 = spectra.template('{__proto__ text}');
      expect(result3).toBe('text');
    });
  });

  describe('multiple arguments', () => {
    it('joins multiple arguments with spaces', () => {
      const result = spectra.red('hello', 'world');
      expect(result).toBe('\x1b[31mhello world\x1b[39m');
    });
  });

  describe('gray/grey aliases', () => {
    it('gray produces same output as blackBright', () => {
      expect(spectra.gray('test')).toBe(spectra.blackBright('test'));
    });

    it('grey produces same output as gray', () => {
      expect(spectra.grey('test')).toBe(spectra.gray('test'));
    });
  });
});
