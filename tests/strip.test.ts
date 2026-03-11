import { describe, it, expect } from 'vitest';
import { strip, hasAnsi, ansiRegex } from '../src/strip.js';

describe('strip', () => {
  describe('strip()', () => {
    it('removes SGR color codes', () => {
      expect(strip('\x1b[31mhello\x1b[39m')).toBe('hello');
    });

    it('removes bold/modifier codes', () => {
      expect(strip('\x1b[1m\x1b[4mbold underline\x1b[24m\x1b[22m')).toBe('bold underline');
    });

    it('removes 256-color codes', () => {
      expect(strip('\x1b[38;5;196mred\x1b[39m')).toBe('red');
    });

    it('removes truecolor RGB codes', () => {
      expect(strip('\x1b[38;2;255;0;0mred\x1b[39m')).toBe('red');
    });

    it('removes background color codes', () => {
      expect(strip('\x1b[41mred bg\x1b[49m')).toBe('red bg');
    });

    it('preserves non-ANSI text', () => {
      expect(strip('hello world')).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(strip('')).toBe('');
    });

    it('removes multiple ANSI codes in one string', () => {
      expect(strip('\x1b[31mred\x1b[39m and \x1b[32mgreen\x1b[39m')).toBe('red and green');
    });

    it('removes nested/overlapping codes', () => {
      expect(strip('\x1b[31m\x1b[1mbold red\x1b[22m\x1b[39m')).toBe('bold red');
    });

    it('removes CSI cursor movement sequences', () => {
      expect(strip('\x1b[2Aup two\x1b[3Bdown three')).toBe('up twodown three');
    });

    it('removes OSC sequences (terminal title)', () => {
      expect(strip('\x1b]0;My Title\x07text')).toBe('text');
    });

    it('removes OSC hyperlink sequences', () => {
      expect(strip('\x1b]8;;https://example.com\x07link\x1b]8;;\x07')).toBe('link');
    });

    it('removes reset code', () => {
      expect(strip('\x1b[0mreset\x1b[0m')).toBe('reset');
    });
  });

  describe('hasAnsi()', () => {
    it('returns true for string with ANSI codes', () => {
      expect(hasAnsi('\x1b[31mhello\x1b[39m')).toBe(true);
    });

    it('returns false for plain string', () => {
      expect(hasAnsi('hello world')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasAnsi('')).toBe(false);
    });

    it('returns true for 256-color codes', () => {
      expect(hasAnsi('\x1b[38;5;196mred\x1b[39m')).toBe(true);
    });

    it('returns true for CSI sequences', () => {
      expect(hasAnsi('\x1b[2A')).toBe(true);
    });

    it('returns true for OSC sequences', () => {
      expect(hasAnsi('\x1b]0;title\x07')).toBe(true);
    });
  });

  describe('ansiRegex()', () => {
    it('returns a RegExp', () => {
      expect(ansiRegex()).toBeInstanceOf(RegExp);
    });

    it('matches SGR codes', () => {
      const matches = '\x1b[31mhello\x1b[39m'.match(ansiRegex());
      expect(matches).toHaveLength(2);
      expect(matches![0]).toBe('\x1b[31m');
      expect(matches![1]).toBe('\x1b[39m');
    });

    it('matches 256-color codes', () => {
      const matches = '\x1b[38;5;196m'.match(ansiRegex());
      expect(matches).toHaveLength(1);
      expect(matches![0]).toBe('\x1b[38;5;196m');
    });

    it('matches truecolor codes', () => {
      const matches = '\x1b[38;2;255;0;0m'.match(ansiRegex());
      expect(matches).toHaveLength(1);
      expect(matches![0]).toBe('\x1b[38;2;255;0;0m');
    });

    it('matches OSC sequences terminated by BEL', () => {
      const matches = '\x1b]0;My Title\x07'.match(ansiRegex());
      expect(matches).toHaveLength(1);
    });

    it('matches cursor movement', () => {
      const matches = '\x1b[5A'.match(ansiRegex());
      expect(matches).toHaveLength(1);
      expect(matches![0]).toBe('\x1b[5A');
    });

    it('does not match plain text', () => {
      const matches = 'hello world'.match(ansiRegex());
      expect(matches).toBeNull();
    });
  });
});
