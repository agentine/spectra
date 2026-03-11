import { describe, it, expect } from 'vitest';
import { wrapAnsi, sliceAnsi, truncateAnsi } from '../src/wrap.js';
import { strip } from '../src/strip.js';

describe('wrapAnsi', () => {
  describe('plain text wrapping', () => {
    it('wraps text at the given column', () => {
      const result = wrapAnsi('hello world foo bar', 10);
      const lines = result.split('\n');
      expect(lines[0]).toBe('hello');
      expect(lines[1]).toBe('world foo');
    });

    it('does not wrap text shorter than columns', () => {
      expect(wrapAnsi('short', 20)).toBe('short');
    });

    it('handles empty string', () => {
      expect(wrapAnsi('', 10)).toBe('');
    });

    it('preserves existing newlines', () => {
      const result = wrapAnsi('line1\nline2', 20);
      expect(result).toBe('line1\nline2');
    });

    it('hard breaks long words when hard option is true', () => {
      const result = wrapAnsi('abcdefghij', 5, { hard: true });
      const lines = result.split('\n');
      expect(lines[0]).toBe('abcde');
      expect(lines[1]).toBe('fghij');
    });

    it('does not break long words without hard option', () => {
      const result = wrapAnsi('abcdefghij', 5);
      expect(result).toBe('abcdefghij');
    });
  });

  describe('ANSI-aware wrapping', () => {
    it('preserves ANSI codes across line breaks', () => {
      const styled = '\x1b[31mhello world foo\x1b[39m';
      const result = wrapAnsi(styled, 10);
      // Each line should still have red styling
      expect(result).toContain('\x1b[31m');
    });

    it('stripped result has correct visible content', () => {
      const styled = '\x1b[31mhello world\x1b[39m';
      const result = wrapAnsi(styled, 6);
      const lines = result.split('\n');
      expect(strip(lines[0])).toBe('hello');
      expect(strip(lines[1])).toBe('world');
    });

    it('re-applies ANSI state correctly on wrapped lines', () => {
      const styled = '\x1b[31mhello world\x1b[39m';
      const result = wrapAnsi(styled, 6);
      const lines = result.split('\n');
      // Second line should start with the red code re-applied
      expect(lines[1]).toMatch(/^\x1b\[31m/);
    });
  });

  describe('trim option', () => {
    it('trim: false preserves trailing whitespace', () => {
      const result = wrapAnsi('hello    world', 8, { trim: false });
      const lines = result.split('\n');
      // With trim: false, trailing spaces on first line should be preserved
      expect(lines[0]).toMatch(/\s$/);
    });
  });

  describe('tab handling', () => {
    it('treats tab characters as whitespace word separators', () => {
      const result = wrapAnsi('hello\tworld', 6);
      const lines = result.split('\n');
      expect(strip(lines[0])).toMatch(/hello/);
    });
  });
});

describe('sliceAnsi', () => {
  it('slices plain text correctly', () => {
    expect(sliceAnsi('hello world', 0, 5)).toBe('hello');
  });

  it('slices from middle of string', () => {
    expect(sliceAnsi('hello world', 6, 11)).toBe('world');
  });

  it('returns visible substring from styled string', () => {
    const styled = '\x1b[31mhello world\x1b[39m';
    const result = sliceAnsi(styled, 0, 5);
    expect(strip(result)).toBe('hello');
  });

  it('preserves ANSI state across slice boundary', () => {
    const styled = '\x1b[31mhello world\x1b[39m';
    const result = sliceAnsi(styled, 6, 11);
    expect(strip(result)).toBe('world');
    // Should contain the red code to restore state
    expect(result).toContain('\x1b[31m');
  });

  it('handles empty string', () => {
    expect(sliceAnsi('', 0, 5)).toBe('');
  });

  it('handles string shorter than end', () => {
    expect(sliceAnsi('hi', 0, 10)).toBe('hi');
  });

  it('slices with only start (no end)', () => {
    expect(sliceAnsi('hello world', 6)).toBe('world');
  });
});

describe('truncateAnsi', () => {
  it('returns original string if shorter than maxLength', () => {
    expect(truncateAnsi('hello', 10)).toBe('hello');
  });

  it('truncates plain text at maxLength', () => {
    const result = truncateAnsi('hello world', 5);
    expect(strip(result)).toBe('hello');
  });

  it('appends ellipsis when truncated', () => {
    const result = truncateAnsi('hello world', 8, '...');
    expect(strip(result)).toBe('hello...');
  });

  it('truncates styled string correctly', () => {
    const styled = '\x1b[31mhello world\x1b[39m';
    const result = truncateAnsi(styled, 5);
    expect(strip(result)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(truncateAnsi('', 5)).toBe('');
  });

  it('handles maxLength of 0', () => {
    expect(truncateAnsi('hello', 0)).toBe('');
  });

  it('handles ellipsis longer than maxLength', () => {
    const result = truncateAnsi('hello world', 2, '...');
    expect(result).toBe('..');
  });
});
