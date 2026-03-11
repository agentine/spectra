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
