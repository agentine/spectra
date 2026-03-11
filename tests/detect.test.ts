import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { colorLevel, detectColors, supportsHyperlinks } from '../src/detect.js';

describe('detect', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  function setEnv(overrides: Record<string, string | undefined>) {
    // Clear detection-relevant vars first
    delete process.env['FORCE_COLOR'];
    delete process.env['NO_COLOR'];
    delete process.env['TERM'];
    delete process.env['COLORTERM'];
    delete process.env['TERM_PROGRAM'];
    delete process.env['TERM_PROGRAM_VERSION'];
    delete process.env['WT_SESSION'];
    delete process.env['CI'];
    delete process.env['GITHUB_ACTIONS'];
    delete process.env['TRAVIS'];
    delete process.env['FORCE_HYPERLINK'];
    delete process.env['VTE_VERSION'];

    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }

  const ttyStream = { isTTY: true } as const;
  const nonTtyStream = { isTTY: false } as const;

  describe('FORCE_COLOR', () => {
    it('FORCE_COLOR=0 returns level 0', () => {
      setEnv({ FORCE_COLOR: '0' });
      expect(colorLevel(ttyStream)).toBe(0);
    });

    it('FORCE_COLOR=1 returns level 1', () => {
      setEnv({ FORCE_COLOR: '1' });
      expect(colorLevel(nonTtyStream)).toBe(1);
    });

    it('FORCE_COLOR=2 returns level 2', () => {
      setEnv({ FORCE_COLOR: '2' });
      expect(colorLevel(nonTtyStream)).toBe(2);
    });

    it('FORCE_COLOR=3 returns level 3', () => {
      setEnv({ FORCE_COLOR: '3' });
      expect(colorLevel(nonTtyStream)).toBe(3);
    });

    it('FORCE_COLOR=true returns level 1', () => {
      setEnv({ FORCE_COLOR: 'true' });
      expect(colorLevel(nonTtyStream)).toBe(1);
    });

    it('FORCE_COLOR="" returns level 1', () => {
      setEnv({ FORCE_COLOR: '' });
      expect(colorLevel(nonTtyStream)).toBe(1);
    });
  });

  describe('NO_COLOR', () => {
    it('NO_COLOR disables color', () => {
      setEnv({ NO_COLOR: '' });
      expect(colorLevel(ttyStream)).toBe(0);
    });

    it('NO_COLOR takes precedence over TERM', () => {
      setEnv({ NO_COLOR: '', TERM: 'xterm-256color' });
      expect(colorLevel(ttyStream)).toBe(0);
    });
  });

  describe('TTY detection', () => {
    it('non-TTY without FORCE_COLOR returns 0', () => {
      setEnv({});
      expect(colorLevel(nonTtyStream)).toBe(0);
    });

    it('no stream returns 0', () => {
      setEnv({});
      expect(colorLevel()).toBe(0);
    });
  });

  describe('TERM/COLORTERM detection', () => {
    it('COLORTERM=truecolor returns level 3', () => {
      setEnv({ COLORTERM: 'truecolor' });
      expect(colorLevel(ttyStream)).toBe(3);
    });

    it('COLORTERM=24bit returns level 3', () => {
      setEnv({ COLORTERM: '24bit' });
      expect(colorLevel(ttyStream)).toBe(3);
    });

    it('TERM=xterm-256color returns level 2', () => {
      setEnv({ TERM: 'xterm-256color' });
      expect(colorLevel(ttyStream)).toBe(2);
    });

    it('TERM=xterm returns level 1', () => {
      setEnv({ TERM: 'xterm' });
      expect(colorLevel(ttyStream)).toBe(1);
    });

    it('TERM=dumb returns level 0', () => {
      setEnv({ TERM: 'dumb' });
      expect(colorLevel(ttyStream)).toBe(0);
    });
  });

  describe('CI detection', () => {
    it('CI + GITHUB_ACTIONS returns level 1', () => {
      setEnv({ CI: 'true', GITHUB_ACTIONS: 'true' });
      expect(colorLevel(ttyStream)).toBe(1);
    });

    it('CI alone returns level 0', () => {
      setEnv({ CI: 'true' });
      expect(colorLevel(ttyStream)).toBe(0);
    });
  });

  describe('--no-color flag', () => {
    it('--no-color argv returns level 0', () => {
      process.argv = ['node', 'script.js', '--no-color'];
      setEnv({});
      expect(colorLevel(ttyStream)).toBe(0);
    });
  });

  describe('detectColors', () => {
    it('returns ColorSupport object', () => {
      setEnv({ FORCE_COLOR: '3' });
      const result = detectColors(ttyStream);
      expect(result.level).toBe(3);
      expect(result.has256).toBe(true);
      expect(result.has16m).toBe(true);
    });

    it('level 1 has no 256 or 16m', () => {
      setEnv({ FORCE_COLOR: '1' });
      const result = detectColors(ttyStream);
      expect(result.level).toBe(1);
      expect(result.has256).toBe(false);
      expect(result.has16m).toBe(false);
    });

    it('level 2 has 256 but no 16m', () => {
      setEnv({ FORCE_COLOR: '2' });
      const result = detectColors(ttyStream);
      expect(result.level).toBe(2);
      expect(result.has256).toBe(true);
      expect(result.has16m).toBe(false);
    });
  });

  describe('supportsHyperlinks', () => {
    it('returns false for non-TTY', () => {
      setEnv({});
      expect(supportsHyperlinks(nonTtyStream)).toBe(false);
    });

    it('FORCE_HYPERLINK=1 returns true', () => {
      setEnv({ FORCE_HYPERLINK: '1' });
      expect(supportsHyperlinks(nonTtyStream)).toBe(true);
    });

    it('FORCE_HYPERLINK=0 returns false', () => {
      setEnv({ FORCE_HYPERLINK: '0' });
      expect(supportsHyperlinks(ttyStream)).toBe(false);
    });

    it('iTerm returns true', () => {
      setEnv({ TERM_PROGRAM: 'iTerm.app' });
      expect(supportsHyperlinks(ttyStream)).toBe(true);
    });

    it('WT_SESSION returns true', () => {
      setEnv({ WT_SESSION: 'some-id' });
      expect(supportsHyperlinks(ttyStream)).toBe(true);
    });
  });
});
